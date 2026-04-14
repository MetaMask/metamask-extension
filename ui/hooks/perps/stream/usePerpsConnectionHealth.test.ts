import { renderHook, act } from '@testing-library/react-hooks';
import { useSelector } from 'react-redux';
import { getPerpsStreamManager } from '../../../providers/perps/PerpsStreamManager';
import { usePerpsConnectionHealth } from './usePerpsConnectionHealth';

const mockSubmitRequestToBackground = jest.fn();
jest.mock('../../../store/background-connection', () => ({
  submitRequestToBackground: (...args: unknown[]) =>
    mockSubmitRequestToBackground(...args),
}));

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('../../../providers/perps/CandleStreamChannel', () => ({
  CandleStreamChannel: jest.fn().mockImplementation(() => ({
    clearAll: jest.fn(),
  })),
}));

let uuidCounter = 0;
Object.defineProperty(globalThis, 'crypto', {
  value: {
    ...globalThis.crypto,
    randomUUID: () => `test-uuid-${(uuidCounter += 1)}`,
  },
});

const useSelectorMock = useSelector as jest.MockedFunction<typeof useSelector>;

const STALE_THRESHOLD_MS = 60_000;
const MIN_HEALTH_CHECK_INTERVAL_MS = 15_000;
const MIN_HIDDEN_DURATION_MS = 30_000;

function fireVisibilityChange(state: 'visible' | 'hidden') {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => state,
  });
  document.dispatchEvent(new Event('visibilitychange'));
}

function setupInitializedStreamManager() {
  const sm = getPerpsStreamManager();
  // Manually mark as initialized by calling init directly
  sm.init('0xtest');
  return sm;
}

