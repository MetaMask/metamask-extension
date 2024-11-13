import React from 'react';
import { Provider } from 'react-redux';
import configureStore from '../../../store/store';
import { BridgeQuotesModal } from './bridge-quotes-modal';
import { createBridgeMockStore } from '../../../../test/jest/mock-store';
import mockBridgeQuotesErc20Erc20 from '../../../../test/data/bridge/mock-quotes-erc20-erc20.json';
import { SortOrder } from '../types';

const storybook = {
  title: 'Pages/Bridge/BridgeQuotesModal',
  component: BridgeQuotesModal,
};

export const NoTokenPricesAvailableStory = () => {
  return <BridgeQuotesModal onClose={() => {}} isOpen={true} />;
};
NoTokenPricesAvailableStory.storyName = 'Token Prices Not Available';
NoTokenPricesAvailableStory.decorators = [
  (story) => (
    <Provider
      store={configureStore(
        createBridgeMockStore({
          bridgeStateOverrides: { quotes: mockBridgeQuotesErc20Erc20 },
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
            toNativeExchangeRate: 1,
            toTokenExchangeRate: 0.99,
            sortOrder: SortOrder.COST_ASC,
          },
          bridgeStateOverrides: { quotes: mockBridgeQuotesErc20Erc20 },
          metamaskStateOverrides: {
            currencyRates: {
              ETH: { conversionRate: 2514.5 }, //1
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
            toNativeExchangeRate: 1,
            toTokenExchangeRate: 2.1,
          },
          bridgeStateOverrides: { quotes: mockBridgeQuotesErc20Erc20 },
          metamaskStateOverrides: {
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
      {story()}
    </Provider>
  ),
];

export default storybook;
