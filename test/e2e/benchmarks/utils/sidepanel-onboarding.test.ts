import type { MockedEndpoint } from 'mockttp';
import { TraceName } from '../../../../shared/lib/trace';
import type { Driver } from '../../webdriver/driver';
import type { SentryTransaction } from './sentry-transactions';
import {
  PAGE_IDLE_BEFORE_STEP,
  readCurrentDocumentUiStartup,
  readDocumentTimeOrigin,
  resolveAfterTwoIdlePeriods,
  transactionsStartingAt,
  waitForPageIdleBeforeStep,
} from './sidepanel-onboarding';

jest.mock('../../helpers', () => ({ getCleanAppState: jest.fn() }));

const TIME_ORIGIN_MS = 1_761_850_000_123.456;

/** One Sentry envelope body holding one transaction item. */
function envelope(
  name: string,
  startSeconds: number,
  endSeconds: number,
  trace: Record<string, unknown> = {},
): string {
  return [
    JSON.stringify({ sdk: { name: 'sentry.javascript.browser' } }),
    JSON.stringify({ type: 'transaction' }),
    JSON.stringify({
      transaction: name,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      start_timestamp: startSeconds,
      timestamp: endSeconds,
      contexts: { trace },
    }),
  ].join('\n');
}

/**
 * Mocked Sentry endpoints whose successive reads return successive `batches`,
 * then repeat the last, so a test can have a transaction arrive late.
 */
function sentryEndpoints(...batches: string[][]): MockedEndpoint[] {
  let reads = 0;
  return [
    {
      getSeenRequests: async () => {
        const batch = batches[Math.min(reads, batches.length - 1)];
        reads += 1;
        return batch.map((body) => ({
          url: 'https://o0.ingest.sentry.io/api/0/envelope/',
          body: { getText: async () => body },
        }));
      },
    } as unknown as MockedEndpoint,
  ];
}

/**
 * A driver whose `executeScript` resolves to `timeOrigin` and whose `delay`
 * resolves at once, returned with both mocks.
 */
function uiStartupDriver(timeOrigin: unknown = TIME_ORIGIN_MS) {
  const executeScript = jest.fn().mockResolvedValue(timeOrigin);
  const delay = jest.fn().mockResolvedValue(undefined);
  return {
    driver: { executeScript, delay } as unknown as Driver,
    executeScript,
    delay,
  };
}

describe('waitForPageIdleBeforeStep', () => {
  const original = process.env[PAGE_IDLE_BEFORE_STEP];
  afterEach(() => {
    if (original === undefined) {
      delete process.env[PAGE_IDLE_BEFORE_STEP];
    } else {
      process.env[PAGE_IDLE_BEFORE_STEP] = original;
    }
  });

  it('does nothing in the page when the switch is unset', async () => {
    delete process.env[PAGE_IDLE_BEFORE_STEP];
    const executeAsyncScript = jest.fn();

    await waitForPageIdleBeforeStep({
      executeAsyncScript,
    } as unknown as Driver);

    expect(executeAsyncScript).not.toHaveBeenCalled();
  });

  it('does nothing in the page when the switch is 0', async () => {
    process.env[PAGE_IDLE_BEFORE_STEP] = '0';
    const executeAsyncScript = jest.fn();

    await waitForPageIdleBeforeStep({
      executeAsyncScript,
    } as unknown as Driver);

    expect(executeAsyncScript).not.toHaveBeenCalled();
  });

  it('runs the two-idle-period wait in the page when the switch is 1', async () => {
    process.env[PAGE_IDLE_BEFORE_STEP] = '1';
    const executeAsyncScript = jest.fn().mockResolvedValue(null);

    await waitForPageIdleBeforeStep({
      executeAsyncScript,
    } as unknown as Driver);

    expect(executeAsyncScript).toHaveBeenCalledWith(resolveAfterTwoIdlePeriods);
  });
});

describe('resolveAfterTwoIdlePeriods', () => {
  const pending: (() => void)[] = [];
  const host = globalThis as unknown as {
    requestIdleCallback?: (callback: () => void) => number;
  };
  const original = host.requestIdleCallback;

  beforeEach(() => {
    pending.length = 0;
    host.requestIdleCallback = (callback) => {
      pending.push(callback);
      return pending.length;
    };
  });
  afterEach(() => {
    host.requestIdleCallback = original;
  });

  /** Run the callbacks queued for the current idle period. */
  function runIdlePeriod(): void {
    pending.splice(0).forEach((callback) => callback());
  }

  it('ends the script on the second idle period, not the first', () => {
    const done = jest.fn();

    resolveAfterTwoIdlePeriods([], done);
    expect(done).not.toHaveBeenCalled();

    runIdlePeriod();
    expect(done).not.toHaveBeenCalled();

    runIdlePeriod();
    expect(done).toHaveBeenCalledTimes(1);
    expect(done).toHaveBeenCalledWith(null);
  });
});

describe('readDocumentTimeOrigin', () => {
  it("returns the page's performance.timeOrigin", () => {
    expect(readDocumentTimeOrigin()).toBe(performance.timeOrigin);
  });
});

