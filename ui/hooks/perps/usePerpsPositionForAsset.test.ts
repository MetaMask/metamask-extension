import { renderHook } from '@testing-library/react';
import type { Position } from '@metamask/perps-controller';
import { usePerpsLivePositions } from './stream';
import { usePerpsPositionForAsset } from './usePerpsPositionForAsset';

jest.mock('./stream', () => ({
  usePerpsLivePositions: jest.fn(),
}));

const mockUsePerpsLivePositions = jest.mocked(usePerpsLivePositions);

const ETH_POSITION = { symbol: 'ETH' } as Position;
const BTC_POSITION = { symbol: 'BTC' } as Position;

function mockPositions(positions: Position[], isInitialLoading = false) {
  mockUsePerpsLivePositions.mockReturnValue({ positions, isInitialLoading });
}

describe('usePerpsPositionForAsset', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns the open position matching the market symbol', () => {
    mockPositions([BTC_POSITION, ETH_POSITION]);

    const { result } = renderHook(() => usePerpsPositionForAsset('ETH'));

    expect(result.current.position).toBe(ETH_POSITION);
    expect(result.current.isLoading).toBe(false);
  });

  it('matches the market symbol case-insensitively', () => {
    mockPositions([{ symbol: 'eth' } as Position]);

    const { result } = renderHook(() => usePerpsPositionForAsset('ETH'));

    expect(result.current.position).toStrictEqual({ symbol: 'eth' });
  });

  it('returns no position when the market has none open', () => {
    mockPositions([BTC_POSITION]);

    const { result } = renderHook(() => usePerpsPositionForAsset('ETH'));

    expect(result.current.position).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });

  it('reports loading while the positions stream has no data yet', () => {
    mockPositions([], true);

    const { result } = renderHook(() => usePerpsPositionForAsset('ETH'));

    expect(result.current.position).toBeUndefined();
    expect(result.current.isLoading).toBe(true);
  });

  it('does not report loading when no market symbol is provided', () => {
    mockPositions([], true);

    const { result } = renderHook(() => usePerpsPositionForAsset(''));

    expect(result.current.position).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });
});
