/* eslint-disable no-empty-function */
import React from 'react';
import {
  QuoteResponse,
  RequestStatus,
  formatChainIdToCaip,
} from '@metamask/bridge-controller';
import { zeroAddress } from 'ethereumjs-util';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../store/store';
import { createBridgeMockStore } from '../../../../test/data/bridge/mock-bridge-store';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import mockBridgeQuotesErc20Erc20 from '../../../../test/data/bridge/mock-quotes-erc20-erc20.json';
import mockBridgeQuotesNativeErc20 from '../../../../test/data/bridge/mock-quotes-native-erc20.json';
import { mockNetworkState } from '../../../../test/stub/networks';
import { toAssetId } from '../../../../shared/lib/asset-utils';
import { BridgeCTAInfoText } from '../prepare/bridge-cta-info-text';
import { useRewards } from '../../../hooks/bridge/useRewards';
import { createMockInternalAccount } from '../../../../test/jest/mocks';
import { MultichainBridgeQuoteCard } from './multichain-bridge-quote-card';

jest.mock('../../../hooks/bridge/useRewards', () => ({
  useRewards: jest.fn(),
}));

const mockUseRewards = useRewards as jest.MockedFunction<typeof useRewards>;

describe('MultichainBridgeQuoteCard', () => {
  const defaultUseRewardsReturn = {
    isLoading: false,
    estimatedPoints: null,
    shouldShowRewardsRow: false,
    hasError: false,
    rewardsAccountScope: null,
    accountOptedIn: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRewards.mockReturnValue(defaultUseRewardsReturn);
  });

  it('should render the recommended quote (no MM fee)', async () => {
    const mockStore = createBridgeMockStore({
      featureFlagOverrides: {
        bridgeConfig: {
          maxRefreshCount: 5,
          refreshRate: 30000,
          chains: {
            [CHAIN_IDS.MAINNET]: { isActiveSrc: true, isActiveDest: false },
            [CHAIN_IDS.OPTIMISM]: { isActiveSrc: true, isActiveDest: true },
            [CHAIN_IDS.POLYGON]: { isActiveSrc: true, isActiveDest: true },
          },
        },
      },
      bridgeSliceOverrides: {
        fromTokenInputValue: '1',
        toChainId: formatChainIdToCaip(CHAIN_IDS.POLYGON),
      },
      bridgeStateOverrides: {
        quoteRequest: {
          insufficientBal: false,
          srcChainId: 10,
          destChainId: 137,
          srcTokenAddress: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
          destTokenAddress: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
          srcTokenAmount: '14000000',
        },
        quotesRefreshCount: 1,
        quotes: mockBridgeQuotesErc20Erc20 as unknown as QuoteResponse[],
        quotesLastFetched: Date.now(),
        quotesLoadingStatus: RequestStatus.FETCHED,
      },
      metamaskStateOverrides: {
        marketData: {
          '0xa': {
            '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85': {
              currency: 'usd',
              price: 1,
            },
          },
          '0x89': {
            '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359': {
              currency: 'usd',
              price: 0.99,
            },
          },
        },
        currencyRates: {
          ETH: {
            conversionRate: 2524.25,
          },
          POL: {
            conversionRate: 1,
            usdConversionRate: 1,
          },
        },
        ...mockNetworkState(
          { chainId: CHAIN_IDS.OPTIMISM },
          { chainId: CHAIN_IDS.POLYGON },
        ),
      },
    });
    const { container, queryByText } = renderWithProvider(
      <>
        <MultichainBridgeQuoteCard
          onOpenSlippageModal={() => {}}
          onOpenRecipientModal={() => {}}
          selectedDestinationAccount={null}
        />
        <BridgeCTAInfoText />
      </>,
      configureStore(mockStore),
    );

    expect(queryByText(/Includes.*MM fee\./u)).not.toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  it('should render a quote with MM fee', async () => {
    const mockStore = createBridgeMockStore({
      featureFlagOverrides: {
        bridgeConfig: {
          maxRefreshCount: 5,
          refreshRate: 30000,
          chains: {
            [CHAIN_IDS.MAINNET]: { isActiveSrc: true, isActiveDest: false },
            [CHAIN_IDS.OPTIMISM]: { isActiveSrc: true, isActiveDest: true },
            [CHAIN_IDS.POLYGON]: { isActiveSrc: true, isActiveDest: true },
          },
        },
      },
      bridgeSliceOverrides: {
        fromTokenInputValue: '1',
        toChainId: formatChainIdToCaip(CHAIN_IDS.POLYGON),
      },
      bridgeStateOverrides: {
        quoteRequest: {
          insufficientBal: false,
          srcChainId: 10,
          destChainId: 137,
          srcTokenAddress: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
          destTokenAddress: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
          srcTokenAmount: '14000000',
        },
        quotesRefreshCount: 1,
        quotes: (mockBridgeQuotesErc20Erc20 as unknown as QuoteResponse[]).map(
          (quote) => ({
            ...quote,
            quote: {
              ...quote.quote,
              feeData: {
                ...quote.quote.feeData,
                metabridge: {
                  ...quote.quote.feeData.metabridge,
                  amount: '1000000000000000000',
                  quoteBpsFee: 87.5,
                },
              },
            },
          }),
        ),
        quotesLastFetched: Date.now(),
        quotesLoadingStatus: RequestStatus.FETCHED,
      },
      metamaskStateOverrides: {
        marketData: {
          '0xa': {
            '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85': {
              currency: 'usd',
              price: 1,
            },
          },
          '0x89': {
            '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359': {
              currency: 'usd',
              price: 0.99,
            },
          },
        },
        currencyRates: {
          ETH: {
            conversionRate: 2524.25,
          },
          POL: {
            conversionRate: 1,
            usdConversionRate: 1,
          },
        },
        ...mockNetworkState(
          { chainId: CHAIN_IDS.OPTIMISM },
          { chainId: CHAIN_IDS.POLYGON },
        ),
      },
    });
    const { container, getByText } = renderWithProvider(
      <>
        <MultichainBridgeQuoteCard
          onOpenSlippageModal={() => {}}
          onOpenRecipientModal={() => {}}
          selectedDestinationAccount={null}
        />
        <BridgeCTAInfoText />
      </>,
      configureStore(mockStore),
    );

    expect(
      getByText('Includes 0.875% MM fee. Approves token for bridge.'),
    ).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  it('should render the recommended quote while loading new quotes', async () => {
    const mockStore = createBridgeMockStore({
      featureFlagOverrides: {
        bridgeConfig: {
          chains: {
            [CHAIN_IDS.MAINNET]: { isActiveSrc: false, isActiveDest: false },
            [CHAIN_IDS.OPTIMISM]: { isActiveSrc: true, isActiveDest: true },
            [CHAIN_IDS.POLYGON]: { isActiveSrc: true, isActiveDest: true },
          },
        },
      },
      bridgeSliceOverrides: {
        fromTokenInputValue: '1',
        toChainId: formatChainIdToCaip(CHAIN_IDS.POLYGON),
        slippage: 1,
      },
      bridgeStateOverrides: {
        assetExchangeRates: {
          [toAssetId(
            '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
            CHAIN_IDS.POLYGON,
          ) ?? '']: {
            exchangeRate: '.99',
            usdExchangeRate: '.99',
          },
        },
        quotes: mockBridgeQuotesNativeErc20 as unknown as QuoteResponse[],
        quoteRequest: {
          insufficientBal: false,
          srcChainId: 10,
          destChainId: 137,
          srcTokenAddress: zeroAddress(),
          destTokenAddress: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
          srcTokenAmount: '14000000',
        },
        quotesLastFetched: Date.now() - 5000,
        quotesLoadingStatus: RequestStatus.LOADING,
      },
      metamaskStateOverrides: {
        marketData: {
          '0x89': {
            '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359': {
              currency: 'usd',
              price: 0.99,
            },
          },
        },
        currencyRates: {
          ETH: {
            conversionRate: 2524.25,
            usdConversionRate: 1,
          },
          POL: {
            conversionRate: 1,
            usdConversionRate: 1,
          },
        },
        ...mockNetworkState(
          { chainId: CHAIN_IDS.OPTIMISM },
          { chainId: CHAIN_IDS.POLYGON },
        ),
      },
    });
    const { container, queryByText } = renderWithProvider(
      <MultichainBridgeQuoteCard
        onOpenSlippageModal={() => {}}
        onOpenRecipientModal={() => {}}
        selectedDestinationAccount={null}
      />,
      configureStore(mockStore),
    );

    expect(container).toMatchSnapshot();
    expect(queryByText('New quotes in')).not.toBeInTheDocument();
  });

  it('should not render when there is no quote', async () => {
    const mockStore = createBridgeMockStore({
      featureFlagOverrides: {
        bridgeConfig: {
          chains: {
            [CHAIN_IDS.MAINNET]: { isActiveSrc: true, isActiveDest: false },
            [CHAIN_IDS.OPTIMISM]: { isActiveSrc: true, isActiveDest: true },
          },
        },
      },
      bridgeSliceOverrides: { fromTokenInputValue: '1' },
      bridgeStateOverrides: {
        quotes: [],
        quotesLastFetched: Date.now() - 5000,
        quotesLoadingStatus: RequestStatus.FETCHED,
      },
    });
    const { container } = renderWithProvider(
      <MultichainBridgeQuoteCard
        onOpenSlippageModal={() => {}}
        onOpenRecipientModal={() => {}}
        selectedDestinationAccount={null}
      />,
      configureStore(mockStore),
    );

    expect(container).toMatchSnapshot();
  });

  it('should not render when there is a quote fetch error', async () => {
    const mockStore = createBridgeMockStore({
      featureFlagOverrides: {
        bridgeConfig: {
          chains: {
            [CHAIN_IDS.MAINNET]: { isActiveSrc: true, isActiveDest: false },
            [CHAIN_IDS.OPTIMISM]: { isActiveSrc: true, isActiveDest: true },
          },
        },
      },
      bridgeSliceOverrides: { fromTokenInputValue: '1' },
      bridgeStateOverrides: {
        quotes: [],
        quotesLastFetched: Date.now() - 5000,
        quotesLoadingStatus: RequestStatus.ERROR,
      },
    });
    const { container } = renderWithProvider(
      <MultichainBridgeQuoteCard
        onOpenSlippageModal={() => {}}
        onOpenRecipientModal={() => {}}
        selectedDestinationAccount={null}
      />,
      configureStore(mockStore),
    );

    expect(container).toMatchSnapshot();
  });

  describe('rewards functionality', () => {
    const createMockStoreWithQuote = () =>
      createBridgeMockStore({
        featureFlagOverrides: {
          bridgeConfig: {
            maxRefreshCount: 5,
            refreshRate: 30000,
            chains: {
              [CHAIN_IDS.MAINNET]: { isActiveSrc: true, isActiveDest: false },
              [CHAIN_IDS.OPTIMISM]: { isActiveSrc: true, isActiveDest: true },
              [CHAIN_IDS.POLYGON]: { isActiveSrc: true, isActiveDest: true },
            },
          },
        },
        bridgeSliceOverrides: {
          fromTokenInputValue: '1',
          toChainId: formatChainIdToCaip(CHAIN_IDS.POLYGON),
        },
        bridgeStateOverrides: {
          quoteRequest: {
            insufficientBal: false,
            srcChainId: 10,
            destChainId: 137,
            srcTokenAddress: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
            destTokenAddress: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
            srcTokenAmount: '14000000',
          },
          quotesRefreshCount: 1,
          quotes: mockBridgeQuotesErc20Erc20 as unknown as QuoteResponse[],
          quotesLastFetched: Date.now(),
          quotesLoadingStatus: RequestStatus.FETCHED,
        },
        metamaskStateOverrides: {
          marketData: {
            '0xa': {
              '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85': {
                currency: 'usd',
                price: 1,
              },
            },
            '0x89': {
              '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359': {
                currency: 'usd',
                price: 0.99,
              },
            },
          },
          currencyRates: {
            ETH: {
              conversionRate: 2524.25,
            },
            POL: {
              conversionRate: 1,
              usdConversionRate: 1,
            },
          },
          ...mockNetworkState(
            { chainId: CHAIN_IDS.OPTIMISM },
            { chainId: CHAIN_IDS.POLYGON },
          ),
        },
      });

    it('should not render rewards row when shouldShowRewardsRow is false', () => {
      mockUseRewards.mockReturnValue({
        ...defaultUseRewardsReturn,
        shouldShowRewardsRow: false,
      });

      const mockStore = createMockStoreWithQuote();
      const { queryByTestId } = renderWithProvider(
        <MultichainBridgeQuoteCard
          onOpenSlippageModal={() => {}}
          onOpenRecipientModal={() => {}}
          selectedDestinationAccount={null}
        />,
        configureStore(mockStore),
      );

      expect(queryByTestId('rewards-row')).not.toBeInTheDocument();
    });

    it('should render loading skeleton when rewards are loading', () => {
      mockUseRewards.mockReturnValue({
        ...defaultUseRewardsReturn,
        shouldShowRewardsRow: true,
        isLoading: true,
      });

      const mockStore = createMockStoreWithQuote();
      const { getByTestId } = renderWithProvider(
        <MultichainBridgeQuoteCard
          onOpenSlippageModal={() => {}}
          onOpenRecipientModal={() => {}}
          selectedDestinationAccount={null}
        />,
        configureStore(mockStore),
      );

      expect(getByTestId('rewards-loading-skeleton')).toBeInTheDocument();
    });

    it('should render error state when rewards have error', () => {
      mockUseRewards.mockReturnValue({
        ...defaultUseRewardsReturn,
        shouldShowRewardsRow: true,
        isLoading: false,
        hasError: true,
      });

      const mockStore = createMockStoreWithQuote();
      const { getByTestId } = renderWithProvider(
        <MultichainBridgeQuoteCard
          onOpenSlippageModal={() => {}}
          onOpenRecipientModal={() => {}}
          selectedDestinationAccount={null}
        />,
        configureStore(mockStore),
      );

      expect(getByTestId('rewards-points-balance')).toBeInTheDocument();
      expect(getByTestId('rewards-error-state')).toBeInTheDocument();
    });

    it('should render AddRewardsAccount when account is not opted in', () => {
      const mockAccount = createMockInternalAccount({
        id: 'test-account-1',
        address: '0x1234567890123456789012345678901234567890',
        name: 'Test Account',
      });

      mockUseRewards.mockReturnValue({
        ...defaultUseRewardsReturn,
        shouldShowRewardsRow: true,
        isLoading: false,
        hasError: false,
        rewardsAccountScope: mockAccount,
        accountOptedIn: false,
      });

      const mockStore = createMockStoreWithQuote();
      const { getByTestId } = renderWithProvider(
        <MultichainBridgeQuoteCard
          onOpenSlippageModal={() => {}}
          onOpenRecipientModal={() => {}}
          selectedDestinationAccount={null}
        />,
        configureStore(mockStore),
      );

      expect(getByTestId('add-rewards-account-button')).toBeInTheDocument();
    });

    it('should render RewardsBadge with estimated points when rewards are loaded', () => {
      mockUseRewards.mockReturnValue({
        ...defaultUseRewardsReturn,
        shouldShowRewardsRow: true,
        isLoading: false,
        hasError: false,
        estimatedPoints: 1000,
        accountOptedIn: true,
      });

      const mockStore = createMockStoreWithQuote();
      const { getByTestId } = renderWithProvider(
        <MultichainBridgeQuoteCard
          onOpenSlippageModal={() => {}}
          onOpenRecipientModal={() => {}}
          selectedDestinationAccount={null}
        />,
        configureStore(mockStore),
      );

      const rewardsBadge = getByTestId('rewards-points-balance');
      expect(rewardsBadge).toBeInTheDocument();
      expect(rewardsBadge).toHaveTextContent('1,000');
    });

    it('should render RewardsBadge with zero points when estimatedPoints is 0', () => {
      mockUseRewards.mockReturnValue({
        ...defaultUseRewardsReturn,
        shouldShowRewardsRow: true,
        isLoading: false,
        hasError: false,
        estimatedPoints: 0,
        accountOptedIn: true,
      });

      const mockStore = createMockStoreWithQuote();
      const { getByTestId } = renderWithProvider(
        <MultichainBridgeQuoteCard
          onOpenSlippageModal={() => {}}
          onOpenRecipientModal={() => {}}
          selectedDestinationAccount={null}
        />,
        configureStore(mockStore),
      );

      const rewardsBadge = getByTestId('rewards-points-balance');
      expect(rewardsBadge).toBeInTheDocument();
      expect(rewardsBadge).toHaveTextContent('0');
    });

    it('should not render AddRewardsAccount when account is opted in', () => {
      const mockAccount = createMockInternalAccount({
        id: 'test-account-1',
        address: '0x1234567890123456789012345678901234567890',
        name: 'Test Account',
      });

      mockUseRewards.mockReturnValue({
        ...defaultUseRewardsReturn,
        shouldShowRewardsRow: true,
        isLoading: false,
        hasError: false,
        rewardsAccountScope: mockAccount,
        accountOptedIn: true,
        estimatedPoints: 500,
      });

      const mockStore = createMockStoreWithQuote();
      const { queryByTestId, getByTestId } = renderWithProvider(
        <MultichainBridgeQuoteCard
          onOpenSlippageModal={() => {}}
          onOpenRecipientModal={() => {}}
          selectedDestinationAccount={null}
        />,
        configureStore(mockStore),
      );

      expect(
        queryByTestId('add-rewards-account-button'),
      ).not.toBeInTheDocument();
      expect(getByTestId('rewards-points-balance')).toBeInTheDocument();
    });
  });

  it('should render gas sponsored text when gasSponsored is true', async () => {
    const mockStore = createBridgeMockStore({
      featureFlagOverrides: {
        bridgeConfig: {
          maxRefreshCount: 5,
          refreshRate: 30000,
          chains: {
            [CHAIN_IDS.MAINNET]: { isActiveSrc: true, isActiveDest: false },
            [CHAIN_IDS.OPTIMISM]: { isActiveSrc: true, isActiveDest: true },
            [CHAIN_IDS.POLYGON]: { isActiveSrc: true, isActiveDest: true },
          },
        },
      },
      bridgeSliceOverrides: {
        fromTokenInputValue: '1',
        toChainId: formatChainIdToCaip(CHAIN_IDS.POLYGON),
      },
      bridgeStateOverrides: {
        quoteRequest: {
          insufficientBal: false,
          srcChainId: 10,
          destChainId: 137,
          srcTokenAddress: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
          destTokenAddress: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
          srcTokenAmount: '14000000',
        },
        quotesRefreshCount: 1,
        quotes: (mockBridgeQuotesErc20Erc20 as unknown as QuoteResponse[]).map(
          (quote) => ({
            ...quote,
            quote: {
              ...quote.quote,
              gasSponsored: true,
            },
          }),
        ),
        quotesLastFetched: Date.now(),
        quotesLoadingStatus: RequestStatus.FETCHED,
      },
      metamaskStateOverrides: {
        marketData: {
          '0xa': {
            '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85': {
              currency: 'usd',
              price: 1,
            },
          },
          '0x89': {
            '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359': {
              currency: 'usd',
              price: 0.99,
            },
          },
        },
        currencyRates: {
          ETH: {
            conversionRate: 2524.25,
          },
          POL: {
            conversionRate: 1,
            usdConversionRate: 1,
          },
        },
        ...mockNetworkState(
          { chainId: CHAIN_IDS.OPTIMISM },
          { chainId: CHAIN_IDS.POLYGON },
        ),
      },
    });
    const { container, getByTestId, getByText } = renderWithProvider(
      <>
        <MultichainBridgeQuoteCard
          onOpenSlippageModal={() => {}}
          onOpenRecipientModal={() => {}}
          selectedDestinationAccount={null}
        />
        <BridgeCTAInfoText />
      </>,
      configureStore(mockStore),
    );

    // Verify the sponsored section is rendered
    const sponsoredSection = getByTestId('network-fees-sponsored');
    expect(sponsoredSection).toBeInTheDocument();

    // Verify the sponsored text appears
    expect(getByText('Paid by MetaMask')).toBeInTheDocument();

    expect(container).toMatchSnapshot();
  });
});
