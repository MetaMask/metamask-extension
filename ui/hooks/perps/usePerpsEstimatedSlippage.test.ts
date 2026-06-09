import type { OrderBookData } from '@metamask/perps-controller';
import { renderHook } from '@testing-library/react-hooks';
import { calculateEstimatedSlippageBps } from '../../components/app/perps/utils/slippageCalculation';
import { usePerpsEstimatedSlippage } from './usePerpsEstimatedSlippage';
import { usePerpsLiveOrderBook } from './stream/usePerpsLiveOrderBook';

jest.mock('./stream/usePerpsLiveOrderBook');
jest.mock('../../components/app/perps/utils/slippageCalculation');

const mockUsePerpsLiveOrderBook = jest.mocked(usePerpsLiveOrderBook);
const mockCalculateEstimatedSlippageBps = jest.mocked(
  calculateEstimatedSlippageBps,
);

const sampleBook = {
  midPrice: '100',
} as OrderBookData;

describe('usePerpsEstimatedSlippage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCalculateEstimatedSlippageBps.mockImplementation(({ orderBook }) =>
      orderBook ? 42 : null,
    );
    mockUsePerpsLiveOrderBook.mockReturnValue({
      orderBook: sampleBook,
      isInitialLoading: false,
    });
  });

  it('subscribes to the shared order book without managing the stream', () => {
    renderHook(() =>
      usePerpsEstimatedSlippage({
        symbol: 'BTC',
        sizeUsd: 100,
        isBuy: true,
      }),
    );

    expect(mockUsePerpsLiveOrderBook).toHaveBeenCalledWith(
      expect.objectContaining({
        symbol: 'BTC',
        manageStream: false,
      }),
    );
  });

  it('returns null when estimation is disabled', () => {
    const { result } = renderHook(() =>
      usePerpsEstimatedSlippage({
        symbol: 'BTC',
        sizeUsd: 100,
        isBuy: true,
        enabled: false,
      }),
    );

    expect(result.current.estimatedSlippageBps).toBeNull();
    expect(mockCalculateEstimatedSlippageBps).not.toHaveBeenCalled();
  });

  it('clears readiness immediately when the symbol changes', () => {
    const { result, rerender } = renderHook(
      ({ symbol }: { symbol: string }) =>
        usePerpsEstimatedSlippage({
          symbol,
          sizeUsd: 100,
          isBuy: true,
        }),
      { initialProps: { symbol: 'BTC' } },
    );

    expect(result.current.isReady).toBe(true);

    mockUsePerpsLiveOrderBook.mockReturnValue({
      orderBook: null,
      isInitialLoading: true,
    });
    rerender({ symbol: 'ETH' });

    expect(result.current.isReady).toBe(false);
    expect(result.current.estimatedSlippageBps).toBeNull();
  });
});
