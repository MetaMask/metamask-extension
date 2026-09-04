import log from 'loglevel';
import type { Runtime } from 'webextension-polyfill';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsUserTrait,
} from '#shared/constants/metametrics';
import {
  getInstallAttribution,
  type InstallAttribution,
} from '#shared/lib/install-attribution';
import type { FlattenedBackgroundStateProxy } from '#shared/types';
import type { MetaMetricsController } from '../../controllers/metametrics-controller';
import { createEventBuilder, trackEvent } from '../../controllers/analytics';
import type { AppStateController } from '../../controllers/app-state-controller';
import { onUpdate } from '../../on-update';
import type ExtensionPlatform from '../../platforms/extension';

type OnUpdateController = Parameters<typeof onUpdate>[0];
type OnUpdatePlatform = Parameters<typeof onUpdate>[1];

type InstallLifecycleAppStateController =
  OnUpdateController['appStateController'] &
    Pick<AppStateController, 'setDeferredDeepLink'>;

type InstallLifecycleController = OnUpdateController & {
  metaMetricsController: Pick<MetaMetricsController, 'updateTraits'>;
  appStateController: InstallLifecycleAppStateController;
  getState: () => Pick<
    FlattenedBackgroundStateProxy,
    'consentDecisionMade' | 'optedIn'
  >;
};

type InstallLifecyclePlatform = OnUpdatePlatform &
  Pick<ExtensionPlatform, 'openExtensionInBrowser'>;

export type InstallLifecycleDependencies = {
  controller: InstallLifecycleController;
  platform: InstallLifecyclePlatform;
  isInitialized: Promise<void>;
  requestSafeReload: () => void;
};

/**
 * Queues the "App Installed" event before consent, or tracks it immediately if
 * consent already exists.
 *
 * @param installAttributionPromise - Promise resolving to install attribution data.
 * @param controller - Controller APIs used for traits, deeplink, and consent state.
 */
async function addAppInstalledEvent(
  installAttributionPromise: Promise<InstallAttribution>,
  controller: Pick<
    InstallLifecycleController,
    'metaMetricsController' | 'appStateController' | 'getState'
  >,
): Promise<void> {
  const { deferredDeepLink, traits: installAttributionTraits } =
    await installAttributionPromise;

  controller.metaMetricsController.updateTraits({
    [MetaMetricsUserTrait.InstallDateExt]: new Date()
      .toISOString()
      .split('T')[0],
    ...installAttributionTraits,
  });
  const eventProperties: Record<string, string> = {};

  if (deferredDeepLink) {
    controller.appStateController.setDeferredDeepLink(deferredDeepLink);
    eventProperties.install_source = 'deeplink';
    eventProperties.deeplink_path = deferredDeepLink.referringLink;
  }

  const { consentDecisionMade, optedIn } = controller.getState();

  if (consentDecisionMade === true && optedIn === false) {
    return;
  }

  trackEvent(
    createEventBuilder(MetaMetricsEventName.AppInstalled)
      .addCategory(MetaMetricsEventCategory.App)
      .addProperties(eventProperties)
      .build(),
  );
}

/**
 * Trigger actions that should happen only upon initial install (e.g. open tab for
 * onboarding).
 *
 * @param deps - Install lifecycle dependencies.
 */
async function onInstall(deps: InstallLifecycleDependencies): Promise<void> {
  log.debug('First install detected');
  const installAttributionPromise = getInstallAttribution();

  if (!process.env.IN_TEST && !process.env.METAMASK_DEBUG) {
    deps.platform.openExtensionInBrowser();
  }

  await deps.isInitialized;

  await addAppInstalledEvent(installAttributionPromise, deps.controller);
}

/**
 * Handles the runtime.onInstalled event.
 *
 * @param detailsTuple - Tuple containing a single installation details object.
 * @param detailsTuple."0"
 * @param deps - Install lifecycle dependencies.
 */
export async function handleOnInstalled(
  [details]: [Runtime.OnInstalledDetailsType],
  deps: InstallLifecycleDependencies,
): Promise<void> {
  if (details.reason === 'install') {
    await onInstall(deps);
  } else if (details.reason === 'update') {
    const { previousVersion } = details;
    if (!previousVersion || previousVersion === deps.platform.getVersion()) {
      return;
    }
    await deps.isInitialized;
    onUpdate(
      deps.controller,
      deps.platform,
      previousVersion,
      deps.requestSafeReload,
    );
  }
}

/**
 * Trigger actions that should happen only when an update is available.
 *
 * @param details - Event details from runtime.onUpdateAvailable.
 * @param deps - Install lifecycle dependencies.
 */
export async function onUpdateAvailable(
  details: Runtime.OnUpdateAvailableDetailsType,
  deps: InstallLifecycleDependencies,
): Promise<void> {
  await deps.isInitialized;
  log.info('An update is available', details?.version);
  deps.controller.appStateController.setPendingExtensionVersion(
    details?.version ?? null,
  );
}
