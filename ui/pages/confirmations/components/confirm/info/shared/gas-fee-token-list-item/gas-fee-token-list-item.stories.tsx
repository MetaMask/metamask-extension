import React from 'react';
import { Provider } from 'react-redux';

import { GasFeeTokenListItem } from './gas-fee-token-list-item';
import { GasFeeToken } from '@metamask/transaction-controller';
import { toHex } from '@metamask/controller-utils';
import mockState from '../../../../../../../../test/data/mock-state.json';
import configureStore from '../../../../../../../store/store';

const GAS_FEE_TOKEN_MOCK: GasFeeToken = {
  amount: toHex(1000),
  balance: toHex(2345),
  decimals: 3,
  gas: '0x3',
  maxFeePerGas: '0x4',
  maxPriorityFeePerGas: '0x5',
  rateWei: toHex('1798170000000000000'),
  recipient: '0x7',
  symbol: 'TEST',
  tokenAddress: '0xabc',
};

const STATE_MOCK = {
  ...mockState,
  metamask: {
    ...mockState.metamask,
    preferences: {
      ...mockState.metamask.preferences,
      showFiatInTestnets: true,
    },
  },
};

const store = configureStore(STATE_MOCK);

const Story = {
  title: 'Confirmations/Components/Confirm/GasFeeTokenListItem',
  component: GasFeeTokenListItem,
  decorators: [(story: any) => <Provider store={store}>{story()}</Provider>],
};

export default Story;

export const DefaultStory = () => (
  <GasFeeTokenListItem gasFeeToken={GAS_FEE_TOKEN_MOCK} />
);

DefaultStory.storyName = 'Default';

export const SelectedStory = () => (
  <GasFeeTokenListItem gasFeeToken={GAS_FEE_TOKEN_MOCK} isSelected={true} />
);

SelectedStory.storyName = 'Selected';