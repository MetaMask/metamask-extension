import type { Position } from '@metamask/perps-controller';
import {
  refetchPositionsAfterWrite,
  WS_WAIT_MS,
} from './refetchPositionsAfterWrite';
import { getPerpsStreamManager, PerpsStreamManager } from './PerpsStreamManager';

// Polyfill crypto.randomUUID for jsdom
let uuidCounter = 0;
Object.defineProperty(globalThis, 'crypto', {
  value: {
    ...globalThis.crypto,
    randomUUID: () => `test-uuid-${(uuidCounter += 1)}`,
  },
});

const mockSubmitRequestToBackground = jest.fn().mockResolvedValue(undefined);

jest.mock('../../store/background-connection', () => ({
  submitRequestToBackground: (...args: unknown[]) =>
    mockSubmitRequestToBackground(...args),
}));

jest.mock('./CandleStreamChannel', () => ({
  CandleStreamChannel: jest.fn().mockImplementation(() => ({
    clearAll: jest.fn(),
  })),
}));

jest.mock('./PerpsStreamManager', () => {
  const actual = jest.requireActual('./PerpsStreamManager');
  return {
    ...actual,
    getPerpsStreamManager: jest.fn(() => actual.getPerpsStreamManager()),
  };
});

function makePosition(symbol: string): Position {
  return {
    symbol,
    size: '1.0',
    entryPrice: '100',
    markPrice: '105',
    unrealizedPnl: '5',
    unrealizedPnlPercent: '5',
    leverage: '10',
    liquidationPrice: '90',
    margin: '10',
    side: 'long',
    takeProfitPrice: undefined,
    stopLossPrice: undefined,
  } as Position;
}

describe('refetchPositionsAfterWrite', () => {
  let manager: PerpsStreamManager;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    manager = getPerpsStreamManager();
    manager.reset();
  });

  afterEach(() => {
    manager.reset();
    jest.useRealTimers();
  });

  it('skips REST call when WS pushes positions within the wait window', async () => {
    const promise = refetchPositionsAfterWrite();

    const positions = [makePosition('BTC')];
    manager.positions.pushData(positions);

    await promise;

    expect(mockSubmitRequestToBackground).not.toHaveBeenCalledWith(
      'perpsGetPositions',
      expect.anything(),
    );
  });

  it('falls back to REST with skipCache when WS does not push in time', async () => {
    const freshPositions = [makePosition('ETH')];
    mockSubmitRequestToBackground.mockResolvedValueOnce(freshPositions);

    const promise = refetchPositionsAfterWrite();

    jest.advanceTimersByTime(WS_WAIT_MS);
    await promise;

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'perpsGetPositions',
      [{ skipCache: true }],
    );
  });

  it('pushes fresh REST data via pushPositionsWithOverrides', async () => {
    const freshPositions = [makePosition('SOL')];
    mockSubmitRequestToBackground.mockResolvedValueOnce(freshPositions);

    const cb = jest.fn();
    manager.positions.subscribe(cb);
    cb.mockClear();

    const promise = refetchPositionsAfterWrite();

    jest.advanceTimersByTime(WS_WAIT_MS);
    await promise;

    expect(cb).toHaveBeenCalledWith(freshPositions);
  });

  it('calls clearAllOptimisticTPSL when clearOptimistic is true', async () => {
    const freshPositions = [makePosition('BTC')];
    mockSubmitRequestToBackground.mockResolvedValueOnce(freshPositions);

    const clearSpy = jest.spyOn(manager, 'clearAllOptimisticTPSL');

    const promise = refetchPositionsAfterWrite({ clearOptimistic: true });

    jest.advanceTimersByTime(WS_WAIT_MS);
    await promise;

    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });

  it('does not call clearAllOptimisticTPSL by default', async () => {
    const freshPositions = [makePosition('BTC')];
    mockSubmitRequestToBackground.mockResolvedValueOnce(freshPositions);

    const clearSpy = jest.spyOn(manager, 'clearAllOptimisticTPSL');

    const promise = refetchPositionsAfterWrite();

    jest.advanceTimersByTime(WS_WAIT_MS);
    await promise;

    expect(clearSpy).not.toHaveBeenCalled();
    clearSpy.mockRestore();
  });

  it('silently handles REST fallback failure', async () => {
    mockSubmitRequestToBackground.mockRejectedValueOnce(
      new Error('network error'),
    );

    const promise = refetchPositionsAfterWrite();

    jest.advanceTimersByTime(WS_WAIT_MS);

    await expect(promise).resolves.toBeUndefined();
  });

  it('ignores WS pushes that arrive after the timeout', async () => {
    mockSubmitRequestToBackground.mockResolvedValueOnce([makePosition('BTC')]);

    const promise = refetchPositionsAfterWrite();

    jest.advanceTimersByTime(WS_WAIT_MS);
    await promise;

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'perpsGetPositions',
      [{ skipCache: true }],
    );

    mockSubmitRequestToBackground.mockClear();
    manager.positions.pushData([makePosition('ETH')]);

    expect(mockSubmitRequestToBackground).not.toHaveBeenCalledWith(
      'perpsGetPositions',
      expect.anything(),
    );
  });
});
