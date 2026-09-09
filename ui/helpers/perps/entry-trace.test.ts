import { it } from '@jest/globals';
import { trace, endTrace, TraceName } from '../../../shared/lib/trace';

jest.mock('../../../shared/lib/trace', () => ({
  ...jest.requireActual('../../../shared/lib/trace'),
  trace: jest.fn(),
  endTrace: jest.fn(),
}));

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
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    setVisibility('visible');
    Object.defineProperty(crypto, 'randomUUID', {
      configurable: true,
      value: () => `entry-${(sequence += 1)}`,
    });
    jest.isolateModules(() => {
      entry = jest.requireActual('./entry-trace');
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('reuses the span during the same mounted entry', () => {
    const id = entry.startPerpsEntry('home');
    const mountedId = entry.startPerpsEntry('home');

    expect(mountedId).toBe(id);
    expect(trace).toHaveBeenCalledTimes(1);
    expect(trace).toHaveBeenCalledWith(
      expect.objectContaining({
        name: TraceName.PerpsEntryToLiveMarketList,
        tags: expect.objectContaining({
          [entry.PERPS_LIFECYCLE_TAG]: 'cold_process',
        }),
      }),
    );
  });

  it('consumes cold context only after a successful entry', () => {
    const abandoned = entry.startPerpsEntry('home');
    entry.endPerpsEntry(abandoned, false, 'unmounted');
    expect(entry.getPerpsLifecycleContext()).toBe('cold_process');

    const completed = entry.startPerpsEntry('home');
    entry.endPerpsEntry(completed, true, 'live_rows_committed');

    expect(entry.getPerpsLifecycleContext()).toBe('warm');
    expect(jest.getTimerCount()).toBe(0);
  });

  it('ends an abandoned destination without ending its replacement', () => {
    const oldId = entry.startPerpsEntry('home');
    const newId = entry.startPerpsEntry('market_list');
    entry.endPerpsEntry(oldId, true, 'late_render');

    expect(endTrace).toHaveBeenCalledTimes(1);
    expect(endTrace).toHaveBeenCalledWith(
      expect.objectContaining({
        id: oldId,
        data: { success: false, reason: 'generation_changed' },
      }),
    );
    entry.endPerpsEntry(newId, true, 'live_rows_committed');
    expect(endTrace).toHaveBeenCalledTimes(2);
  });

  it('times out an entry that never renders live rows', () => {
    const id = entry.startPerpsEntry('home');

    jest.advanceTimersByTime(30_000);

    expect(endTrace).toHaveBeenCalledWith(
      expect.objectContaining({
        id,
        data: { success: false, reason: 'timeout' },
      }),
    );
    expect(entry.getPerpsLifecycleContext()).toBe('cold_process');
  });

  it('abandons hidden entries and tags the next entry as background resume', () => {
    const cleanup = entry.observePerpsLifecycle();
    const id = entry.startPerpsEntry('home');

    setVisibility('hidden');
    setVisibility('visible');
    entry.startPerpsEntry('home');

    expect(endTrace).toHaveBeenCalledWith(
      expect.objectContaining({
        id,
        data: { success: false, reason: 'app_backgrounded' },
      }),
    );
    expect(trace).toHaveBeenLastCalledWith(
      expect.objectContaining({
        tags: expect.objectContaining({
          [entry.PERPS_LIFECYCLE_TAG]: 'background_resume',
        }),
      }),
    );
    cleanup();
  });

  it('classifies resume before a mounted child starts its next entry', () => {
    const id = entry.startPerpsEntry('home');
    entry.endPerpsEntry(id, true, 'live_rows_committed');
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

    expect(trace).toHaveBeenLastCalledWith(
      expect.objectContaining({
        tags: expect.objectContaining({
          [entry.PERPS_LIFECYCLE_TAG]: 'background_resume',
        }),
      }),
    );
    expect(endTrace).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(1);
    document.removeEventListener('visibilitychange', childListener);
    cleanup();
  });

  it.each(['empty', 'position', 'order'] as const)(
    'uses the documented Home name, operation and %s variant',
    (variant) => {
      const id = entry.startPerpsEntry('home');
      entry.endPerpsEntry(id, true, 'live_rows_committed', variant);
      entry.endPerpsEntry(id, true, 'late_render', variant);

      expect(trace).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Perps Entry To Live Market List',
          op: 'perps.operation',
        }),
      );
      expect(endTrace).toHaveBeenCalledTimes(1);
      expect(endTrace).toHaveBeenCalledWith({
        name: 'Perps Entry To Live Market List',
        id,
        data: { success: true, variant },
      });
    },
  );

  it('uses the separate documented market browser name', () => {
    const id = entry.startPerpsEntry('market_list');
    entry.endPerpsEntry(id, true, 'live_rows_committed');

    expect(trace).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Perps Market List View',
        op: 'perps.operation',
      }),
    );
    expect(endTrace).toHaveBeenCalledWith({
      name: 'Perps Market List View',
      id,
      data: { success: true },
    });
  });

  it('removes the document listener on cleanup', () => {
    const cleanup = entry.observePerpsLifecycle();
    cleanup();

    setVisibility('hidden');
    setVisibility('visible');

    expect(entry.getPerpsLifecycleContext()).toBe('cold_process');
  });
});
