import { renderHookWithProvider } from '../../../test/lib/render-helpers';
import { createBridgeMockStore } from '../../../test/data/bridge/mock-bridge-store';
import { waitFor } from '@testing-library/react';
import { Hex, CaipAssetType } from '@metamask/utils';
import * as backgroundConnection from '../../store/background-connection';
import { getUsdPricePerToken, useRewards } from './useRewards';

// Mock dependencies
jest.mock('../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn(),
  setBackgroundConnection: jest.fn(),
}));

const mockUseRewardsContext = jest.fn();

jest.mock('../../contexts/rewards', () => ({
  ...jest.requireActual('../../contexts/rewards'),
  useRewardsContext: () => mockUseRewardsContext(),
}));

const mockSubmitRequestToBackground =
  backgroundConnection.submitRequestToBackground as jest.MockedFunction<
    typeof backgroundConnection.submitRequestToBackground
  >;

const mockActiveQuote = {
  requestId:
    '0xd12f19d577efae2b92748c1abc32d8be78a5e73a99d74e16cada270a2ad99516' as Hex,
  bridgeId: '1inch',
  srcChainId: 1,
  destChainId: 1,
  aggregator: '1inch',
  aggregatorType: 'AGG',
  srcAsset: {
    address: '0x0000000000000000000000000000000000000000',
    chainId: 1,
    assetId: 'eip155:1/slip44:60' as CaipAssetType,
    symbol: 'ETH',
    decimals: 18,
    name: 'Ethereum',
    coingeckoId: 'ethereum',
    aggregators: [],
    occurrences: 100,
    iconUrl:
      'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/slip44/60.png',
    metadata: {},
  },
  srcTokenAmount: '991250000000000000',
  destAsset: {
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    chainId: 1,
    assetId:
      'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as CaipAssetType,
    symbol: 'USDC',
    decimals: 6,
    name: 'USDC',
    coingeckoId: 'usd-coin',
    aggregators: [
      'uniswapLabs',
      'metamask',
      'aave',
      'coinGecko',
      'openSwap',
      'zerion',
      'oneInch',
      'liFi',
      'xSwap',
      'socket',
      'rubic',
      'squid',
      'rango',
      'sonarwatch',
      'sushiSwap',
      'pmm',
      'bancor',
    ],
    occurrences: 17,
    iconUrl:
      'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/erc20/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png',
    metadata: {
      storage: {
        balance: 9,
        approval: 10,
      },
    },
  },
  destTokenAmount: '4437209427',
  minDestTokenAmount: '4348465238',
  walletAddress: '0xC5FE6EF47965741f6f7A4734Bf784bf3ae3f2452',
  destWalletAddress: '0xC5FE6EF47965741f6f7A4734Bf784bf3ae3f2452',
  feeData: {
    metabridge: {
      amount: '8750000000000000',
      asset: {
        address: '0x0000000000000000000000000000000000000000',
        chainId: 1,
        assetId: 'eip155:1/slip44:60' as CaipAssetType,
        symbol: 'ETH',
        decimals: 18,
        name: 'Ethereum',
        coingeckoId: 'ethereum',
        aggregators: [],
        occurrences: 100,
        iconUrl:
          'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/slip44/60.png',
        metadata: {},
      },
    },
  },
  priceData: {
    totalFeeAmountUsd: '39.39425',
  },
  bridges: ['1inch'],
  protocols: ['1inch'],
  steps: [],
  slippage: 2,
};

