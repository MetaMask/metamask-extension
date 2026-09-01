import browser, { Runtime } from 'webextension-polyfill';
import log from 'loglevel';
import { PLATFORM_FIREFOX } from '../../shared/constants/app';
import { getPlatform } from './lib/util';
import type MetaMaskController from './metamask-controller';
import type ExtensionPlatform from './platforms/extension';
import { AppStateController } from './controllers/app-state-controller';

const IN_FLIGHT_UI_CONNECTION_WAIT_MS = 150;
const METAMASK_UI_CONTEXT_TYPES: Runtime.ContextType[] = [
  'POPUP',
  'SIDE_PANEL',
  'TAB',
];

export type PostUpdateReloadDecision = 'reload' | 'cancelled-by-ui';

type OnUpdateOptions = {
  postUpdateReloadAbortSignal: AbortSignal;
};

/**
 * Waits for a signal to abort until the timeout elapses.
 *
 * @param signal - The signal to observe.
 * @param timeoutMs - The maximum time to wait in milliseconds.
 * @returns Whether the provided signal aborted before the timeout elapsed.
 */
function waitForAbort(
  signal: AbortSignal,
  timeoutMs: number,
): Promise<boolean> {
  const waitSignal = AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)]);

  if (waitSignal.aborted) {
    return Promise.resolve(signal.aborted);
  }

  return new Promise((resolve) => {
    waitSignal.addEventListener('abort', () => resolve(signal.aborted), {
      once: true,
    });
  });
}

async function enableToolbarAction(): Promise<void> {
  try {
    await browser.action.enable();
  } catch (error) {
    log.warn('[post-update-reload] Failed to enable the toolbar action', error);
  }
}

async function decidePostUpdateReload(
  currentVersion: string,
  requestSafeReload: () => Promise<void>,
  abortSignal: AbortSignal,
): Promise<PostUpdateReloadDecision> {
  const cancelIfReloadAborted = async () => {
    if (!abortSignal.aborted) {
      return false;
    }

    log.info(
      '[post-update-reload] Reload cancelled because an internal UI connected',
    );
    await enableToolbarAction();
    return true;
  };

  if (await cancelIfReloadAborted()) {
    return 'cancelled-by-ui';
  }

  log.info('[post-update-reload] Entering final toolbar action barrier');
  try {
    await browser.action.disable();
  } catch (error) {
    log.warn(
      '[post-update-reload] Failed to disable the toolbar action',
      error,
    );
    if (await cancelIfReloadAborted()) {
      return 'cancelled-by-ui';
    }
    log.info(
      `[post-update-reload] Requesting safe reload after update to ${currentVersion}`,
    );
    await requestSafeReload();
    return 'reload';
  }

  if (await cancelIfReloadAborted()) {
    return 'cancelled-by-ui';
  }

  let waitForConnection = false;
  try {
    const contexts = await browser.runtime.getContexts({
      contextTypes: METAMASK_UI_CONTEXT_TYPES,
    });
    waitForConnection = contexts.length > 0;
    if (waitForConnection) {
      log.info('[post-update-reload] In-flight UI context found');
    }
  } catch (error) {
    log.warn('[post-update-reload] Failed to query UI contexts', error);
    waitForConnection = true;
  }

  if (await cancelIfReloadAborted()) {
    return 'cancelled-by-ui';
  }

  if (
    waitForConnection &&
    (await waitForAbort(abortSignal, IN_FLIGHT_UI_CONNECTION_WAIT_MS))
  ) {
    await cancelIfReloadAborted();
    return 'cancelled-by-ui';
  }

  if (await cancelIfReloadAborted()) {
    return 'cancelled-by-ui';
  }

  log.info(
    `[post-update-reload] Requesting safe reload after update to ${currentVersion}`,
  );
  await requestSafeReload();
  return 'reload';
}

/**
 * Trigger actions that should happen only upon update installation. Calling
 * this might result in the extension restarting on Chromium-based browsers.
 *
 * @param controller - The MetaMask controller instance.
 * @param controller.store - The MetaMask store.
 * @param controller.appStateController - The app state controller.
 * @param platform - The ExtensionPlatform API.
 * @param previousVersion - The previous version string.
 * @param requestSafeReload - A function to request a safe reload of the
 * extension background process.
 * @param options - Post-update reload coordination dependencies.
 * @param options.postUpdateReloadAbortSignal
 * @returns The post-update reload decision, or undefined when no Chromium
 * reload decision is needed.
 */
export async function onUpdate(
  // we use a custom type here because the `MetaMaskController` type doesn't
  // include the actual controllers as properties.
  controller: {
    store: MetaMaskController['store'];
    appStateController: AppStateController;
  },
  platform: ExtensionPlatform,
  previousVersion: string,
  requestSafeReload: () => Promise<void>,
  { postUpdateReloadAbortSignal }: OnUpdateOptions,
): Promise<PostUpdateReloadDecision | undefined> {
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
    return undefined;
  }

  const lastUpdatedAt = Date.now();

  appStateController.setLastUpdatedAt(lastUpdatedAt);
  appStateController.setLastUpdatedFromVersion(previousVersion);
  appStateController.setPendingExtensionVersion(null);

  if (isFirefox) {
    return undefined;
  }

  // Preserve the existing event-loop turn before beginning the reload path so
  // update metadata can reach persistence first.
  await new Promise<void>((resolve) => setImmediate(resolve));

  // Work around Chromium bug https://issues.chromium.org/issues/40805401,
  // but skip the reload when the updated background received an internal UI
  // connection and therefore did not encounter the bug.
  return await decidePostUpdateReload(
    platform.getVersion(),
    requestSafeReload,
    postUpdateReloadAbortSignal,
  );
}
