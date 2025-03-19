import React from 'react';
import { Provider } from 'react-redux';
import configureStore from '../../../store/store';
import { createBridgeMockStore } from '../../../../test/jest/mock-store';
import { BridgeTransactionSettingsModal } from './bridge-transaction-settings-modal';

const storybook = {
  title: 'Pages/Bridge/TransactionSettingsModal',
  component: BridgeTransactionSettingsModal,
};

export const DefaultStory = () => {
  return <BridgeTransactionSettingsModal isOpen={true} onClose={() => {}} />;
};

DefaultStory.storyName = 'Default';
DefaultStory.decorators = [
  (Story) => (
    <Provider
      store={configureStore(
        createBridgeMockStore(
          {},
          {
            toNativeExchangeRate: 1,
            toTokenExchangeRate: 0.99,
            slippage: 0.5,
          },
          { quotes: [] },
          {
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
        ),
      )}
    >
      <Story />
    </Provider>
  ),
];

export default storybook;
