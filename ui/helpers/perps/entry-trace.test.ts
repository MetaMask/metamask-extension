import { it } from '@jest/globals';
import {
  trace,
  endTrace,
  TraceName,
  getPerformanceTimestamp,
} from '../../../shared/lib/trace';

import { submitRequestToBackground } from '../../store/background-connection';

jest.mock('../../../shared/lib/trace', () => ({
  ...jest.requireActual('../../../shared/lib/trace'),
  trace: jest.fn(),
  endTrace: jest.fn(),
  getPerformanceTimestamp: () => Date.now(),
}));

jest.mock('../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn(),
}));

async function flush() {
  for (let i = 0; i < 8; i += 1) {
    await Promise.resolve();
  }
}

let entry: typeof import('./entry-trace');
let sequence = 0;

function setVisibility(value: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    value,
  });
  document.dispatchEvent(new Event('visibilitychange'));
}

describe('Perps entry lifecycle', () => {
  beforeEach(async () => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    let settled = false;
    jest.mocked(submitRequestToBackground).mockImplementation((method) => {
      if (method === 'perpsMarkForegroundSettled') {
        settled = true;
        return Promise.resolve(undefined);
      }
      return Promise.resolve(settled ? 'warm' : 'cold_process');
    });
    setVisibility('visible');
    Object.defineProperty(crypto, 'randomUUID', {
      configurable: true,
      value: () => `entry-${(sequence += 1)}`,
    });
    jest.isolateModules(() => {
      entry = jest.requireActual('./entry-trace');
    });
    await entry.primePerpsLifecycleContext();
  });

  afterEach(async () => {
    jest.runOnlyPendingTimers();
    await flush();
    jest.useRealTimers();
  });

  it('reuses the span during the same mounted entry', async () => {
    const id = entry.startPerpsEntry('home');
    const mountedId = entry.startPerpsEntry('home');

    await flush();
    expect(mountedId).toBe(id);
    await flush();
    expect(trace).toHaveBeenCalledTimes(1);
    await flush();
    expect(trace).toHaveBeenCalledWith(
      expect.objectContaining({
        name: TraceName.PerpsEntryToLiveMarketList,
        tags: expect.objectContaining({
          [entry.PERPS_LIFECYCLE_TAG]: 'cold_process',
        }),
      }),
    );
  });

  it('consumes cold context only after a successful entry', async () => {
    const abandoned = entry.startPerpsEntry('home');
    entry.endPerpsEntry(abandoned, false, 'unmounted');
    await flush();
    expect(entry.readPerpsLifecycleContext()).toBe('cold_process');

    const completed = entry.startPerpsEntry('home');
    entry.endPerpsEntry(completed, true, 'live_rows_committed');

    await flush();
    expect(entry.readPerpsLifecycleContext()).toBe('warm');
    await flush();
    expect(jest.getTimerCount()).toBe(0);
  });

  it('ends an abandoned destination without ending its replacement', async () => {
    const oldId = entry.startPerpsEntry('home');
    const newId = entry.startPerpsEntry('market_list');
    entry.endPerpsEntry(oldId, true, 'live_rows_committed');

    await flush();
    expect(endTrace).toHaveBeenCalledTimes(1);
    await flush();
    expect(endTrace).toHaveBeenCalledWith(
      expect.objectContaining({
        id: oldId,
        data: { success: false, reason: 'generation_changed' },
      }),
    );
    entry.endPerpsEntry(newId, true, 'live_rows_committed');
    await flush();
    expect(endTrace).toHaveBeenCalledTimes(2);
  });

  it('times out an entry that never renders live rows', async () => {
    const id = entry.startPerpsEntry('home');

    jest.advanceTimersByTime(30_000);

    await flush();
    expect(endTrace).toHaveBeenCalledWith(
      expect.objectContaining({
        id,
        data: { success: false, reason: 'timeout' },
      }),
    );
    await flush();
    expect(entry.readPerpsLifecycleContext()).toBe('cold_process');
  });

  it('preserves pending entries while hidden and tags a later mount as resume', async () => {
    const cleanup = entry.observePerpsLifecycle();
    const id = entry.startPerpsEntry('home');

    setVisibility('hidden');
    setVisibility('visible');
    await flush();
    expect(entry.startPerpsEntry('home')).toBe(id);
    await flush();
    expect(endTrace).not.toHaveBeenCalled();
    await flush();
    expect(trace).toHaveBeenCalledTimes(1);
    entry.endPerpsEntry(id, false, 'unmounted');
    entry.startPerpsEntry('home');
    await flush();
    expect(trace).toHaveBeenLastCalledWith(
      expect.objectContaining({
        tags: expect.objectContaining({
          [entry.PERPS_LIFECYCLE_TAG]: 'background_resume',
        }),
      }),
    );
    cleanup();
  });

  it('classifies resume before a mounted child starts its next entry', async () => {
    const id = entry.startPerpsEntry('home');
    entry.endPerpsEntry(id, true, 'live_rows_committed');
    await flush();
    const childListener = () => {
      if (document.visibilityState === 'visible') {
        entry.startPerpsEntry('home');
      }
    };
    // React child effects can subscribe before the wallet-root effect.
    document.addEventListener('visibilitychange', childListener);
    const cleanup = entry.observePerpsLifecycle();

    setVisibility('hidden');
    setVisibility('visible');

    await flush();
    expect(trace).toHaveBeenLastCalledWith(
      expect.objectContaining({
        tags: expect.objectContaining({
          [entry.PERPS_LIFECYCLE_TAG]: 'background_resume',
        }),
      }),
    );
    await flush();
    expect(endTrace).toHaveBeenCalledTimes(1);
    await flush();
    expect(jest.getTimerCount()).toBe(1);
    document.removeEventListener('visibilitychange', childListener);
    cleanup();
  });

  it.each(['empty', 'position', 'order'] as const)(
    'uses the documented Home name, operation and %s variant',
    async (variant) => {
      const id = entry.startPerpsEntry('home');
      entry.endPerpsEntry(id, true, 'live_rows_committed', variant);
      entry.endPerpsEntry(id, true, 'live_rows_committed', variant);

      await flush();
      expect(trace).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Perps Entry To Live Market List',
          op: 'perps.operation',
        }),
      );
      await flush();
      expect(endTrace).toHaveBeenCalledTimes(1);
      await flush();
      expect(endTrace).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Perps Entry To Live Market List',
          id,
          data: { success: true, variant },
        }),
      );
    },
  );

  it('uses the separate documented market browser name', async () => {
    const id = entry.startPerpsEntry('market_list');
    entry.endPerpsEntry(id, true, 'live_rows_committed');

    await flush();
    expect(trace).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Perps Market List View',
        op: 'perps.operation',
      }),
    );
    await flush();
    expect(endTrace).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Perps Market List View',
        id,
        data: { success: true },
      }),
    );
  });

  it('removes the document listener on cleanup', async () => {
    const cleanup = entry.observePerpsLifecycle();
    cleanup();

    setVisibility('hidden');
    setVisibility('visible');

    await flush();
    expect(entry.readPerpsLifecycleContext()).toBe('cold_process');
  });
  it('reads settled background state after a UI module reload', async () => {
    const id = entry.startPerpsEntry('home');
    entry.endPerpsEntry(id, true, 'live_rows_committed');
    await flush();
    jest.isolateModules(() => {
      entry = jest.requireActual('./entry-trace');
    });
    await entry.primePerpsLifecycleContext();
    entry.startPerpsEntry('home');
    expect(trace).toHaveBeenLastCalledWith(
      expect.objectContaining({
        tags: expect.objectContaining({ [entry.PERPS_LIFECYCLE_TAG]: 'warm' }),
      }),
    );
  });

  it('starts and ends synchronously while the lifecycle lookup is pending', async () => {
    let resolve!: (context: string) => void;
    jest.mocked(submitRequestToBackground).mockImplementation((method) =>
      method === 'perpsGetLifecycleContext'
        ? new Promise<string>((done) => {
            resolve = done;
          })
        : Promise.resolve(undefined),
    );
    jest.isolateModules(() => {
      entry = jest.requireActual('./entry-trace');
    });
    const priming = entry.primePerpsLifecycleContext();
    expect(entry.primePerpsLifecycleContext()).toBe(priming);
    const id = entry.startPerpsEntry('home');
    expect(trace).toHaveBeenCalledTimes(1);
    expect(trace).toHaveBeenCalledWith(
      expect.objectContaining({
        tags: expect.objectContaining({
          [entry.PERPS_LIFECYCLE_TAG]: 'unknown',
        }),
      }),
    );
    expect(jest.mocked(trace).mock.calls[0][0]).not.toHaveProperty('startTime');
    jest.advanceTimersByTime(50);
    const timestamp = getPerformanceTimestamp();
    entry.endPerpsEntry(id, true, 'live_rows_committed');
    expect(endTrace).toHaveBeenCalledWith(
      expect.objectContaining({ id, timestamp }),
    );
    resolve('cold_process');
    await priming;
    expect(entry.readPerpsLifecycleContext()).toBe('warm');
    expect(trace).toHaveBeenCalledTimes(1);
    expect(endTrace).toHaveBeenCalledTimes(1);
  });

  it('keeps unknown on lookup timeout without delaying abandoned trace cleanup', async () => {
    jest
      .mocked(submitRequestToBackground)
      .mockReturnValue(new Promise(() => undefined));
    jest.isolateModules(() => {
      entry = jest.requireActual('./entry-trace');
    });
    const priming = entry.primePerpsLifecycleContext();
    const id = entry.startPerpsEntry('home');
    entry.endPerpsEntry(id, false, 'unmounted');
    expect(endTrace).toHaveBeenCalledWith(expect.objectContaining({ id }));
    jest.advanceTimersByTime(1_000);
    await priming;
    expect(entry.readPerpsLifecycleContext()).toBe('unknown');
    expect(submitRequestToBackground).not.toHaveBeenCalledWith(
      'perpsMarkForegroundSettled',
      [],
    );
  });

  it('does not let a delayed lifecycle read overwrite a resume transition', async () => {
    let resolve!: (context: string) => void;
    jest.mocked(submitRequestToBackground).mockReturnValue(
      new Promise<string>((done) => {
        resolve = done;
      }),
    );
    jest.isolateModules(() => {
      entry = jest.requireActual('./entry-trace');
    });
    const cleanup = entry.observePerpsLifecycle();
    const priming = entry.primePerpsLifecycleContext();
    setVisibility('hidden');
    setVisibility('visible');
    resolve('cold_process');
    await priming;
    expect(entry.readPerpsLifecycleContext()).toBe('background_resume');
    cleanup();
  });

  it('keeps settlement from another UI when a delayed cold lookup completes', async () => {
    let resolve!: (context: string) => void;
    jest.mocked(submitRequestToBackground).mockReturnValue(
      new Promise<string>((done) => {
        resolve = done;
      }),
    );
    jest.isolateModules(() => {
      entry = jest.requireActual('./entry-trace');
    });
    const priming = entry.primePerpsLifecycleContext();
    entry.markPerpsLifecycleWarm();
    resolve('cold_process');
    await priming;
    expect(entry.readPerpsLifecycleContext()).toBe('warm');
    const cleanup = entry.observePerpsLifecycle();
    setVisibility('hidden');
    setVisibility('visible');
    entry.markPerpsLifecycleWarm();
    expect(entry.readPerpsLifecycleContext()).toBe('background_resume');
    cleanup();
  });

  it('falls back to unknown when lifecycle priming fails', async () => {
    jest
      .mocked(submitRequestToBackground)
      .mockRejectedValueOnce(new Error('offline'));
    jest.isolateModules(() => {
      entry = jest.requireActual('./entry-trace');
    });
    await entry.primePerpsLifecycleContext();
    expect(entry.readPerpsLifecycleContext()).toBe('unknown');
  });

  it('primes once and reads cached lifecycle without another RPC', async () => {
    const calls = jest.mocked(submitRequestToBackground).mock.calls.length;
    await entry.primePerpsLifecycleContext();
    expect(entry.readPerpsLifecycleContext()).toBe('cold_process');
    const id = entry.startPerpsEntry('home');
    entry.endPerpsEntry(id, false, 'unmounted');
    expect(submitRequestToBackground).toHaveBeenCalledTimes(calls);
    expect(endTrace).toHaveBeenCalledWith(expect.objectContaining({ id }));
  });

  it('attempts trace cleanup when trace creation throws', async () => {
    const diagnostic = jest
      .spyOn(console, 'debug')
      .mockImplementation(() => undefined);
    jest.mocked(trace).mockImplementationOnce(() => {
      throw new Error('trace failed');
    });
    const id = entry.startPerpsEntry('home');
    entry.endPerpsEntry(id, true, 'live_rows_committed');
    await flush();
    expect(endTrace).toHaveBeenCalledWith(expect.objectContaining({ id }));
    expect(diagnostic).toHaveBeenCalledWith(
      '[PerpsEntry] Trace start failed',
      expect.any(Error),
    );
    diagnostic.mockRestore();
    expect(jest.getTimerCount()).toBe(0);
  });
});
