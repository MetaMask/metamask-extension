import type { AccountsControllerGetStateAction } from '@metamask/accounts-controller';
import type { Messenger } from '@metamask/messenger';
import type {
  PermissionConstraint,
  PermissionControllerHasPermissionsAction,
  PermissionControllerState,
} from '@metamask/permission-controller';
import log from 'loglevel';
import browser from 'webextension-polyfill';
import type { Runtime } from 'webextension-polyfill';
import {
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_NOTIFICATION,
  ENVIRONMENT_TYPE_FULLSCREEN,
  ENVIRONMENT_TYPE_SIDEPANEL,
  type EnvironmentType,
} from '../../../../shared/constants/app';
import { getPartnerByOrigin } from '../../../../shared/constants/defi-referrals';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import {
  getActiveTabDomainAllowlist,
  getActiveTabDomainForMetrics,
} from '../../../../shared/lib/active-tab-domain-metrics';
import type { FlattenedBackgroundStateProxy } from '../../../../shared/types';
import type { AppStateControllerState } from '../../controllers/app-state-controller';
import { createEventBuilder, trackEvent } from '../../controllers/analytics';
import type { LegacyBackgroundApiServiceHandleDefiReferralAction } from '../../services/legacy-background-api-service-method-action-types';
import { ReferralTriggerType } from '../defi-referrals/createDefiReferralMiddleware';
import { getIframeProperties } from '../getIframeProperties';
import { shouldEmitDappViewedEvent } from '../util';

type DappMetricsActions =
  | AccountsControllerGetStateAction
  | PermissionControllerHasPermissionsAction
  | LegacyBackgroundApiServiceHandleDefiReferralAction;

type DappMetricsMessenger = Messenger<'DappMetrics', DappMetricsActions, never>;

export type DappMetricsController = {
  getState: () => Pick<
    FlattenedBackgroundStateProxy,
    'analyticsId' | 'consentDecisionMade' | 'optedIn'
  >;
  getPermittedAccounts: (origin: string) => string[];
  controllerMessenger: Pick<DappMetricsMessenger, 'call'>;
  permissionController: {
    state: Pick<PermissionControllerState<PermissionConstraint>, 'subjects'>;
  };
  appStateController: {
    state: Pick<AppStateControllerState, 'appActiveTab'>;
  };
  remoteFeatureFlagController: {
    state: NonNullable<Parameters<typeof getActiveTabDomainAllowlist>[0]>;
  };
};

export type CreateDappMetricsDeps = {
  getController: () => DappMetricsController | undefined;
  isAnyUiOpen: () => boolean;
};

export type DappMetricsApi = {
  trackDappView: (remotePort: DappViewRemotePort) => void;
  emitAppOpenedMetricEvent: (environmentType: EnvironmentType) => void;
  shouldEmitAppOpened: (environment: EnvironmentType) => boolean;
  trackAppOpened: (environment: EnvironmentType) => void;
  installOnNavigateToTabListener: () => void;
};

type TabOriginRegistry = Record<number, string>;
type TabFrameRegistry = Record<number, number | undefined>;

type PortSender = NonNullable<Runtime.Port['sender']>;
type PortTab = NonNullable<PortSender['tab']>;
type DappViewRemotePort = {
  sender?: Pick<PortSender, 'url' | 'frameId'> & {
    tab?: Pick<PortTab, 'id' | 'title' | 'url'>;
  };
};

/**
 * @param options - Injected controller accessor and UI presence predicate.
 * @param options.getController - Returns the MetaMask controller when ready.
 * @param options.isAnyUiOpen - True when any MetaMask UI is already open.
 */
