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
  selectEvmAddress: jest.requireActual('../../selectors').selectEvmAddress,
  getSelectedEvmInternalAccount:
    jest.requireActual('../../selectors').getSelectedEvmInternalAccount,
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
  getPerformanceTimestamp: () => Date.now(),
}));
jest.mock('../../helpers/perps/entry-trace', () => ({
  getPerpsLifecycleContext: () => Promise.resolve('cold_process'),
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
          accounts: {
            selected: {
              address: '0xfirst',
              type: 'eip155:eoa',
              metadata: { name: 'EVM', lastSelected: 1 },
            },
          },
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

  it('registers ownership before initializing and cancels before delayed registration completes', async () => {
    const registration = deferred();
    jest
      .mocked(submitRequestToBackground)
      .mockImplementation((method) =>
        method === 'perpsRegisterPreload'
          ? registration.promise
          : Promise.resolve(undefined),
      );
    const { unmount } = renderHook(() => usePerpsPreload(true));
    expect(submitRequestToBackground).toHaveBeenCalledWith(
      'perpsRegisterPreload',
      [expect.any(String)],
    );
    expect(mockManager.initForAddress).not.toHaveBeenCalled();
    unmount();
    await act(async () => {
      registration.resolve();
    });
    expect(mockManager.initForAddress).not.toHaveBeenCalled();
    expect(submitRequestToBackground).not.toHaveBeenCalledWith(
      'perpsStartPreload',
      expect.anything(),
    );
  });

  it('uses the explicitly selected EVM account when another EVM account has newer metadata', async () => {
    Object.assign(state.metamask.internalAccounts.accounts, {
      other: {
        address: '0xother',
        type: 'eip155:eoa',
        metadata: { lastSelected: 2 },
      },
    });
    await act(async () => {
      renderHook(() => usePerpsPreload(true));
    });
    expect(mockManager.initForAddress).toHaveBeenCalledWith('0xfirst');
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

  it.each([
    ['BTC', 'bc1qselected', 'bip122:p2wpkh'],
    ['Tron', 'TSelected', 'tron:eoa'],
  ])(
    'preloads the EVM session while %s is selected',
    async (name, address, type) => {
      const evm = {
        id: 'evm',
        address: '0xready',
        type: 'eip155:eoa',
        metadata: { name: 'EVM', lastSelected: 1 },
      };
      const nonEvm = {
        id: 'non-evm',
        address,
        type,
        metadata: { name, lastSelected: 2 },
      };
      const nonEvmState = {
        ...state,
        metamask: {
          ...state.metamask,
          internalAccounts: {
            selectedAccount: nonEvm.id,
            accounts: { evm, nonEvm },
          },
        },
      };
      jest
        .mocked(useSelector)
        .mockImplementation((selector) => selector(nonEvmState as never));

      await act(async () => {
        renderHook(() => usePerpsPreload(true));
      });
      expect(mockManager.initForAddress).toHaveBeenCalledWith('0xready');
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
    let unmount!: () => void;
    await act(async () => {
      ({ unmount } = renderHook(() => usePerpsPreload(true)));
    });
    expect(mockManager.initForAddress).toHaveBeenCalledTimes(1);

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
        state = structuredClone(state);
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
      expect(jest.mocked(trace).mock.calls[1][0].name).toBe(
        change === 'account'
          ? TraceName.PerpsAccountSwitchReconnection
          : TraceName.PerpsConnectionEstablishment,
      );
      expect(jest.mocked(trace).mock.calls[1][0].id).not.toBe(firstId);
      if (change === 'terminal') {
        expect(mockManager.clearAllCaches).not.toHaveBeenCalled();
      } else {
        expect(mockManager.clearAllCaches).toHaveBeenCalled();
      }
    },
  );

  it('waits for account preload and keeps superseded trace IDs independent', async () => {
    const { rerender } = renderHook(() => usePerpsPreload(true));
    await act(async () => undefined);
    const second = deferred();
    const third = deferred();
    jest.mocked(submitRequestToBackground).mockImplementation((method) => {
      if (method !== 'perpsStartPreload') {
        return Promise.resolve(undefined);
      }
      return state.metamask.internalAccounts.accounts.selected.address ===
        '0xsecond'
        ? second.promise
        : third.promise;
    });

    state = structuredClone(state);
    state.metamask.internalAccounts.accounts.selected.address = '0xsecond';
    await act(async () => rerender());
    const secondTrace = jest.mocked(trace).mock.calls[1][0];
    expect(secondTrace).toEqual(
      expect.objectContaining({
        name: TraceName.PerpsAccountSwitchReconnection,
        tags: expect.objectContaining({
          source: 'wallet_root',
          trigger: 'requested_account_change',
        }),
      }),
    );
    expect(secondTrace.tags).toHaveProperty(
      'start_boundary',
      'wallet_root_effect',
    );
    expect(secondTrace.tags).toHaveProperty(
      'completion_boundary',
      'preload_ready',
    );
    expect(secondTrace.tags).toHaveProperty(
      'lifecycle_context',
      'cold_process',
    );
    expect(endTrace).not.toHaveBeenCalledWith(
      expect.objectContaining({ id: secondTrace.id }),
    );

    state = structuredClone(state);
    state.metamask.internalAccounts.accounts.selected.address = '0xfirst';
    await act(async () => rerender());
    const thirdTrace = jest.mocked(trace).mock.calls[2][0];
    expect(thirdTrace.name).toBe(TraceName.PerpsAccountSwitchReconnection);
    expect(thirdTrace.id).not.toBe(secondTrace.id);
    expect(endTrace).toHaveBeenCalledWith(
      expect.objectContaining({
        id: secondTrace.id,
        data: { success: false, reason: 'released' },
      }),
    );
    await act(async () => second.resolve());
    expect(endTrace).not.toHaveBeenCalledWith(
      expect.objectContaining({ id: thirdTrace.id }),
    );
    await act(async () => third.resolve());
    expect(endTrace).toHaveBeenCalledWith(
      expect.objectContaining({
        name: TraceName.PerpsAccountSwitchReconnection,
        id: thirdTrace.id,
        data: { success: true, reason: 'subscriptions_ready' },
      }),
    );
    expect(
      jest
        .mocked(endTrace)
        .mock.calls.filter(([request]) => request.id === secondTrace.id),
    ).toHaveLength(1);
  });

  it('does not classify case-only address changes or unlock as account switches', async () => {
    const { rerender } = renderHook(({ ready }) => usePerpsPreload(ready), {
      initialProps: { ready: true },
    });
    await act(async () => undefined);
    state = structuredClone(state);
    state.metamask.internalAccounts.accounts.selected.address = '0xFIRST';
    await act(async () => rerender({ ready: true }));
    await act(async () => rerender({ ready: false }));
    state = structuredClone(state);
    state.metamask.internalAccounts.accounts.selected.address = '0xsecond';
    await act(async () => rerender({ ready: true }));
    expect(trace).toHaveBeenCalledTimes(3);
    for (const [request] of jest.mocked(trace).mock.calls) {
      expect(request.name).toBe(TraceName.PerpsConnectionEstablishment);
    }
  });

  it.each(['failure', 'timeout'] as const)(
    'ends an unsuccessful account switch on %s',
    async (outcome) => {
      const { rerender } = renderHook(() => usePerpsPreload(true));
      await act(async () => undefined);
      const init = deferred();
      mockManager.initForAddress.mockReturnValueOnce(init.promise);
      state = structuredClone(state);
      state.metamask.internalAccounts.accounts.selected.address = '0xsecond';
      await act(async () => rerender());
      const request = jest.mocked(trace).mock.calls[1][0];
      await act(async () => {
        if (outcome === 'failure') {
          init.reject(new Error('offline'));
        } else {
          jest.advanceTimersByTime(30_000);
          init.resolve();
        }
      });
      expect(endTrace).toHaveBeenCalledWith(
        expect.objectContaining({
          name: TraceName.PerpsAccountSwitchReconnection,
          id: request.id,
          data: {
            success: false,
            reason: outcome === 'failure' ? 'connection_failed' : 'timeout',
          },
        }),
      );
      expect(
        jest
          .mocked(endTrace)
          .mock.calls.filter(([item]) => item.id === request.id),
      ).toHaveLength(1);
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
  it.each(['ready', 'unmount', 'timeout'] as const)(
    'never settles foreground lifecycle after preload %s',
    async (completion) => {
      const ready = deferred();
      jest
        .mocked(submitRequestToBackground)
        .mockImplementation((method) =>
          method === 'perpsStartPreload'
            ? ready.promise
            : Promise.resolve(undefined),
        );
      const { unmount } = renderHook(() => usePerpsPreload(true));
      await act(async () => undefined);
      if (completion === 'unmount') {
        unmount();
      }
      if (completion === 'timeout') {
        await act(async () => {
          jest.advanceTimersByTime(30_000);
        });
      }
      await act(async () => {
        ready.resolve();
      });
      expect(submitRequestToBackground).not.toHaveBeenCalledWith(
        'perpsMarkForegroundSettled',
        [],
      );
      expect(endTrace).toHaveBeenCalledTimes(1);
      expect(endTrace).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ success: completion === 'ready' }),
        }),
      );
      unmount();
    },
  );
});
