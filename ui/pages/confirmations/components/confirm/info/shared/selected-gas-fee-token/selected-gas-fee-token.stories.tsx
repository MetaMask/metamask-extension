import React from 'react';
import { Provider } from 'react-redux';

import { getMockConfirmStateForTransaction } from '../../../../../../../../test/data/confirmations/helper';
import configureStore from '../../../../../../../store/store';
import { ConfirmContextProvider } from '../../../../../context/confirm';

import { SelectedGasFeeToken } from './selected-gas-fee-token';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../../test/data/confirmations/contract-interaction';
import { toHex } from '@metamask/controller-utils';
import { GasFeeToken } from '@metamask/transaction-controller';

const TOKEN_ADDRESS_MOCK = '0x1234567890abcdef1234567890abcdef12345678';

const GAS_FEE_TOKEN_MOCK: GasFeeToken = {
  amount: toHex(1000),
  balance: toHex(2345),
  decimals: 3,
  gas: '0x3',
  maxFeePerGas: '0x4',
  maxPriorityFeePerGas: '0x5',
  rateWei: toHex('1798170000000000000'),
  recipient: '0x7',
  symbol: 'USDC',
  tokenAddress: '0xabc',
};

const store = configureStore(
  getMockConfirmStateForTransaction(
    genUnapprovedContractInteractionConfirmation(),
    {
      metamask: {
        preferences: {
          showFiatInTestnets: true,
        },
      },
    },
  ),
);

const Story = {
  title: 'Confirmations/Components/Confirm/SelectedGasFeeToken',
  component: SelectedGasFeeToken,
  decorators: [
    (story: any) => (
      <Provider store={store}>
        <ConfirmContextProvider>{story()}</ConfirmContextProvider>
      </Provider>
    ),
  ],
};

export default Story;

export const DefaultStory = () => (
  <SelectedGasFeeToken gasFeeToken={GAS_FEE_TOKEN_MOCK} />
);

DefaultStory.storyName = 'Default';
