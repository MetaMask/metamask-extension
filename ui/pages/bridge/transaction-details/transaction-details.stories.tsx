import React from 'react';
import { Provider } from 'react-redux';
import type { Meta, StoryObj } from '@storybook/react';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import CrossChainSwapTxDetails from './transaction-details';

const store = configureStore(mockState);

function StoryWrapper() {
  return (
    <Provider store={store}>
      <CrossChainSwapTxDetails />
    </Provider>
  );
}

const meta: Meta<typeof CrossChainSwapTxDetails> = {
  title: 'Pages/Bridge/TransactionDetails',
  component: CrossChainSwapTxDetails,
  parameters: {
    initialEntries: ['/cross-chain/swaps/0xabc123'],
    path: '/cross-chain/swaps/:txHash',
  },
};

export default meta;
type Story = StoryObj<typeof CrossChainSwapTxDetails>;

export const DefaultStory: Story = {
  render: StoryWrapper,
};

DefaultStory.storyName = 'Default';
