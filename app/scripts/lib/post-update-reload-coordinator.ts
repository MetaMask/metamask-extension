import { SIDEPANEL_FILE } from '#shared/constants/app';

// Retrying once per second caps the loop at two extension API calls per second
// while adding at most one second to entry-point recovery.
const ENTRY_POINT_ENABLE_RETRY_INTERVAL_MS = 1_000;

// Normal initialization begins the reload well within 15 seconds; this gives
// slower devices ample time while still recovering promptly from a hang.
const RELOAD_START_TIMEOUT_MS = 15_000;

type PostUpdateReloadState =
  | 'undecided'
  | 'reload-pending'
  | 'reload-in-progress'
  | 'complete';

type PostUpdateReloadBrowser = Pick<
  typeof chrome,
  'action' | 'runtime' | 'sidePanel'
>;

/**
 * Coordinates Chromium's post-update recovery reload with extension UI entry
 * points.
 *
 * Coordination remains incomplete during a genuine update so UI work cannot
 * race the recovery reload. Once complete, entry-point enablement is retried
 * until it succeeds.
 */
export class PostUpdateReloadCoordinator {
  // `withResolvers` is supported by the minimum Chrome version (123).
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  readonly #completion = Promise.withResolvers!<void>();

  readonly completion = this.#completion.promise;

  readonly #browser: PostUpdateReloadBrowser;

  #state: PostUpdateReloadState = 'undecided';

  /**
   * @param browser - The Chromium extension API.
   * @param isServiceWorkerActivated - Whether this is a restarted worker.
   */
  constructor(
    browser: PostUpdateReloadBrowser,
    isServiceWorkerActivated: boolean,
  ) {
    this.#browser = browser;
    this.completion.then(this.#enableEntryPointsUntilSuccessful);

    browser.runtime.onInstalled.addListener(this.#handleInstalled);

    if (isServiceWorkerActivated) {
      this.complete();
    }
  }

  tryBeginReload(): boolean {
    if (this.#state !== 'reload-pending') {
      return false;
    }

    this.#state = 'reload-in-progress';
    return true;
  }

  complete(): void {
    this.#state = 'complete';
    this.#completion.resolve();
  }

  readonly #enableEntryPointsUntilSuccessful = async (): Promise<void> => {
    while (true) {
      try {
        await Promise.all([
          this.#browser.action.enable(),
          this.#browser.sidePanel.setOptions({
            path: SIDEPANEL_FILE,
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
          globalThis.setTimeout(retry, ENTRY_POINT_ENABLE_RETRY_INTERVAL_MS),
        );
      }
    }
  };

  readonly #handleInstalled = (
    details: chrome.runtime.InstalledDetails,
  ): void => {
    if (this.#state !== 'undecided') {
      return;
    }

    if (
      details.reason !== 'update' ||
      !details.previousVersion ||
      details.previousVersion === this.#browser.runtime.getManifest().version
    ) {
      this.complete();
      return;
    }

    this.#state = 'reload-pending';
    globalThis.setTimeout(() => {
      if (this.#state === 'reload-pending') {
        this.complete();
      }
    }, RELOAD_START_TIMEOUT_MS);
  };
}
