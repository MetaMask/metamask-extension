import log from 'loglevel';
import browser from 'webextension-polyfill';
import type { Runtime } from 'webextension-polyfill';
import type { RemoteFeatureFlagControllerState } from '@metamask/remote-feature-flag-controller';
import {
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_NOTIFICATION,
  ENVIRONMENT_TYPE_FULLSCREEN,
  ENVIRONMENT_TYPE_SIDEPANEL,
} from '../../../../shared/constants/app';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import {
  getActiveTabDomainAllowlist,
  getActiveTabDomainForMetrics,
} from '../../../../shared/lib/active-tab-domain-metrics';
import { getPartnerByOrigin } from '../../../../shared/constants/defi-referrals';
import { createEventBuilder, trackEvent } from '../../controllers/analytics';
import { ReferralTriggerType } from '../defi-referrals/createDefiReferralMiddleware';
import { getIframeProperties } from '../getIframeProperties';
import { shouldEmitDappViewedEvent } from '../util';

export type DappMetricsController = {
  getState: () => {
    analyticsId?: string;
    consentDecisionMade?: boolean;
    optedIn?: boolean;
  };
  getPermittedAccounts: (origin: string) => string[];
  controllerMessenger: {
    call: (method: string, ...args: unknown[]) => unknown;
  };
  permissionController: {
    state: {
      subjects: Record<string, unknown | undefined>;
    };
  };
  appStateController: {
    state: {
      appActiveTab?: {
        origin?: string;
      };
    };
  };
  remoteFeatureFlagController: {
    state: Pick<RemoteFeatureFlagControllerState, 'remoteFeatureFlags'>;
  };
};

export type CreateDappMetricsDeps = {
  getController: () => DappMetricsController;
  isAnyUiOpen: () => boolean;
};

export type DappMetricsApi = {
  trackDappView: (remotePort: Runtime.Port) => void;
  emitAppOpenedMetricEvent: (environmentType: string) => void;
  shouldEmitAppOpened: (environment: string) => boolean;
  trackAppOpened: (environment: string) => void;
  installOnNavigateToTabListener: () => void;
};

type TabOriginRegistry = Record<number, string>;
type TabFrameRegistry = Record<number, number | undefined>;

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
    const controller = getController();

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
    ) as {
      internalAccounts: { accounts: Record<string, unknown> };
    };
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
  const trackDappView = (remotePort: Runtime.Port) => {
    if (
      !remotePort.sender?.tab ||
      !remotePort.sender?.url ||
      !remotePort.sender?.tab?.url
    ) {
      return;
    }
    const controller = getController();
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
    ) as boolean | undefined;

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
  const emitAppOpenedMetricEvent = (environmentType: string) => {
    const controller = getController();

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
  const shouldEmitAppOpened = (environment: string) => {
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
  const trackAppOpened = (environment: string) => {
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
            (
              controller.controllerMessenger.call(
                'LegacyBackgroundApiService:handleDefiReferral',
                partner,
                tabId,
                ReferralTriggerType.OnNavigateConnectedTab,
              ) as Promise<unknown>
            ).catch((error: unknown) => {
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
