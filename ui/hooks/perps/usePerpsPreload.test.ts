import { it } from '@jest/globals';
import { act, renderHook } from '@testing-library/react';
import { useSelector } from 'react-redux';
import { trace, endTrace, TraceName } from '../../../shared/lib/trace';
import { submitRequestToBackground } from '../../store/background-connection';
import { CandlePeriod } from '../../components/app/perps/constants/chartConfig';
import type { PerpsStreamManager } from '../../providers/perps/PerpsStreamManager';
import { usePerpsPreload } from './usePerpsPreload';

jest.mock('react-redux', () => ({ useSelector: jest.fn() }));
jest.mock('../../selectors', () => ({
  getUseExternalServices: (state: { external: boolean }) => state.external,
}));
jest.mock('../../selectors/perps/feature-flags', () => ({
  getIsPerpsExperienceAvailable: (state: { available: boolean }) =>
    state.available,
  getIsPerpsTerminalBackendEnabled: (state: { terminal: boolean }) =>
    state.terminal,
}));
jest.mock('../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn(),
}));
jest.mock('../../../shared/lib/trace', () => ({
  ...jest.requireActual('../../../shared/lib/trace'),
  trace: jest.fn(),
  endTrace: jest.fn(),
}));
jest.mock('../../helpers/perps/entry-trace', () => ({
  getPerpsLifecycleContext: () => 'cold_process',
  observePerpsLifecycle: () => jest.fn(),
  PERPS_LIFECYCLE_TAG: 'lifecycle_context',
}));
const mockManager = {
  initForAddress: jest.fn(),
  reset: jest.fn(),
  setUseTerminalApi: jest.fn(),
  prewarm: jest.fn(),
  cleanupPrewarm: jest.fn(),
  clearAllCaches: jest.fn(),
};
let mockCurrentManager: typeof mockManager | PerpsStreamManager = mockManager;
jest.mock('../../providers/perps/PerpsStreamManager', () => ({
  getPerpsStreamManager: () => mockCurrentManager,
}));

function deferred() {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });
  return { promise, resolve, reject };
}