describe('useRewards', () => {
  const defaultSourceToken = {
    address: '0x0000000000000000000000000000000000000000' as Hex,
    chainId: 'eip155:1',
    decimals: 18,
    symbol: 'ETH',
    currencyExchangeRate: 2000,
  };

  const defaultDestToken = {
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as Hex,
    chainId: 'eip155:1',
    decimals: 6,
    symbol: 'USDC',
    currencyExchangeRate: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRewardsContext.mockReturnValue({
      rewardsEnabled: true,
      candidateSubscriptionId: null,
      candidateSubscriptionIdError: false,
      seasonStatus: null,
      seasonStatusError: null,
      seasonStatusLoading: false,
      refetchSeasonStatus: jest.fn(),
    });
  });

  describe('when user has not opted in', () => {
    it('should return default state when user has not opted in', async () => {
      mockSubmitRequestToBackground.mockImplementation((method) => {
        if (method === 'getRewardsHasAccountOptedIn') {
          return Promise.resolve(false);
        }
        return Promise.resolve(null);
      });

      const testState = createBridgeMockStore({
        bridgeSliceOverrides: {
          fromToken: defaultSourceToken,
          toToken: defaultDestToken,
        },
        metamaskStateOverrides: {
          quoteRequest: {
            srcTokenAmount: '1',
          },
        },
      });

      const { result } = renderHookWithProvider(
        () =>
          useRewards({
            activeQuote: mockActiveQuote,
          }),
        testState,
      );

      // Wait for the hook to execute and the opt-in check to complete
      await waitFor(
        () => {
          expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
            'getRewardsHasAccountOptedIn',
            ['eip155:1:0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'],
          );
        },
        { timeout: 3000 },
      );

      await waitFor(() => {
        expect(result.current).toEqual({
          shouldShowRewardsRow: false,
          isLoading: false,
          estimatedPoints: null,
          hasError: false,
        });
      });
    });
  });

  describe('when rewards estimation is successful', () => {
    it('should return estimated points when all conditions are met', async () => {
      mockSubmitRequestToBackground.mockImplementation((method) => {
        if (method === 'getRewardsHasAccountOptedIn') {
          return Promise.resolve(true);
        }
        if (method === 'estimateRewardsPoints') {
          return Promise.resolve({ pointsEstimate: 100 });
        }
        return Promise.resolve(null);
      });

      const testState = createBridgeMockStore({
        bridgeSliceOverrides: {
          fromToken: defaultSourceToken,
          toToken: defaultDestToken,
        },
        metamaskStateOverrides: {
          quoteRequest: {
            srcTokenAmount: '1',
          },
        },
      });

      const { result } = renderHookWithProvider(
        () =>
          useRewards({
            activeQuote: mockActiveQuote,
          }),
        testState,
      );

      // Wait for both async calls to complete
      await waitFor(
        () => {
          expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
            'getRewardsHasAccountOptedIn',
            expect.any(Array),
          );
        },
        { timeout: 3000 },
      );

      await waitFor(
        () => {
          expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
            'estimateRewardsPoints',
            expect.any(Array),
          );
        },
        { timeout: 3000 },
      );

      await waitFor(() => {
        expect(result.current).toEqual({
          shouldShowRewardsRow: true,
          isLoading: false,
          estimatedPoints: 100,
          hasError: false,
        });
      });

      // Verify the correct estimate request was made
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'estimateRewardsPoints',
        [
          {
            activityType: 'SWAP',
            account: 'eip155:1:0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
            activityContext: {
              swapContext: {
                srcAsset: {
                  id: 'eip155:1/slip44:60',
                  amount: '991250000000000000',
                },
                destAsset: {
                  id: 'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                  amount: '4437209427',
                },
                feeAsset: {
                  id: 'eip155:1/slip44:60',
                  amount: '8750000000000000',
                  usdPrice: '4502.2',
                },
              },
            },
          },
        ],
      );
    });

    it('should handle source token without exchange rate', async () => {
      mockSubmitRequestToBackground.mockImplementation((method) => {
        if (method === 'getRewardsHasAccountOptedIn') {
          return Promise.resolve(true);
        }
        if (method === 'estimateRewardsPoints') {
          return Promise.resolve({ pointsEstimate: 50 });
        }
        return Promise.resolve(null);
      });

      const sourceTokenWithoutRate = {
        ...defaultSourceToken,
        currencyExchangeRate: undefined,
      };

      const quoteWithoutPriceData = {
        ...mockActiveQuote,
        priceData: undefined,
      };

      const testState = createBridgeMockStore({
        bridgeSliceOverrides: {
          fromToken: sourceTokenWithoutRate,
          toToken: defaultDestToken,
        },
        metamaskStateOverrides: {
          quoteRequest: {
            srcTokenAmount: '1',
          },
        },
      });

      const { result } = renderHookWithProvider(
        () =>
          useRewards({
            activeQuote: quoteWithoutPriceData,
          }),
        testState,
      );

      // Wait for both async calls to complete
      await waitFor(
        () => {
          expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
            'getRewardsHasAccountOptedIn',
            expect.any(Array),
          );
        },
        { timeout: 3000 },
      );

      await waitFor(
        () => {
          expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
            'estimateRewardsPoints',
            expect.any(Array),
          );
        },
        { timeout: 3000 },
      );

      await waitFor(() => {
        expect(result.current.estimatedPoints).toBe(50);
      });

      // Check that fee asset was created without USD price
      const callArgs = mockSubmitRequestToBackground.mock.calls.find(
        (call) => call[0] === 'estimateRewardsPoints',
      );
      expect(
        callArgs?.[1]?.[0]?.activityContext?.swapContext?.feeAsset?.usdPrice,
      ).toBeUndefined();
    });
  });

  describe('when required data is missing', () => {
    it('should return null when activeQuote is missing', () => {
      const testState = createBridgeMockStore({
        bridgeSliceOverrides: {
          fromToken: defaultSourceToken,
          toToken: defaultDestToken,
        },
        metamaskStateOverrides: {
          quoteRequest: {
            srcTokenAmount: '1',
          },
        },
      });

      const { result } = renderHookWithProvider(
        () =>
          useRewards({
            activeQuote: null,
          }),
        testState,
      );

      expect(result.current).toEqual({
        shouldShowRewardsRow: false,
        isLoading: false,
        estimatedPoints: null,
        hasError: false,
      });

      // Should not call background methods
      expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();
    });

    it('should return null when fromToken is missing', () => {
      const testState = createBridgeMockStore({
        bridgeSliceOverrides: {
          fromToken: null,
          toToken: defaultDestToken,
        },
        metamaskStateOverrides: {
          quoteRequest: {
            srcTokenAmount: '1',
          },
        },
      });

      const { result } = renderHookWithProvider(
        () =>
          useRewards({
            activeQuote: mockActiveQuote,
          }),
        testState,
      );

      expect(result.current).toEqual({
        shouldShowRewardsRow: false,
        isLoading: false,
        estimatedPoints: null,
        hasError: false,
      });
    });

    it('should return null when toToken is missing', () => {
      const testState = createBridgeMockStore({
        bridgeSliceOverrides: {
          fromToken: defaultSourceToken,
          toToken: null,
        },
        metamaskStateOverrides: {
          quoteRequest: {
            srcTokenAmount: '1',
          },
        },
      });

      const { result } = renderHookWithProvider(
        () =>
          useRewards({
            activeQuote: mockActiveQuote,
          }),
        testState,
      );

      expect(result.current).toEqual({
        shouldShowRewardsRow: false,
        isLoading: false,
        estimatedPoints: null,
        hasError: false,
      });
    });

    it('should return null when srcTokenAmount is missing', () => {
      const testState = createBridgeMockStore({
        bridgeSliceOverrides: {
          fromToken: defaultSourceToken,
          toToken: defaultDestToken,
        },
        metamaskStateOverrides: {
          quoteRequest: {
            srcTokenAmount: undefined,
          },
        },
      });

      const { result } = renderHookWithProvider(
        () =>
          useRewards({
            activeQuote: mockActiveQuote,
          }),
        testState,
      );

      expect(result.current).toEqual({
        shouldShowRewardsRow: false,
        isLoading: false,
        estimatedPoints: null,
        hasError: false,
      });
    });
  });

  describe('error handling', () => {
    it('should handle rewards estimation error gracefully', async () => {
      mockSubmitRequestToBackground.mockImplementation((method) => {
        if (method === 'getRewardsHasAccountOptedIn') {
          return Promise.resolve(true);
        }
        if (method === 'estimateRewardsPoints') {
          throw new Error('Network error');
        }
        return Promise.resolve(null);
      });

      const testState = createBridgeMockStore({
        bridgeSliceOverrides: {
          fromToken: defaultSourceToken,
          toToken: defaultDestToken,
        },
        metamaskStateOverrides: {
          quoteRequest: {
            srcTokenAmount: '1',
          },
        },
      });

      const { result } = renderHookWithProvider(
        () =>
          useRewards({
            activeQuote: mockActiveQuote,
          }),
        testState,
      );

      // Wait for the opt-in check to complete
      await waitFor(
        () => {
          expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
            'getRewardsHasAccountOptedIn',
            expect.any(Array),
          );
        },
        { timeout: 3000 },
      );

      // Wait for the estimation to fail
      await waitFor(
        () => {
          expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
            'estimateRewardsPoints',
            expect.any(Array),
          );
        },
        { timeout: 3000 },
      );

      await waitFor(() => {
        expect(result.current).toEqual({
          shouldShowRewardsRow: true,
          isLoading: false,
          estimatedPoints: null,
          hasError: true,
        });
      });
    });

    it('should set hasError to true when getRewardsHasAccountOptedIn throws an error', async () => {
      mockSubmitRequestToBackground.mockImplementation((method) => {
        if (method === 'getRewardsHasAccountOptedIn') {
          throw new Error('Opt-in check failed');
        }
        return Promise.resolve(null);
      });

      const testState = createBridgeMockStore({
        bridgeSliceOverrides: {
          fromToken: defaultSourceToken,
          toToken: defaultDestToken,
        },
        metamaskStateOverrides: {
          quoteRequest: {
            srcTokenAmount: '1',
          },
        },
      });

      const { result } = renderHookWithProvider(
        () =>
          useRewards({
            activeQuote: mockActiveQuote,
          }),
        testState,
      );

      // Wait for the error to occur
      await waitFor(
        () => {
          expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
            'getRewardsHasAccountOptedIn',
            expect.any(Array),
          );
        },
        { timeout: 3000 },
      );

      await waitFor(() => {
        expect(result.current).toEqual({
          shouldShowRewardsRow: true,
          isLoading: false,
          estimatedPoints: null,
          hasError: true,
        });
      });
    });

    it('should reset hasError to false when estimation succeeds after previous error', async () => {
      let currentQuote = mockActiveQuote;

      // First mock returns error
      mockSubmitRequestToBackground.mockImplementationOnce((method) => {
        if (method === 'getRewardsHasAccountOptedIn') {
          return Promise.resolve(true);
        }
        if (method === 'estimateRewardsPoints') {
          throw new Error('Network error');
        }
        return Promise.resolve(null);
      });

      const testState = createBridgeMockStore({
        bridgeSliceOverrides: {
          fromToken: defaultSourceToken,
          toToken: defaultDestToken,
        },
        metamaskStateOverrides: {
          quoteRequest: {
            srcTokenAmount: '1',
          },
        },
      });

      const { result, rerender } = renderHookWithProvider(
        () =>
          useRewards({
            activeQuote: currentQuote,
          }),
        testState,
      );

      // Wait for first error - wait for the estimation call to fail
      await waitFor(
        () => {
          expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
            'estimateRewardsPoints',
            expect.any(Array),
          );
        },
        { timeout: 3000 },
      );

      await waitFor(() => {
        expect(result.current.hasError).toBe(true);
      });

      // Now mock successful response
      mockSubmitRequestToBackground.mockImplementation((method) => {
        if (method === 'getRewardsHasAccountOptedIn') {
          return Promise.resolve(true);
        }
        if (method === 'estimateRewardsPoints') {
          return Promise.resolve({ pointsEstimate: 100 });
        }
        return Promise.resolve(null);
      });

      // Create a new quote with different requestId to trigger re-estimation
      currentQuote = {
        ...mockActiveQuote,
        requestId: '0xnewrequestid' as Hex,
      };

      // Trigger re-render with new quote
      rerender();

      // Wait for successful retry
      await waitFor(() => {
        expect(result.current).toEqual({
          shouldShowRewardsRow: true,
          isLoading: false,
          estimatedPoints: 100,
          hasError: false,
        });
      });
    });
  });
});

describe('getUsdPricePerToken', () => {
  it('should calculate the USD price per token', () => {
    expect(getUsdPricePerToken('39.39425', '8750000000000000', 18)).toBe(
      '4502.2',
    );
  });

  it('should return undefined when the total fee amount is 0', () => {
    expect(getUsdPricePerToken('0', '8750000000000000', 18)).toBeUndefined();
  });

  it('should return undefined when the fee amount is 0', () => {
    expect(getUsdPricePerToken('39.39425', '0', 18)).toBeUndefined();
  });

  it('should return undefined when the total fee amount is 0 and the fee amount is 0', () => {
    expect(getUsdPricePerToken('0', '0', 18)).toBeUndefined();
  });
});
