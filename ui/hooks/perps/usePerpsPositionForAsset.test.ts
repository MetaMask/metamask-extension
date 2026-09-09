import { renderHook } from '@testing-library/react';
import type { Position } from '@metamask/perps-controller';
import { usePerpsLivePositions, usePerpsStreamManager } from './stream';
import { usePerpsPositionForAsset } from './usePerpsPositionForAsset';

jest.mock('./stream', () => ({
  usePerpsLivePositions: jest.fn(),
  usePerpsStreamManager: jest.fn(),
}));

const mockUsePerpsLivePositions = jest.mocked(usePerpsLivePositions);
const mockUsePerpsStreamManager = jest.mocked(usePerpsStreamManager);

const ETH_POSITION = { symbol: 'ETH' } as Position;
const BTC_POSITION = { symbol: 'BTC' } as Position;

function mockPositions(positions: Position[], isInitialLoading = false) {
  mockUsePerpsLivePositions.mockReturnValue({ positions, isInitialLoading });
}

function mockStreamError(error: Error | null) {
  mockUsePerpsStreamManager.mockReturnValue({
    streamManager: null,
    isInitializing: false,
    error,
    selectedAddress: '0x1',
  });
}

describe('usePerpsPositionForAsset', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStreamError(null);
  });

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

  it('matches a HIP-3 position when only the wallet ticker is known', () => {
    const tslaPosition = { symbol: 'xyz:TSLA' } as Position;
    mockPositions([BTC_POSITION, tslaPosition]);

    const { result } = renderHook(() => usePerpsPositionForAsset('TSLA'));

    expect(result.current.position).toBe(tslaPosition);
  });

  it('matches a plain position when the market symbol carries a DEX prefix', () => {
    const tslaPosition = { symbol: 'TSLA' } as Position;
    mockPositions([tslaPosition]);

    const { result } = renderHook(() => usePerpsPositionForAsset('xyz:TSLA'));

    expect(result.current.position).toBe(tslaPosition);
  });

  it('prefers an exact symbol match over a prefixed one', () => {
    const prefixedPosition = { symbol: 'xyz:TSLA' } as Position;
    const plainPosition = { symbol: 'TSLA' } as Position;
    mockPositions([prefixedPosition, plainPosition]);

    const { result } = renderHook(() => usePerpsPositionForAsset('TSLA'));

    expect(result.current.position).toBe(plainPosition);
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

  it('stops reporting loading when stream init has already failed', () => {
    mockPositions([], true);
    mockStreamError(new Error('rpc failed'));

    const { result } = renderHook(() => usePerpsPositionForAsset('ETH'));

    expect(result.current.position).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });
});
