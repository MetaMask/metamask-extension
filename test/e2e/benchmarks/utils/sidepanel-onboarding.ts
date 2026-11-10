import type { MockedEndpoint } from 'mockttp';
import { TraceName } from '../../../../shared/lib/trace';
import { getCleanAppState } from '../../helpers';
import type { Driver } from '../../webdriver/driver';
import {
  readSentryTransactions,
  sentryTimerResult,
  type SentryTransaction,
} from './sentry-transactions';
import type { TimerResult } from './types';

/** Harness steps shared by the onboarding and import journeys. */

/**
 * Before each step whose start state is in question, wait for two
 * consecutive idle periods of the page: see {@link waitForPageIdleBeforeStep}.
 */
export const PAGE_IDLE_BEFORE_STEP = 'BENCHMARK_PAGE_IDLE_BEFORE_STEP';

/**
 * How long to wait for a `UI Startup` transaction, and how often to read the
 * mocked Sentry endpoint meanwhile: the defaults of
 * `waitForSentryTransactions` in `sentry-transactions.ts`.
 */
const SENTRY_WAIT_MS = 10000;
const SENTRY_POLL_MS = 250;

/**
 * `UI Startup` starts at `performance.timeOrigin` (`app/scripts/ui.ts`). The
 * envelope carries it in seconds, so after the round trip the two differ only
 * by floating-point error, far below this.
 */
const TIME_ORIGIN_TOLERANCE_MS = 1;

/**
 * On Chrome, whose build opens home in the side panel, load `home.html` into
 * the test window as `handleSidepanelPostOnboarding` does minus its header
 * wait, so a timer started on return covers the header but not the load.
 */
export async function loadHomeAfterSidepanelOnboarding(
  driver: Driver,
): Promise<boolean> {
  // The same condition `handleSidepanelPostOnboarding` uses.
  if (process.env.SELENIUM_BROWSER !== 'chrome') {
    return false;
  }

  await driver.waitUntil(
    async () => {
      const uiState = await getCleanAppState(driver);
      return Boolean(uiState?.metamask?.completedOnboarding);
    },
    { timeout: 30000, interval: 500 },
  );
  await driver.driver.get(`${driver.extensionUrl}/home.html`);
  return true;
}

/**
 * Call `done` after two consecutive idle periods. Serialized into the page by
 * `executeAsyncScript`, which passes `done` second, so it may reference only
 * its body and globals on every build's LavaMoat scuttling exception list.
 */
export function resolveAfterTwoIdlePeriods(
  _args: unknown,
  done: (result: null) => void,
): void {
  requestIdleCallback(() => {
    requestIdleCallback(() => done(null));
  });
}

/**
 * When `BENCHMARK_PAGE_IDLE_BEFORE_STEP=1`, wait for two consecutive idle
 * periods; call it before the step's probe and trigger, outside its timers. A
 * page that never idles fails at the script timeout rather than start busy.
 */
export async function waitForPageIdleBeforeStep(driver: Driver): Promise<void> {
  if (process.env[PAGE_IDLE_BEFORE_STEP] !== '1') {
    return;
  }
  await driver.executeAsyncScript(resolveAfterTwoIdlePeriods);
}

/**
 * Runs in the page; `performance` is on every build's LavaMoat scuttling
 * exception list. Returns milliseconds since the epoch.
 */
export function readDocumentTimeOrigin(): number {
  return performance.timeOrigin;
}

/**
 * Keep the transactions of trace `name` that started at `timeOriginMs`, within
 * `TIME_ORIGIN_TOLERANCE_MS`, in their original order.
 */
export function transactionsStartingAt(
  transactions: SentryTransaction[],
  name: TraceName,
  timeOriginMs: number,
): SentryTransaction[] {
  return transactions.filter(
    (transaction) =>
      transaction.name === name &&
      Math.abs(
        transaction.endTimestamp * 1000 - transaction.durationMs - timeOriginMs,
      ) <= TIME_ORIGIN_TOLERANCE_MS,
  );
}

/**
 * Report this document's `UI Startup` span under `id`. Call it after every
 * timer, while the test window still holds the home page the harness loaded.
 * On any failure it logs why and returns [], never zero and never a throw.
 */
export async function readCurrentDocumentUiStartup(
  driver: Driver,
  endpoints: MockedEndpoint[],
  id: string,
): Promise<TimerResult[]> {
  const absent = (reason: string): TimerResult[] => {
    console.log(`[benchmark] ${id} absent: ${reason}`);
    return [];
  };

  try {
    const timeOriginMs = (await driver.executeScript(
      readDocumentTimeOrigin,
    )) as unknown;
    if (typeof timeOriginMs !== 'number') {
      return absent('the document did not report a time origin');
    }

    // Match on this document's time origin, not the last sent: other documents,
    // the side panel's among them, send their own `UI Startup`.
    let matching: SentryTransaction[] = [];
    for (let waited = 0; ; waited += SENTRY_POLL_MS) {
      matching = transactionsStartingAt(
        await readSentryTransactions(endpoints),
        TraceName.UIStartup,
        timeOriginMs,
      );
      if (matching.length > 0 || waited >= SENTRY_WAIT_MS) {
        break;
      }
      await driver.delay(SENTRY_POLL_MS);
    }

    if (matching.length === 0) {
      return absent(
        `no "${TraceName.UIStartup}" transaction started at this document's time origin within ${SENTRY_WAIT_MS} ms`,
      );
    }
    if (matching.length > 1) {
      return absent(
        `${matching.length} "${TraceName.UIStartup}" transactions started at this document's time origin`,
      );
    }
    const timer = sentryTimerResult(matching, TraceName.UIStartup, id);
    console.log(`[benchmark] ${id}: ${timer.value.toFixed(1)} ms`);
    return [timer];
  } catch (error) {
    return absent(error instanceof Error ? error.message : String(error));
  }
}