describe('usePerpsPreload', () => {
  let state: ReturnType<typeof createState>;
  let sequence = 0;
  function createState() {
    return {
      available: true,
      external: true,
      terminal: false,
      metamask: {
        activeProvider: 'hyperliquid',
        isTestnet: false,
        internalAccounts: {
          selectedAccount: 'selected',
          accounts: { selected: { address: '0xfirst' } },
        },
      },
    };
  }

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    state = createState();
    mockCurrentManager = mockManager;
    jest
      .mocked(useSelector)
      .mockImplementation((selector) => selector(state as never));
    jest.mocked(submitRequestToBackground).mockResolvedValue(undefined);
    mockManager.initForAddress.mockResolvedValue(undefined);
    Object.defineProperty(crypto, 'randomUUID', {
      configurable: true,
      value: () => `preload-${(sequence += 1)}`,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it.each(['locked', 'rollout', 'external', 'account'] as const)(
    'does not preload when gated by %s',
    async (gate) => {
      if (gate === 'rollout') {
        state.available = false;
      }
      if (gate === 'external') {
        state.external = false;
      }
      if (gate === 'account') {
        state.metamask.internalAccounts.accounts.selected.address = '';
      }

      await act(async () => {
        renderHook(() => usePerpsPreload(gate !== 'locked'));
      });

      expect(mockManager.reset).toHaveBeenCalled();
      expect(mockManager.initForAddress).not.toHaveBeenCalled();
      expect(trace).not.toHaveBeenCalled();
    },
  );

  it('ends the connection span only after the background subscriptions are ready', async () => {
    const ready = deferred();
    jest
      .mocked(submitRequestToBackground)
      .mockImplementation((method) =>
        method === 'perpsStartPreload'
          ? ready.promise
          : Promise.resolve(undefined),
      );
    let unmount!: () => void;
    await act(async () => {
      ({ unmount } = renderHook(() => usePerpsPreload(true)));
    });
    expect(endTrace).not.toHaveBeenCalled();
    expect(mockManager.prewarm).toHaveBeenCalledTimes(1);

    await act(async () => {
      ready.resolve();
    });

    expect(endTrace).toHaveBeenCalledWith(
      expect.objectContaining({
        name: TraceName.PerpsConnectionEstablishment,
        data: { success: true, reason: 'subscriptions_ready' },
      }),
    );
    const { id } = jest.mocked(trace).mock.calls[0][0];
    unmount();
    expect(submitRequestToBackground).toHaveBeenCalledWith('perpsStopPreload', [
      id,
    ]);
    expect(endTrace).toHaveBeenCalledTimes(1);
    expect(mockManager.clearAllCaches).toHaveBeenCalled();
    expect(jest.getTimerCount()).toBe(0);
  });

  it('does not start subscriptions after unmount during initialization', async () => {
    const init = deferred();
    mockManager.initForAddress.mockReturnValue(init.promise);
    const { unmount } = renderHook(() => usePerpsPreload(true));

    unmount();
    await act(async () => {
      init.resolve();
    });

    expect(mockManager.prewarm).not.toHaveBeenCalled();
    expect(submitRequestToBackground).not.toHaveBeenCalledWith(
      'perpsStartPreload',
      expect.anything(),
    );
    expect(endTrace).toHaveBeenCalledTimes(1);
    expect(endTrace).toHaveBeenCalledWith(
      expect.objectContaining({ data: { success: false, reason: 'released' } }),
    );
  });

  it('records a timeout once and ignores late connection completion', async () => {
    const ready = deferred();
    jest
      .mocked(submitRequestToBackground)
      .mockImplementation((method) =>
        method === 'perpsStartPreload'
          ? ready.promise
          : Promise.resolve(undefined),
      );
    await act(async () => {
      renderHook(() => usePerpsPreload(true));
    });

    await act(async () => {
      jest.advanceTimersByTime(30_000);
      ready.resolve();
    });

    expect(endTrace).toHaveBeenCalledTimes(1);
    expect(endTrace).toHaveBeenCalledWith(
      expect.objectContaining({ data: { success: false, reason: 'timeout' } }),
    );
    expect(mockManager.cleanupPrewarm).toHaveBeenCalled();
  });

  it('records initialization failure without claiming readiness', async () => {
    mockManager.initForAddress.mockRejectedValue(new Error('offline'));
    const debug = jest
      .spyOn(console, 'debug')
      .mockImplementation(() => undefined);

    await act(async () => {
      renderHook(() => usePerpsPreload(true));
    });

    expect(endTrace).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { success: false, reason: 'connection_failed' },
      }),
    );
    expect(mockManager.prewarm).not.toHaveBeenCalled();
    expect(jest.getTimerCount()).toBe(0);
    debug.mockRestore();
  });

  it.each(['account', 'provider', 'network', 'terminal'] as const)(
    'releases the old owner when %s changes',
    async (change) => {
      let rerender!: () => void;
      await act(async () => {
        ({ rerender } = renderHook(() => usePerpsPreload(true)));
      });
      const firstId = jest.mocked(trace).mock.calls[0][0].id;
      if (change === 'account') {
        state.metamask.internalAccounts.accounts.selected.address = '0xsecond';
      }
      if (change === 'provider') {
        state.metamask.activeProvider = 'aggregated';
      }
      if (change === 'network') {
        state.metamask.isTestnet = true;
      }
      if (change === 'terminal') {
        state.terminal = true;
      }

      await act(async () => {
        rerender();
      });

      expect(submitRequestToBackground).toHaveBeenCalledWith(
        'perpsStopPreload',
        [firstId],
      );
      expect(trace).toHaveBeenCalledTimes(2);
      expect(jest.mocked(trace).mock.calls[1][0].id).not.toBe(firstId);
      if (change === 'terminal') {
        expect(mockManager.clearAllCaches).not.toHaveBeenCalled();
      } else {
        expect(mockManager.clearAllCaches).toHaveBeenCalled();
      }
    },
  );

  it('resets the manager when the unlocked wallet becomes locked', async () => {
    let rerender!: (props: { ready: boolean }) => void;
    const initialProps: { ready: boolean } = { ready: true };
    await act(async () => {
      ({ rerender } = renderHook(
        ({ ready }: { ready: boolean }) => usePerpsPreload(ready),
        {
          initialProps,
        },
      ));
    });

    rerender({ ready: false });

    expect(mockManager.reset).toHaveBeenCalled();
    expect(mockManager.cleanupPrewarm).toHaveBeenCalled();
  });

  it.each([true, false])(
    'keeps mounted candle subscriptions receiving updates when Terminal becomes %s',
    async (terminal) => {
      const { PerpsStreamManager: Manager } = jest.requireActual<
        typeof import('../../providers/perps/PerpsStreamManager')
      >('../../providers/perps/PerpsStreamManager');
      const manager = new Manager();
      mockCurrentManager = manager;
      state.terminal = !terminal;
      const { rerender, unmount } = renderHook(() => usePerpsPreload(true));
      await act(async () => undefined);
      const callback = jest.fn();
      const unsubscribe = manager.candles.subscribe({
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        callback,
      });
      const update = (time: number) => ({
        channel: 'candles',
        symbol: 'BTC',
        interval: CandlePeriod.OneHour,
        data: {
          candles: [
            { time, open: '1', high: '2', low: '1', close: '2', volume: '3' },
          ],
        },
      });
      manager.handleBackgroundUpdate(update(1));
      expect(callback).toHaveBeenCalledWith(update(1).data);

      state.terminal = terminal;
      await act(async () => rerender());
      callback.mockClear();
      manager.handleBackgroundUpdate(update(2));
      expect(callback).toHaveBeenCalledWith(update(2).data);
      expect(submitRequestToBackground).not.toHaveBeenCalledWith(
        'perpsDeactivateCandleStream',
        expect.anything(),
      );
      unsubscribe();
      unmount();
      manager.reset();
    },
  );
});
