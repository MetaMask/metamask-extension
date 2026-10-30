import { renderHook, act } from '@testing-library/react';
import type { Position } from '@metamask/perps-controller';
import { PerpsStreamManager } from '../../../providers/perps/PerpsStreamManager';
import { usePerpsLivePositions } from './usePerpsLivePositions';
import { usePerpsStreamManager } from './usePerpsStreamManager';

jest.mock('../../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../../providers/perps/CandleStreamChannel', () => ({
  CandleStreamChannel: jest.fn().mockImplementation(() => ({
    clearAll: jest.fn(),
  })),
}));

jest.mock('./usePerpsStreamManager');

const mockUsePerpsStreamManager = usePerpsStreamManager as jest.MockedFunction<
  typeof usePerpsStreamManager
>;

let uuidCounter = 0;
Object.defineProperty(globalThis, 'crypto', {
  value: {
    ...globalThis.crypto,
    randomUUID: () => `test-uuid-${(uuidCounter += 1)}`,
  },
});

const ADDRESS = '0xacc';
const position = { symbol: 'BTC', size: '0.1' } as Position;

const renderWithManager = (streamManager: PerpsStreamManager | null) => {
  mockUsePerpsStreamManager.mockReturnValue({
    streamManager,
    isInitializing: streamManager === null,
    error: null,
    selectedAddress: ADDRESS,
  });
  return renderHook(() => usePerpsLivePositions());
};

describe('usePerpsLivePositions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('reports seeded positions until a live update replaces them', () => {
    const manager = new PerpsStreamManager();
    manager.init(ADDRESS);
    manager.hydrateFromControllerCache(
      { positions: [position], address: ADDRESS },
      ADDRESS,
    );

    const { result } = renderWithManager(manager);

    expect(result.current.positions).toStrictEqual([position]);
    expect(result.current.isSeeded).toBe(true);

    act(() => {
      manager.positions.pushData([]);
    });

    expect(result.current.positions).toStrictEqual([]);
    expect(result.current.isSeeded).toBe(false);
  });

  it('is not seeded while the stream manager is unavailable', () => {
    const { result } = renderWithManager(null);

    expect(result.current.isInitialLoading).toBe(true);
    expect(result.current.isSeeded).toBe(false);
  });
});
