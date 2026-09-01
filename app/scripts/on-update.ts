import log from 'loglevel';
import { PLATFORM_FIREFOX } from '#shared/constants/app';
import { getPlatform } from './lib/util';
import type ExtensionPlatform from './platforms/extension';
import type { AppStateController } from './controllers/app-state-controller';

type OnUpdateAppStateController = Pick<
  AppStateController,
  | 'setLastUpdatedAt'
  | 'setLastUpdatedFromVersion'
  | 'setPendingExtensionVersion'
> & {
  state: Pick<AppStateController['state'], 'lastUpdatedFromVersion'>;
};

type OnUpdateController = {
  appStateController: OnUpdateAppStateController;
};

type OnUpdatePlatform = Pick<ExtensionPlatform, 'getVersion'>;

/**
 * Trigger actions that should happen only upon update installation. Calling
 * this might result in the extension restarting on Chromium-based browsers.
 *
 * @param controller - The MetaMask controller instance.
 * @param controller.appStateController - The app state controller.
 * @param platform - The ExtensionPlatform API.
 * @param previousVersion - The previous version string.
 * @param requestSafeReload - A function to request a safe reload of the
 * extension background process.
 * @param reloadClaimed - Whether this startup still owns the right to perform
 * the recovery reload.
 * @returns Whether startup is ready or a recovery reload was scheduled.
 */
export async function onUpdate(
  controller: OnUpdateController,
  platform: OnUpdatePlatform,
  previousVersion: string,
  requestSafeReload: () => Promise<void>,
  reloadClaimed = true,
): Promise<'reload' | 'ready'> {
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
    return 'ready';
  }

  appStateController.setLastUpdatedAt(Date.now());
  appStateController.setLastUpdatedFromVersion(previousVersion);
  appStateController.setPendingExtensionVersion(null);

  if (isFirefox || !reloadClaimed) {
    return 'ready';
  }

  // Preserve the existing event-loop turn before beginning the reload path so
  // update metadata can reach persistence first.
  await new Promise<void>((resolve) => setImmediate(resolve));

  // Work around Chromium bug https://issues.chromium.org/issues/40805401 by
  // doing a safe reload after an update. Extension UI entry points remain
  // unavailable until the recovery startup, so no UI can race this reload.
  log.info(
    `[onUpdate]: Requesting "safe reload" after update to ${platform.getVersion()}`,
  );
  await requestSafeReload();
  return 'reload';
}
