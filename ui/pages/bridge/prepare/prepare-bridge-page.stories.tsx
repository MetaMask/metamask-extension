import React from 'react';
import { Provider } from 'react-redux';
import configureStore from '../../../store/store';
import { createBridgeMockStore } from '../../../../test/jest/mock-store';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { RequestStatus } from '../../../../app/scripts/controllers/bridge/constants';
import CrossChainSwap from '../index';
import { MemoryRouter } from 'react-router-dom';
import {
  CROSS_CHAIN_SWAP_ROUTE,
  PREPARE_SWAP_ROUTE,
} from '../../../helpers/constants/routes';
import mockBridgeQuotesErc20Erc20 from '../../../../test/data/bridge/mock-quotes-erc20-erc20.json';

const storybook = {
  title: 'Pages/Bridge/CrossChainSwapPage',
  component: CrossChainSwap,
};

const Wrapper = ({ children }) => (
  <div style={{ height: '600px' }}>
    <MemoryRouter
      initialEntries={[CROSS_CHAIN_SWAP_ROUTE + PREPARE_SWAP_ROUTE]}
    >
      {children}
    </MemoryRouter>
  </div>
);

const mockFeatureFlags = {
  srcNetworkAllowlist: [CHAIN_IDS.MAINNET, CHAIN_IDS.LINEA_MAINNET],
  destNetworkAllowlist: [CHAIN_IDS.MAINNET, CHAIN_IDS.LINEA_MAINNET],
  extensionSupport: true,
  extensionConfig: {
    refreshRate: 30000,
    maxRefreshCount: 5,
  },
};
const mockBridgeSlice = {
  toChainId: CHAIN_IDS.LINEA_MAINNET,
  toNativeExchangeRate: 1,
  toTokenExchangeRate: 0.99,
  fromTokenInputValue: '1',
};
export const DefaultStory = () => {
  return <CrossChainSwap />;
};
DefaultStory.storyName = 'Default';
DefaultStory.decorators = [
  (Story) => (
    <Provider
      store={configureStore(
        createBridgeMockStore({
          featureFlagOverrides: mockFeatureFlags,
          bridgeSliceOverrides: mockBridgeSlice,
          bridgeStateOverrides: {
            quotes: [],
            destTokens: {
              '0x1234': { symbol: 'USDC', address: '0x1234', decimals: 6 },
            },
            srcTokens: {
              '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85': {
                symbol: 'USDC',
                address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
                decimals: 6,
              },
            },
            quotesLastFetchedMs: Date.now(),
          },
          metamaskStateOverrides: {
            useExternalServices: true,
            currencyRates: {
              ETH: { conversionRate: 2514.5 },
            },
            marketData: {
              '0x1': {
                ['0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85']: {
                  price: 0.00039762010419237126,
                  contractPercentChange1d: 0.004,
                  priceChange1d: 0.00004,
                },
              },
            },
          },
        }),
      )}
    >
      <Wrapper>
        <Story />
      </Wrapper>
    </Provider>
  ),
];

export const LoadingStory = () => {
  return <CrossChainSwap />;
};
LoadingStory.storyName = 'Loading Quotes';
LoadingStory.decorators = [
  (Story) => (
    <Wrapper>
      <Provider
        store={configureStore(
          createBridgeMockStore({
            featureFlagOverrides: mockFeatureFlags,
            bridgeSliceOverrides: mockBridgeSlice,
            bridgeStateOverrides: {
              quotes: [],
              quotesLastFetched: 134,
              quotesLoadingStatus: RequestStatus.LOADING,
              destTokens: {
                '0x1234': { symbol: 'USDC', address: '0x1234', decimals: 6 },
              },
              srcTokens: {
                '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85': {
                  symbol: 'USDC',
                  address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
                  decimals: 6,
                },
              },
            },
            metamaskStateOverrides: {
              useExternalServices: true,
              currencyRates: {
                ETH: { conversionRate: 2514.5 },
              },
              marketData: {
                '0x1': {
                  ['0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85']: {
                    price: 0.00039762010419237126,
                    contractPercentChange1d: 0.004,
                    priceChange1d: 0.00004,
                  },
                },
              },
            },
          }),
        )}
      >
        <Story />
      </Provider>
    </Wrapper>
  ),
];

export const NoQuotesStory = () => {
  return <CrossChainSwap />;
};
NoQuotesStory.storyName = 'No Quotes';
NoQuotesStory.decorators = [
  (Story) => (
    <Wrapper>
      <Provider
        store={configureStore(
          createBridgeMockStore({
            featureFlagOverrides: mockFeatureFlags,
            bridgeSliceOverrides: mockBridgeSlice,
            bridgeStateOverrides: {
              quotes: [],
              quotesLastFetched: 134,
              quotesLoadingStatus: RequestStatus.FETCHED,
              destTokens: {
                '0x1234': { symbol: 'USDC', address: '0x1234', decimals: 6 },
              },
              srcTokens: {
                '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85': {
                  symbol: 'USDC',
                  address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
                  decimals: 6,
                },
              },
            },
            metamaskStateOverrides: {
              useExternalServices: true,
              currencyRates: {
                ETH: { conversionRate: 2514.5 },
              },
              marketData: {
                '0x1': {
                  ['0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85']: {
                    price: 0.00039762010419237126,
                    contractPercentChange1d: 0.004,
                    priceChange1d: 0.00004,
                  },
                },
              },
            },
          }),
        )}
      >
        <Story />
      </Provider>
    </Wrapper>
  ),
];

export const QuotesFetchedStory = () => {
  return <CrossChainSwap />;
};
QuotesFetchedStory.storyName = 'Quotes Available';
QuotesFetchedStory.decorators = [
  (Story) => (
    <Wrapper>
      <Provider
        store={configureStore(
          createBridgeMockStore({
            featureFlagOverrides: mockFeatureFlags,
            bridgeSliceOverrides: mockBridgeSlice,
            bridgeStateOverrides: {
              quotes: mockBridgeQuotesErc20Erc20,
              quotesLastFetched: Date.now(),
              quotesLoadingStatus: RequestStatus.FETCHED,
              destTokens: {
                '0x1234': { symbol: 'USDC', address: '0x1234', decimals: 6 },
              },
              srcTokens: {
                '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85': {
                  symbol: 'USDC',
                  address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
                  decimals: 6,
                },
              },
            },
            metamaskStateOverrides: {
              useExternalServices: true,
              currencyRates: {
                ETH: { conversionRate: 2514.5 },
              },
              marketData: {
                '0x1': {
                  ['0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85']: {
                    price: 0.00039762010419237126,
                    contractPercentChange1d: 0.004,
                    priceChange1d: 0.00004,
                  },
                },
              },
            },
          }),
        )}
      >
        <Story />
      </Provider>
    </Wrapper>
  ),
];

export default storybook;
