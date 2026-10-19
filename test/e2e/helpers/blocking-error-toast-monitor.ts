/**
 * Browser-side toast monitor used by homepage E2E to catch blocking error
 * toasts that auto-dismiss before a later assertion.
 *
 * Serialized into the page via WebDriver `executeScript`, so this function
 * must stay self-contained (no closed-over imports).
 *
 * Polls with `setTimeout` instead of `MutationObserver` because LavaMoat
 * scuttling blocks MutationObserver in the UI realm.
 *
 * Matches `[data-testid="error-toast"]` from `Toaster` error toasts. Keep that
 * selector in sync with `HomePage.errorToast`.
 */

type BlockingErrorToastWindow = Window & {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __mmE2eBlockingErrorToasts?: string[];
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __mmE2eBlockingErrorToastHeartbeat?: number;
};

/**
 * Poll interval used by {@link installBlockingErrorToastMonitor}. Inlined as a
 * literal inside that function so WebDriver `executeScript` serialization stays
 * self-contained. Keep these values in sync.
 */
export const BLOCKING_ERROR_TOAST_POLL_INTERVAL_MS = 50;

/**
 * Toasts recorded by {@link installBlockingErrorToastMonitor} on the current
 * document. Used by unit tests; E2E reads the same array via executeScript.
 *
 * @returns Recorded toast text, or an empty array if monitoring is not installed.
 */
export function getRecordedBlockingErrorToasts(): string[] {
  return (window as BlockingErrorToastWindow).__mmE2eBlockingErrorToasts ?? [];
}

/**
 * Poll count for {@link installBlockingErrorToastMonitor}. Starts at 0 and
 * increments on each poll. E2E fails the empty-toast check when this stays 0,
 * because Jest does not run the monitor in the LavaMoat realm.
 *
 * @returns How many times the poll callback has run, or 0 if it never has.
 */
export function getBlockingErrorToastHeartbeat(): number {
  return (
    (window as BlockingErrorToastWindow).__mmE2eBlockingErrorToastHeartbeat ?? 0
  );
}

/**
 * Installs a monitor that records blocking error toasts as they appear.
 * Idempotent on the current document.
 */
export function installBlockingErrorToastMonitor(): void {
  const win = window as BlockingErrorToastWindow;
  if (win.__mmE2eBlockingErrorToasts) {
    return;
  }
  win.__mmE2eBlockingErrorToasts = [];
  win.__mmE2eBlockingErrorToastHeartbeat = 0;
  // Literal (not the exported const) so executeScript serialization stays self-contained.
  const pollIntervalMs = 50;
  // Keep in sync with HomePage.errorToast / ERROR_TOAST_TEST_ID.
  const errorToastSelector = '[data-testid="error-toast"]';

  function scanDocument() {
    const recorded = win.__mmE2eBlockingErrorToasts;
    if (!recorded) {
      return;
    }
    win.document.querySelectorAll(errorToastSelector).forEach((el) => {
      const text = (el.textContent || '').trim();
      if (text && !recorded.includes(text)) {
        recorded.push(text);
      }
    });
  }

  function poll() {
    // Count poll callbacks only. The initial scan does not bump this, so a
    // skipped setTimeout leaves the heartbeat at 0.
    win.__mmE2eBlockingErrorToastHeartbeat =
      (win.__mmE2eBlockingErrorToastHeartbeat ?? 0) + 1;
    scanDocument();
    // setTimeout is a LavaMoat scuttling exception; MutationObserver is not.
    setTimeout(poll, pollIntervalMs);
  }

  scanDocument();
  setTimeout(poll, pollIntervalMs);
}
