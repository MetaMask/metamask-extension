import React from 'react';
import { Provider } from 'react-redux';

import { getMockConfirmStateForTransaction } from '../../../../../../../../test/data/confirmations/helper';
import configureStore from '../../../../../../../store/store';
import { ConfirmContextProvider } from '../../../../../context/confirm';

import { GasFeeTokenModal } from './gas-fee-token-modal';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../../test/data/confirmations/contract-interaction';
import { GasFeeToken } from '@metamask/transaction-controller';
import { toHex } from '@metamask/controller-utils';
import { GAS_FEE_TOKEN_MOCK } from '../../../../../../../../test/data/confirmations/gas';

const GAS_FEE_TOKEN_2_MOCK: GasFeeToken = {
  amount: toHex(20000),
  balance: toHex(43210),
  decimals: 4,
  gas: '0x3',
  gasTransfer: '0x3a',
  maxFeePerGas: '0x4',
  maxPriorityFeePerGas: '0x5',
  rateWei: toHex('1798170000000000000'),
  recipient: '0x1234567890123456789012345678901234567892',
  symbol: 'WETH',
  tokenAddress: '0x1234567890123456789012345678901234567893',
};

const GAS_FEE_TOKEN_3_MOCK: GasFeeToken = {
  amount: toHex(1230000000000000000),
  balance: toHex(2340000000000000000),
  decimals: 18,
  gas: '0x3',
  gasTransfer: '0x3a',
  maxFeePerGas: '0x4',
  maxPriorityFeePerGas: '0x5',
  rateWei: toHex('1000000000000000000'),
  recipient: '0x1234567890123456789012345678901234567892',
  symbol: 'ETH',
  tokenAddress: '0x0000000000000000000000000000000000000000',
};

const store = configureStore(
  getMockConfirmStateForTransaction(
    genUnapprovedContractInteractionConfirmation({
      gasFeeTokens: [
        GAS_FEE_TOKEN_MOCK,
        GAS_FEE_TOKEN_2_MOCK,
        GAS_FEE_TOKEN_3_MOCK,
      ],
      selectedGasFeeToken: GAS_FEE_TOKEN_MOCK.tokenAddress,
    }),
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
  title: 'Pages/Confirmations/Components/Confirm/Info/Shared/GasFeeTokenModal',
  component: GasFeeTokenModal,
  decorators: [
    (story: any) => (
      <Provider store={store}>
        <ConfirmContextProvider>{story()}</ConfirmContextProvider>
      </Provider>
    ),
  ],
};

export default Story;

export const DefaultStory = () => <GasFeeTokenModal onClose={() => {}} />;

DefaultStory.storyName = 'Default';
