import React from 'react';
import { Provider } from 'react-redux';
import { QuoteResponse, SortOrder } from '@metamask/bridge-controller';
import configureStore from '../../../store/store';
import mockBridgeQuotesErc20Erc20 from '../../../../test/data/bridge/mock-quotes-erc20-erc20.json';
import { createBridgeMockStore } from '../../../../test/data/bridge/mock-bridge-store';
import { BridgeQuotesModal } from './bridge-quotes-modal';

const storybook = {
  title: 'Pages/Bridge/BridgeQuotesModal',
  component: BridgeQuotesModal,
};

const mockQuotes = (
  mockBridgeQuotesErc20Erc20 as unknown as QuoteResponse[]
).map((quote) => ({
  ...quote,
  quote: {
    ...quote.quote,
    bridges: ['across (via Socket)'],
    destAsset: {
      ...quote.quote.destAsset,
      decimals: 7,
      symbol: 'USDC.E',
    },
    destTokenAmount: '1',
  },
}));

export const NoTokenPricesAvailableStory = () => {
  return <BridgeQuotesModal onClose={() => {}} isOpen={true} />;
};
NoTokenPricesAvailableStory.storyName = 'Token Prices Not Available';
NoTokenPricesAvailableStory.decorators = [
  (story) => (
    <Provider
      store={configureStore(
        createBridgeMockStore({
          bridgeStateOverrides: {
            quotes: mockQuotes,
          },
        }),
      )}
    >
      {story()}
    </Provider>
  ),
];

export const DefaultStory = () => {
  return <BridgeQuotesModal onClose={() => {}} isOpen={true} />;
};
DefaultStory.storyName = 'Default';
DefaultStory.decorators = [
  (story) => (
    <Provider
      store={configureStore(
        createBridgeMockStore({
          bridgeSliceOverrides: {
            fromTokenExchangeRate: 0.99,
            sortOrder: SortOrder.COST_ASC,
          },
          bridgeStateOverrides: {
            quotes: mockQuotes,
          },
          metamaskStateOverrides: {
            currencyRates: {
              ETH: { conversionRate: 2514.5 }, // 1
            },
            marketData: {
              '0x1': {
                '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85': {
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
      {story()}
    </Provider>
  ),
];

export const PositiveArbitrage = () => {
  return <BridgeQuotesModal onClose={() => {}} isOpen={true} />;
};
PositiveArbitrage.decorators = [
  (story) => (
    <Provider
      store={configureStore(
        createBridgeMockStore({
          bridgeSliceOverrides: {
            fromTokenExchangeRate: 0.99,
          },
          bridgeStateOverrides: {
            quotes: mockQuotes,
          },
          metamaskStateOverrides: {
            currencyRates: {
              ETH: { conversionRate: 2514.5 },
            },
            marketData: {
              '0x1': {
                '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85': {
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
      {story()}
    </Provider>
  ),
];

export default storybook;