export function createDappMetrics({
  getController,
  isAnyUiOpen,
}: CreateDappMetricsDeps): DappMetricsApi {
  const senderOriginMapping: TabOriginRegistry = {};
  const tabOriginMapping: TabOriginRegistry = {};
  const frameIdMapping: TabFrameRegistry = {};

  const requireController = (): DappMetricsController => {
    const controller = getController();
    if (!controller) {
      throw new TypeError('controller is undefined');
    }
    return controller;
  };

  /**
   * Emit event of DappViewed,
   * which should only be tracked only after a user opts into metrics and connected to the dapp
   *
   * @param origin - URL of visited dapp
   * @param mainFrameOrigin - The top-level frame origin (if sender is an iframe, this differs from origin)
   * @param frameId - The frame ID from chrome.runtime.MessageSender (0 = top-level, >0 = iframe)
   */
  const emitDappViewedMetricEvent = (
    origin: string,
    mainFrameOrigin?: string,
    frameId?: number,
  ) => {
    const controller = requireController();

    const { analyticsId } = controller.getState();
    if (!shouldEmitDappViewedEvent(analyticsId ?? null)) {
      return;
    }

    const numberOfConnectedAccounts =
      controller.getPermittedAccounts(origin).length;
    if (numberOfConnectedAccounts === 0) {
      return;
    }

    const accountsState = controller.controllerMessenger.call(
      'AccountsController:getState',
    );
    const numberOfTotalAccounts = Object.keys(
      accountsState.internalAccounts.accounts,
    ).length;

    const iframeProps = getIframeProperties({
      frameId,
      origin,
      mainFrameOrigin,
    });

    trackEvent(
      createEventBuilder(MetaMetricsEventName.DappViewed)
        .addCategory(MetaMetricsEventCategory.InpageProvider)
        .addProperties({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          is_first_visit: false,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          number_of_accounts: numberOfTotalAccounts,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          number_of_accounts_connected: numberOfConnectedAccounts,
          ...iframeProps,
        })
        .build({
          referrer: {
            url: origin,
          },
          excludeMetaMetricsId: true,
        }),
    );
  };

  /**
   * Track dapp connection when loaded and permissioned
   *
   * @param remotePort - The port provided by a new context.
   */
  const trackDappView = (remotePort: DappViewRemotePort) => {
    if (
      !remotePort.sender?.tab ||
      !remotePort.sender?.url ||
      !remotePort.sender?.tab?.url
    ) {
      return;
    }
    const controller = requireController();
    const tabId = remotePort.sender.tab.id;
    if (typeof tabId !== 'number') {
      return;
    }
    const url = new URL(remotePort.sender.url);
    const { origin } = url;
    const tabUrl = new URL(remotePort.sender.tab.url);
    const { origin: tabOrigin } = tabUrl;
    const { frameId } = remotePort.sender;

    // store the origin to corresponding tab so it can provide info for onActivated listener
    if (!(tabId in senderOriginMapping)) {
      senderOriginMapping[tabId] = origin;
    }
    // do the same for tab origin, which can be different to sender origin
    if (!(tabId in tabOriginMapping)) {
      tabOriginMapping[tabId] = tabOrigin;
    }
    if (!(tabId in frameIdMapping)) {
      frameIdMapping[tabId] = frameId;
    }

    const isConnectedToDapp = controller.controllerMessenger.call(
      'PermissionController:hasPermissions',
      origin,
    );

    // when open a new tab, this event will trigger twice, only 2nd time is with dapp loaded
    const isTabLoaded = remotePort.sender.tab.title !== 'New Tab';

    // *** Emit DappViewed metric event when ***
    // - refresh the dapp
    // - open dapp in a new tab
    if (isConnectedToDapp && isTabLoaded) {
      emitDappViewedMetricEvent(origin, tabOrigin, frameId);
    }
  };

  /**
   * Emit App Opened event
   *
   * @param environmentType - The environment type where the app is opening
   */
  const emitAppOpenedMetricEvent = (environmentType: EnvironmentType) => {
    const controller = requireController();

    const { consentDecisionMade, optedIn } = controller.getState();

    // Skip if user hasn't opted into metrics
    if (!consentDecisionMade || !optedIn) {
      return;
    }

    const activeTabOrigin =
      controller.appStateController.state.appActiveTab?.origin;
    const allowlist = getActiveTabDomainAllowlist(
      controller.remoteFeatureFlagController.state,
    );
    const activeTabDomain = getActiveTabDomainForMetrics(
      activeTabOrigin,
      allowlist,
    );

    trackEvent(
      createEventBuilder(MetaMetricsEventName.AppOpened)
        .addCategory(MetaMetricsEventCategory.App)
        .addProperties(
          activeTabDomain
            ? {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                active_tab_domain: activeTabDomain,
              }
            : {},
        )
        .build({ environmentType }),
    );
  };

  /**
   * Returns true if the App Opened metric event should fire for the given env.
   *
   * @param environment - The environment type where the app is opening
   * @returns
   */
  const shouldEmitAppOpened = (environment: EnvironmentType) => {
    // List of valid environment types to track
    const environmentTypeList = [
      ENVIRONMENT_TYPE_POPUP,
      ENVIRONMENT_TYPE_NOTIFICATION,
      ENVIRONMENT_TYPE_FULLSCREEN,
      ENVIRONMENT_TYPE_SIDEPANEL,
    ];

    // Check if any UI instances are currently open
    const isAlreadyOpen = isAnyUiOpen();

    // Only emit event if no UI is open and environment is valid
    return !isAlreadyOpen && environmentTypeList.includes(environment);
  };

  /**
   * This function checks if the app is being opened
   * and emits an event only if no other UI instances are currently open.
   *
   * @param environment - The environment type where the app is opening
   */
  const trackAppOpened = (environment: EnvironmentType) => {
    if (shouldEmitAppOpened(environment)) {
      emitAppOpenedMetricEvent(environment);
    }
  };

  const installOnNavigateToTabListener = () => {
    // onNavigateToTab
    browser.tabs.onActivated.addListener((onActivatedTab) => {
      const controller = getController();
      if (controller) {
        const { tabId } = onActivatedTab;
        const currentOrigin = senderOriginMapping[tabId];
        const currentTabOrigin = tabOriginMapping[tabId];
        // *** Emit DappViewed metric event when ***
        // - navigate to a connected dapp
        if (currentOrigin) {
          const connectSitePermissions =
            controller.permissionController.state.subjects[currentOrigin];
          // when the dapp is not connected, connectSitePermissions is undefined
          const isConnectedToDapp = connectSitePermissions !== undefined;
          if (isConnectedToDapp) {
            emitDappViewedMetricEvent(
              currentOrigin,
              currentTabOrigin,
              frameIdMapping[tabId],
            );
          }
        }

        // If the connected dApp is a referral partner, trigger the referral flow
        const partner = getPartnerByOrigin(currentTabOrigin);
        if (partner) {
          const connectSitePermissions =
            controller.permissionController.state.subjects[currentTabOrigin];
          // when the dapp is not connected, connectSitePermissions is undefined
          const isConnectedToDapp = connectSitePermissions !== undefined;
          if (isConnectedToDapp) {
            controller.controllerMessenger
              .call(
                'LegacyBackgroundApiService:handleDefiReferral',
                partner,
                tabId,
                ReferralTriggerType.OnNavigateConnectedTab,
              )
              .catch((error: unknown) => {
                log.error(
                  `Failed to handle ${partner.name} referral after navigation to connected tab: `,
                  error,
                );
              });
          }
        }
      }
    });
  };

  return {
    trackDappView,
    emitAppOpenedMetricEvent,
    shouldEmitAppOpened,
    trackAppOpened,
    installOnNavigateToTabListener,
  };
}
