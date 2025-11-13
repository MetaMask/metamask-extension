import log from 'loglevel';
import { RemoteFeatureFlagController } from '@metamask/remote-feature-flag-controller';
import { PLATFORM_FIREFOX } from '../../shared/constants/app';
import { getPlatform } from './lib/util';
import type MetaMaskController from './metamask-controller';
import type ExtensionPlatform from './platforms/extension';
import { AppStateController } from './controllers/app-state-controller';
/**
 * Trigger actions that should happen only upon update installation. Calling
 * this might result in the extension restarting on Chromium-based browsers.
 *
 * @param controller - The MetaMask controller instance.
 * @param controller.store - The MetaMask store.
 * @param controller.remoteFeatureFlagController - The remote feature flag
 * controller.
 * @param controller.appStateController - The app state controller.
 * @param platform - The ExtensionPlatform API.
 * @param previousVersion - The previous version string.
 * @param requestSafeReload - A function to request a safe reload of the
 * extension background process.
 */
export function onUpdate(
  // we use a custom type here because the `MetaMaskController` type doesn't
  // include the actual controllers as properties.
  controller: {
    store: MetaMaskController['store'];
    remoteFeatureFlagController: RemoteFeatureFlagController;
    appStateController: AppStateController;
  },
  platform: ExtensionPlatform,
  previousVersion: string,
  requestSafeReload: () => void,
): void {
  const { appStateController } = controller;
  const { lastUpdatedFromVersion } = appStateController.state;
  const isFirefox = getPlatform() === PLATFORM_FIREFOX;

  log.debug('[onUpdate]: Update installation detected');
  log.info(`[onUpdate]: Updated from version ${previousVersion}`);
  log.info(
    `[onUpdate]: Recorded last updated from version: ${lastUpdatedFromVersion}`,
  );
  log.info(`[onUpdate]: isFirefox: ${isFirefox}`);
  log.info(`[onUpdate]: Current version: ${platform.getVersion()}`);

  // Browser might trigger an update event even when the version hasn't changed,
  // like when reloading the extension manually.
  if (previousVersion === lastUpdatedFromVersion) {
    return;
  }

  const lastUpdatedAt = Date.now();

  appStateController.setLastUpdatedAt(lastUpdatedAt);
  appStateController.setLastUpdatedFromVersion(previousVersion);

  if (!isFirefox) {
    // Work around Chromium bug https://issues.chromium.org/issues/40805401
    // by doing a safe reload after an update. We'll be able to gate this
    // behind a Chromium version check once we know the chromium version #
    // that fixes this bug, ETA: December 2025 (likely in `143.0.7465.0`).
    // Once we no longer support the affected Chromium versions, we should
    // remove this workaround.
    // We only want to do the safe reload when the version actually changed,
    // just as a safe guard, as Chrome fires this event each time we call
    // `runtime.reload` -- as we really don't want to send Chrome into a restart
    // loop! This is overkill, as `onUpdate` is already only called when
    // `previousVersion !== platform.getVersion()`, but better safe than better
    // safe than better safe than... rebooting forever. :-)
    const { remoteFeatureFlagController } = controller;
    const shouldReload = remoteFeatureFlagController.state.remoteFeatureFlags
      .extensionPlatformAutoReloadAfterUpdate as boolean | undefined;
    log.info(`[onUpdate]: Should reload: ${shouldReload}`);
    if (shouldReload === true) {
      log.info(
        `[onUpdate]: Requesting "safe reload" after update to ${platform.getVersion()}`,
      );
      // use `setImmediate` to be absolutely sure the reload happens after
      // other "update" events triggered by the `setLastUpdatedFromVersion`
      // and `setLastUpdatedAt` calls above have been processed by storage.
      // I think there _is_ still a risk of a race condition here, mostly
      // due to the complexity of state storage's locks, debounce, and async
      // nature.
      setImmediate(requestSafeReload);
    }
  }
}