describe('transactionsStartingAt', () => {
  /**
   * A transaction as `parseEnvelopeTransactions` returns it, starting at
   * `startMs` in epoch milliseconds.
   */
  function transaction(
    name: TraceName,
    startMs: number,
    durationMs: number,
  ): SentryTransaction {
    return {
      name,
      durationMs,
      endTimestamp: (startMs + durationMs) / 1000,
      success: true,
    };
  }

  it('keeps the named trace that started at the time origin', () => {
    const own = transaction(TraceName.UIStartup, TIME_ORIGIN_MS, 812.5);
    const sidePanel = transaction(
      TraceName.UIStartup,
      TIME_ORIGIN_MS - 40,
      700,
    );
    const otherTrace = transaction(
      TraceName.ShowAccountList,
      TIME_ORIGIN_MS,
      90,
    );

    expect(
      transactionsStartingAt(
        [sidePanel, own, otherTrace],
        TraceName.UIStartup,
        TIME_ORIGIN_MS,
      ),
    ).toStrictEqual([own]);
  });

  it('drops a span that started more than 1 ms away from the time origin', () => {
    expect(
      transactionsStartingAt(
        [transaction(TraceName.UIStartup, TIME_ORIGIN_MS + 2, 800)],
        TraceName.UIStartup,
        TIME_ORIGIN_MS,
      ),
    ).toStrictEqual([]);
  });
});

describe('readCurrentDocumentUiStartup', () => {
  const id = 'harnessHomeNavigationToUiStartup';
  const startSeconds = TIME_ORIGIN_MS / 1000;

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("reports the UI Startup span that started at this document's time origin", async () => {
    const { driver, executeScript } = uiStartupDriver();
    const endpoints = sentryEndpoints([
      envelope(TraceName.UIStartup, startSeconds - 0.04, startSeconds + 0.7),
      envelope(TraceName.UIStartup, startSeconds, startSeconds + 0.8125),
      envelope(TraceName.ShowAccountList, startSeconds, startSeconds + 0.09),
    ]);

    const timers = await readCurrentDocumentUiStartup(driver, endpoints, id);

    expect(executeScript).toHaveBeenCalledWith(readDocumentTimeOrigin);
    expect(timers).toHaveLength(1);
    expect(timers[0].id).toBe(id);
    expect(timers[0].unit).toBe('ms');
    expect(timers[0].value).toBeCloseTo(812.5, 3);
  });

  it('keeps reading until the transaction arrives', async () => {
    const { driver, delay } = uiStartupDriver();
    const endpoints = sentryEndpoints(
      [],
      [],
      [envelope(TraceName.UIStartup, startSeconds, startSeconds + 0.5)],
    );

    const timers = await readCurrentDocumentUiStartup(driver, endpoints, id);

    expect(delay).toHaveBeenCalledTimes(2);
    expect(timers.map((timer) => timer.value)).toStrictEqual([
      expect.closeTo(500, 3),
    ]);
  });

  it('reports nothing, without throwing, when no span started at the time origin', async () => {
    const { driver, delay } = uiStartupDriver();
    const endpoints = sentryEndpoints([
      envelope(TraceName.UIStartup, startSeconds - 0.04, startSeconds + 0.7),
    ]);

    await expect(
      readCurrentDocumentUiStartup(driver, endpoints, id),
    ).resolves.toStrictEqual([]);
    // 10000 ms of waiting at a 250 ms poll.
    expect(delay).toHaveBeenCalledTimes(40);
  });

  it('reports nothing when two spans started at the time origin', async () => {
    const { driver } = uiStartupDriver();
    const endpoints = sentryEndpoints([
      envelope(TraceName.UIStartup, startSeconds, startSeconds + 0.5),
      envelope(TraceName.UIStartup, startSeconds, startSeconds + 0.6),
    ]);

    await expect(
      readCurrentDocumentUiStartup(driver, endpoints, id),
    ).resolves.toStrictEqual([]);
  });

  it('reports nothing when the matching span ended unsuccessfully', async () => {
    const { driver } = uiStartupDriver();
    const endpoints = sentryEndpoints([
      envelope(TraceName.UIStartup, startSeconds, startSeconds + 0.5, {
        status: 'internal_error',
      }),
    ]);

    await expect(
      readCurrentDocumentUiStartup(driver, endpoints, id),
    ).resolves.toStrictEqual([]);
  });

  it('reports nothing when the page reports no time origin', async () => {
    const { driver } = uiStartupDriver(null);

    await expect(
      readCurrentDocumentUiStartup(driver, sentryEndpoints([]), id),
    ).resolves.toStrictEqual([]);
  });

  it('reports nothing, without throwing, when the page cannot be read', async () => {
    const { driver, executeScript } = uiStartupDriver();
    executeScript.mockRejectedValue(new Error('no such window'));

    await expect(
      readCurrentDocumentUiStartup(driver, sentryEndpoints([]), id),
    ).resolves.toStrictEqual([]);
  });
});