describe('usePerpsConnectionHealth', () => {
  let nowSpy: jest.SpyInstance;
  let currentTime: number;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSubmitRequestToBackground.mockReset();
    mockSubmitRequestToBackground.mockResolvedValue(undefined);
    uuidCounter = 0;

    currentTime = 100_000;
    nowSpy = jest.spyOn(Date, 'now').mockImplementation(() => currentTime);

    // Default: device is online
    useSelectorMock.mockImplementation((selector) =>
      (selector as (s: Record<string, unknown>) => unknown)({
        metamask: { connectivityStatus: 'online' },
      }),
    );

    // Reset stream manager
    getPerpsStreamManager().reset();

    // Default document visibility
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    });
  });

  afterEach(() => {
    nowSpy.mockRestore();
    getPerpsStreamManager().reset();
  });

  it('does not run when stream manager is not initialized', async () => {
    renderHook(() => usePerpsConnectionHealth());

    await act(async () => {
      currentTime += MIN_HIDDEN_DURATION_MS + 1;
      fireVisibilityChange('hidden');
      currentTime += MIN_HIDDEN_DURATION_MS + 1;
      fireVisibilityChange('visible');
    });

    expect(mockSubmitRequestToBackground).not.toHaveBeenCalledWith(
      'perpsGetConnectionState',
    );
    expect(mockSubmitRequestToBackground).not.toHaveBeenCalledWith(
      'perpsReconnect',
    );
  });

  it('triggers reconnect when visibilitychange fires after stale data', async () => {
    const sm = setupInitializedStreamManager();
    // Last update was long ago
    sm.handleBackgroundUpdate({ channel: 'positions', data: [] });
    const updateTime = currentTime;
    currentTime = updateTime + STALE_THRESHOLD_MS + 1;

    mockSubmitRequestToBackground.mockImplementation(async (method: string) => {
      if (method === 'perpsGetConnectionState') {
        return 'connected';
      }
      if (method === 'perpsGetPositions') {
        return [{ symbol: 'BTC', size: '1' }];
      }
      if (method === 'perpsGetOpenOrders') {
        return [];
      }
      if (method === 'perpsGetAccountState') {
        return { equity: '100' };
      }
      return undefined;
    });

    renderHook(() => usePerpsConnectionHealth());

    // Simulate hidden for long enough
    fireVisibilityChange('hidden');
    currentTime += MIN_HIDDEN_DURATION_MS + 1;

    await act(async () => {
      fireVisibilityChange('visible');
    });

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'perpsGetConnectionState',
    );
    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'perpsReconnect',
    );
    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'perpsGetPositions',
      [{ skipCache: true }],
    );
    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'perpsGetOpenOrders',
    );
    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'perpsGetAccountState',
    );
  });

  it('triggers reconnect when connection state is disconnected even if data is fresh', async () => {
    const sm = setupInitializedStreamManager();
    // Data is fresh
    sm.handleBackgroundUpdate({ channel: 'positions', data: [] });

    mockSubmitRequestToBackground.mockImplementation(async (method: string) => {
      if (method === 'perpsGetConnectionState') {
        return 'disconnected';
      }
      return undefined;
    });

    renderHook(() => usePerpsConnectionHealth());

    fireVisibilityChange('hidden');
    currentTime += MIN_HIDDEN_DURATION_MS + 1;

    await act(async () => {
      fireVisibilityChange('visible');
    });

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'perpsReconnect',
    );
  });

  it('does NOT reconnect when data is fresh and connection is healthy', async () => {
    const sm = setupInitializedStreamManager();
    // Data is fresh (just updated)
    sm.handleBackgroundUpdate({ channel: 'positions', data: [] });

    mockSubmitRequestToBackground.mockImplementation(async (method: string) => {
      if (method === 'perpsGetConnectionState') {
        return 'connected';
      }
      return undefined;
    });

    renderHook(() => usePerpsConnectionHealth());

    fireVisibilityChange('hidden');
    currentTime += MIN_HIDDEN_DURATION_MS + 1;

    await act(async () => {
      fireVisibilityChange('visible');
    });

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'perpsGetConnectionState',
    );
    expect(mockSubmitRequestToBackground).not.toHaveBeenCalledWith(
      'perpsReconnect',
    );
  });

  it('debounces rapid online recovery checks', async () => {
    setupInitializedStreamManager();

    mockSubmitRequestToBackground.mockImplementation(async (method: string) => {
      if (method === 'perpsGetConnectionState') {
        return 'disconnected';
      }
      return undefined;
    });

    // Start offline
    useSelectorMock.mockImplementation((selector) =>
      (selector as (s: Record<string, unknown>) => unknown)({
        metamask: { connectivityStatus: 'offline' },
      }),
    );

    const { rerender } = renderHook(() => usePerpsConnectionHealth());

    // First online transition — triggers reconnect
    useSelectorMock.mockImplementation((selector) =>
      (selector as (s: Record<string, unknown>) => unknown)({
        metamask: { connectivityStatus: 'online' },
      }),
    );

    await act(async () => {
      rerender();
    });

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'perpsReconnect',
    );

    const callCountAfterFirst = mockSubmitRequestToBackground.mock.calls.length;

    // Go offline and back online again quickly (within debounce window)
    useSelectorMock.mockImplementation((selector) =>
      (selector as (s: Record<string, unknown>) => unknown)({
        metamask: { connectivityStatus: 'offline' },
      }),
    );
    await act(async () => {
      rerender();
    });

    useSelectorMock.mockImplementation((selector) =>
      (selector as (s: Record<string, unknown>) => unknown)({
        metamask: { connectivityStatus: 'online' },
      }),
    );
    await act(async () => {
      rerender();
    });

    // Should be debounced — no new background calls
    expect(mockSubmitRequestToBackground.mock.calls.length).toBe(
      callCountAfterFirst,
    );
  });

  it('allows online recovery check after debounce interval passes', async () => {
    setupInitializedStreamManager();

    mockSubmitRequestToBackground.mockImplementation(async (method: string) => {
      if (method === 'perpsGetConnectionState') {
        return 'disconnected';
      }
      return undefined;
    });

    // Start offline
    useSelectorMock.mockImplementation((selector) =>
      (selector as (s: Record<string, unknown>) => unknown)({
        metamask: { connectivityStatus: 'offline' },
      }),
    );

    const { rerender } = renderHook(() => usePerpsConnectionHealth());

    // First online transition
    useSelectorMock.mockImplementation((selector) =>
      (selector as (s: Record<string, unknown>) => unknown)({
        metamask: { connectivityStatus: 'online' },
      }),
    );
    await act(async () => {
      rerender();
    });

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'perpsReconnect',
    );
    mockSubmitRequestToBackground.mockClear();

    // Advance past debounce interval
    currentTime += MIN_HEALTH_CHECK_INTERVAL_MS + 1;

    // Go offline and back online — should proceed this time
    useSelectorMock.mockImplementation((selector) =>
      (selector as (s: Record<string, unknown>) => unknown)({
        metamask: { connectivityStatus: 'offline' },
      }),
    );
    await act(async () => {
      rerender();
    });

    useSelectorMock.mockImplementation((selector) =>
      (selector as (s: Record<string, unknown>) => unknown)({
        metamask: { connectivityStatus: 'online' },
      }),
    );
    await act(async () => {
      rerender();
    });

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'perpsReconnect',
    );
  });

  it('skips check if hidden for less than MIN_HIDDEN_DURATION_MS', async () => {
    setupInitializedStreamManager();

    renderHook(() => usePerpsConnectionHealth());

    fireVisibilityChange('hidden');
    currentTime += MIN_HIDDEN_DURATION_MS - 1; // Not long enough

    await act(async () => {
      fireVisibilityChange('visible');
    });

    expect(mockSubmitRequestToBackground).not.toHaveBeenCalledWith(
      'perpsGetConnectionState',
    );
  });

  it('handles perpsReconnect failure gracefully', async () => {
    const consoleSpy = jest
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined);

    setupInitializedStreamManager();

    mockSubmitRequestToBackground.mockImplementation(async (method: string) => {
      if (method === 'perpsGetConnectionState') {
        return 'disconnected';
      }
      if (method === 'perpsReconnect') {
        throw new Error('reconnect failed');
      }
      return undefined;
    });

    renderHook(() => usePerpsConnectionHealth());

    fireVisibilityChange('hidden');
    currentTime += MIN_HIDDEN_DURATION_MS + 1;

    await act(async () => {
      fireVisibilityChange('visible');
    });

    // Should not throw — error is caught and logged
    expect(consoleSpy).toHaveBeenCalledWith(
      '[Perps] Connection health reconnect failed:',
      expect.any(Error),
    );

    // REST hydration should still run after reconnect failure
    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'perpsGetPositions',
      [{ skipCache: true }],
    );

    consoleSpy.mockRestore();
  });

  it('triggers reconnect on isDeviceOffline transition from true to false', async () => {
    setupInitializedStreamManager();

    mockSubmitRequestToBackground.mockImplementation(async (method: string) => {
      if (method === 'perpsGetConnectionState') {
        return 'disconnected';
      }
      return undefined;
    });

    // Start offline
    useSelectorMock.mockImplementation((selector) =>
      (selector as (s: Record<string, unknown>) => unknown)({
        metamask: { connectivityStatus: 'offline' },
      }),
    );

    const { rerender } = renderHook(() => usePerpsConnectionHealth());

    // Transition to online
    useSelectorMock.mockImplementation((selector) =>
      (selector as (s: Record<string, unknown>) => unknown)({
        metamask: { connectivityStatus: 'online' },
      }),
    );

    await act(async () => {
      rerender();
    });

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'perpsReconnect',
    );
  });

  it('does not trigger reconnect when device stays online', async () => {
    setupInitializedStreamManager();

    // Already online
    useSelectorMock.mockImplementation((selector) =>
      (selector as (s: Record<string, unknown>) => unknown)({
        metamask: { connectivityStatus: 'online' },
      }),
    );

    const { rerender } = renderHook(() => usePerpsConnectionHealth());

    await act(async () => {
      rerender();
    });

    expect(mockSubmitRequestToBackground).not.toHaveBeenCalledWith(
      'perpsGetConnectionState',
    );
  });

  it('handles perpsGetConnectionState failure gracefully', async () => {
    setupInitializedStreamManager();
    // No data received = stale

    mockSubmitRequestToBackground.mockImplementation(async (method: string) => {
      if (method === 'perpsGetConnectionState') {
        throw new Error('not available');
      }
      return undefined;
    });

    renderHook(() => usePerpsConnectionHealth());

    fireVisibilityChange('hidden');
    currentTime += MIN_HIDDEN_DURATION_MS + 1;

    await act(async () => {
      fireVisibilityChange('visible');
    });

    // Should still reconnect based on staleness alone (connectionState falls back to 'unknown')
    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'perpsReconnect',
    );
  });

  it('pushes REST-fetched data into stream manager channels after reconnect', async () => {
    const sm = setupInitializedStreamManager();
    const pushPositionsSpy = jest.spyOn(sm, 'pushPositionsWithOverrides');
    const pushOrdersSpy = jest.spyOn(sm.orders, 'pushData');
    const pushAccountSpy = jest.spyOn(sm.account, 'pushData');

    const mockPositions = [{ symbol: 'BTC', size: '1' }];
    const mockOrders = [{ orderId: '1' }];
    const mockAccount = { equity: '100' };

    mockSubmitRequestToBackground.mockImplementation(async (method: string) => {
      if (method === 'perpsGetConnectionState') {
        return 'disconnected';
      }
      if (method === 'perpsGetPositions') {
        return mockPositions;
      }
      if (method === 'perpsGetOpenOrders') {
        return mockOrders;
      }
      if (method === 'perpsGetAccountState') {
        return mockAccount;
      }
      return undefined;
    });

    renderHook(() => usePerpsConnectionHealth());

    fireVisibilityChange('hidden');
    currentTime += MIN_HIDDEN_DURATION_MS + 1;

    await act(async () => {
      fireVisibilityChange('visible');
    });

    expect(pushPositionsSpy).toHaveBeenCalledWith(mockPositions);
    expect(pushOrdersSpy).toHaveBeenCalledWith(mockOrders);
    expect(pushAccountSpy).toHaveBeenCalledWith(mockAccount);

    pushPositionsSpy.mockRestore();
    pushOrdersSpy.mockRestore();
    pushAccountSpy.mockRestore();
  });
});
