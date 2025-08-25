import React from 'react';
import { Provider } from 'react-redux';
import configureStore from '../../../store/store';
import { MultichainBridgeQuoteCard } from './multichain-bridge-quote-card';
import { createBridgeMockStore } from '../../../../test/data/bridge/mock-bridge-store';
import mockBridgeQuotesErc20Erc20 from '../../../../test/data/bridge/mock-quotes-erc20-erc20.json';

const storybook = {
  title: 'Pages/Bridge/Quotes/MultichainBridgeQuoteCard',
  component: MultichainBridgeQuoteCard,
};

const Container = ({ children }: { children: React.ReactNode }) => (
  <div style={{ width: '312px', padding: '16px' }}>{children}</div>
);

export const DefaultStory = () => {
  return (
    <Container>
      <MultichainBridgeQuoteCard />
    </Container>
  );
};
DefaultStory.storyName = 'Default';
DefaultStory.decorators = [
  (story) => (
    <Provider
      store={configureStore(
        createBridgeMockStore({
          bridgeStateOverrides: { quotes: mockBridgeQuotesErc20Erc20 },
          metamaskStateOverrides: {
            currencyRates: {
              ETH: { conversionRate: 2514.5 },
            },
          },
        }),
      )}
    >
      {story()}
    </Provider>
  ),
];

export const WithDestinationAddress = () => {
  return (
    <Container>
      <MultichainBridgeQuoteCard />
    </Container>
  );
};
WithDestinationAddress.decorators = [
  (story) => (
    <Provider
      store={configureStore(
        createBridgeMockStore({
          bridgeStateOverrides: { quotes: mockBridgeQuotesErc20Erc20 },
          metamaskStateOverrides: {
            currencyRates: {
              ETH: { conversionRate: 2514.5 },
            },
          },
        }),
      )}
    >
      {story()}
    </Provider>
  ),
];

export const WithLowEstimatedReturn = () => {
  return (
    <Container>
      <MultichainBridgeQuoteCard />
    </Container>
  );
};
WithLowEstimatedReturn.decorators = [
  (story) => (
    <Provider
      store={configureStore(
        createBridgeMockStore({
          bridgeStateOverrides: { quotes: mockBridgeQuotesErc20Erc20 },
          bridgeSliceOverrides: {
            validationErrors: {
              isEstimatedReturnLow: true,
            },
          },
          metamaskStateOverrides: {
            currencyRates: {
              ETH: { conversionRate: 2514.5 },
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
