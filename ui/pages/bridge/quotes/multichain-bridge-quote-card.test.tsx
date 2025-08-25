import React from 'react';
import {
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
import { MultichainBridgeQuoteCard } from './multichain-bridge-quote-card';

describe('MultichainBridgeQuoteCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the recommended quote (no MM fee)', async () => {
    const mockStore = createBridgeMockStore({
      featureFlagOverrides: {
        extensionConfig: {
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
        fromTokenInputValue: 1,
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
        quotes: mockBridgeQuotesErc20Erc20,
        getQuotesLastFetched: Date.now(),
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
    const { container } = renderWithProvider(
      <MultichainBridgeQuoteCard />,
      configureStore(mockStore),
    );

    expect(container).toMatchSnapshot();
  });

  it('should render a quote with MM fee', async () => {
    const mockStore = createBridgeMockStore({
      featureFlagOverrides: {
        extensionConfig: {
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
        fromTokenInputValue: 1,
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
        quotes: mockBridgeQuotesErc20Erc20.map((quote) => ({
          ...quote,
          quote: {
            ...quote.quote,
            feeData: {
              ...quote.quote.feeData,
              metabridge: {
                ...quote.quote.feeData.metabridge,
                amount: '1000000000000000000',
              },
            },
          },
        })),
        getQuotesLastFetched: Date.now(),
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
    const { container } = renderWithProvider(
      <MultichainBridgeQuoteCard />,
      configureStore(mockStore),
    );

    expect(container).toMatchSnapshot();
  });

  it('should render the recommended quote while loading new quotes', async () => {
    const mockStore = createBridgeMockStore({
      featureFlagOverrides: {
        extensionConfig: {
          chains: {
            [CHAIN_IDS.MAINNET]: { isActiveSrc: false, isActiveDest: false },
            [CHAIN_IDS.OPTIMISM]: { isActiveSrc: true, isActiveDest: true },
            [CHAIN_IDS.POLYGON]: { isActiveSrc: true, isActiveDest: true },
          },
        },
      },
      bridgeSliceOverrides: {
        fromTokenInputValue: 1,
        toChainId: formatChainIdToCaip(CHAIN_IDS.POLYGON),
      },
      bridgeStateOverrides: {
        quotes: mockBridgeQuotesNativeErc20,
        quoteRequest: {
          insufficientBal: false,
          srcChainId: 10,
          destChainId: 137,
          srcTokenAddress: zeroAddress(),
          destTokenAddress: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
          srcTokenAmount: '14000000',
        },
        getQuotesLastFetched: Date.now() - 5000,
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
      <MultichainBridgeQuoteCard />,
      configureStore(mockStore),
    );

    expect(container).toMatchSnapshot();
    expect(queryByText('New quotes in')).not.toBeInTheDocument();
  });

  it('should not render when there is no quote', async () => {
    const mockStore = createBridgeMockStore({
      featureFlagOverrides: {
        extensionConfig: {
          chains: {
            [CHAIN_IDS.MAINNET]: { isActiveSrc: true, isActiveDest: false },
            [CHAIN_IDS.OPTIMISM]: { isActiveSrc: true, isActiveDest: true },
          },
        },
      },
      bridgeSliceOverrides: { fromTokenInputValue: 1 },
      bridgeStateOverrides: {
        quotes: [],
        getQuotesLastFetched: Date.now() - 5000,
        quotesLoadingStatus: RequestStatus.FETCHED,
      },
    });
    const { container } = renderWithProvider(
      <MultichainBridgeQuoteCard />,
      configureStore(mockStore),
    );

    expect(container).toMatchSnapshot();
  });

  it('should not render when there is a quote fetch error', async () => {
    const mockStore = createBridgeMockStore({
      featureFlagOverrides: {
        extensionConfig: {
          chains: {
            [CHAIN_IDS.MAINNET]: { isActiveSrc: true, isActiveDest: false },
            [CHAIN_IDS.OPTIMISM]: { isActiveSrc: true, isActiveDest: true },
          },
        },
      },
      bridgeSliceOverrides: { fromTokenInputValue: 1 },
      bridgeStateOverrides: {
        quotes: [],
        getQuotesLastFetched: Date.now() - 5000,
        quotesLoadingStatus: RequestStatus.ERROR,
      },
    });
    const { container } = renderWithProvider(
      <MultichainBridgeQuoteCard />,
      configureStore(mockStore),
    );

    expect(container).toMatchSnapshot();
  });
});
