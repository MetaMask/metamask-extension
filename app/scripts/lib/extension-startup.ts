const SIDE_PANEL_PATH = 'sidepanel.html';

const ENTRY_POINT_ENABLE_RETRY_DELAY_MS = 1_000;
const POST_UPDATE_RELOAD_TIMEOUT_MS = 15_000;

type ExtensionStartupState =
  | 'pending'
  | 'update-pending'
  | 'reload-claimed'
  | 'ready';

type ExtensionStartupBrowser = Pick<
  typeof chrome,
  'action' | 'runtime' | 'sidePanel'
>;

export type ExtensionStartupServiceWorker = {
  addEventListener: (type: 'activate', listener: () => void) => void;
  serviceWorker: { state: string };
};

/**
 * Coordinates browser lifecycle events with Chromium post-update recovery.
 *
 * Readiness remains pending during a genuine update so UI work cannot race
 * the recovery reload. Once ready, entry-point enablement is retried until it
 * succeeds.
 */
export class ExtensionStartup {
  // `withResolvers` is supported by the minimum Chrome version (123).
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  readonly #readiness = Promise.withResolvers!<void>();

  readonly ready = this.#readiness.promise;

  readonly #browser: ExtensionStartupBrowser;

  #startupState: ExtensionStartupState = 'pending';

  /**
   * @param browser - The Chromium extension API.
   * @param serviceWorker - The service-worker lifecycle API.
   */
  constructor(
    browser: ExtensionStartupBrowser,
    serviceWorker: ExtensionStartupServiceWorker,
  ) {
    this.#browser = browser;
    this.ready.then(this.#enableEntryPointsUntilSuccessful);

    browser.runtime.onInstalled.addListener(this.#handleInstalled);
    serviceWorker.addEventListener('activate', this.#markReadyIfPending);

    if (serviceWorker.serviceWorker.state === 'activated') {
      this.#markReadyIfPending();
    }
  }

  readonly claimReload = (): boolean => {
    if (this.#startupState !== 'update-pending') {
      return false;
    }

    this.#startupState = 'reload-claimed';
    return true;
  };

  readonly markReady = (): void => {
    this.#startupState = 'ready';
    this.#readiness.resolve();
  };

  readonly #enableEntryPointsUntilSuccessful = async (): Promise<void> => {
    while (true) {
      try {
        await Promise.all([
          this.#browser.action.enable(),
          this.#browser.sidePanel.setOptions({
            path: SIDE_PANEL_PATH,
            enabled: true,
          }),
        ]);
        return;
      } catch (error) {
        try {
          console.error(
            'MetaMask - Failed to enable extension UI entry points; retrying',
            error,
          );
        } catch {
          // Error reporting must not stop retries.
        }
        await new Promise<void>((retry) =>
          globalThis.setTimeout(retry, ENTRY_POINT_ENABLE_RETRY_DELAY_MS),
        );
      }
    }
  };

  readonly #handleInstalled = (
    details: chrome.runtime.InstalledDetails,
  ): void => {
    if (
      details.reason !== 'update' ||
      !details.previousVersion ||
      details.previousVersion === this.#browser.runtime.getManifest().version
    ) {
      this.#markReadyIfPending();
      return;
    }

    if (this.#startupState === 'pending') {
      this.#startupState = 'update-pending';
      globalThis.setTimeout(() => {
        if (this.#startupState === 'update-pending') {
          this.markReady();
        }
      }, POST_UPDATE_RELOAD_TIMEOUT_MS);
    }
  };

  readonly #markReadyIfPending = (): void => {
    if (this.#startupState === 'pending') {
      this.markReady();
    }
  };
}
