import React from 'react';
import { Provider } from 'react-redux';

import { GasFeeTokenListItem } from './gas-fee-token-list-item';
import { GasFeeToken } from '@metamask/transaction-controller';
import { toHex } from '@metamask/controller-utils';
import configureStore from '../../../../../../../store/store';
import { getMockConfirmStateForTransaction } from '../../../../../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../../test/data/confirmations/contract-interaction';
import { NATIVE_TOKEN_ADDRESS } from '../../hooks/useGasFeeToken';
import { ConfirmContextProvider } from '../../../../../context/confirm';
import { Hex } from '@metamask/utils';

const FROM_MOCK = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';
const FROM_NO_BALANCE_MOCK = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bd';

const GAS_FEE_TOKEN_MOCK: GasFeeToken = {
  amount: toHex(1000),
  balance: toHex(2345),
  decimals: 3,
  gas: '0x3',
  maxFeePerGas: '0x4',
  maxPriorityFeePerGas: '0x5',
  rateWei: toHex('1798170000000000000'),
  recipient: '0x1234567890123456789012345678901234567891',
  symbol: 'TEST',
  tokenAddress: '0x1234567890123456789012345678901234567890',
};

function getStore({ sender }: { sender?: Hex }) {
  return configureStore(
    getMockConfirmStateForTransaction(
      genUnapprovedContractInteractionConfirmation({
        address: sender ?? FROM_MOCK,
        gasFeeTokens: [GAS_FEE_TOKEN_MOCK],
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
}

const Story = {
  title: 'Confirmations/Components/Confirm/GasFeeTokenListItem',
  component: GasFeeTokenListItem,
  decorators: [
    (story: any, { args }) => (
      <Provider store={getStore(args ?? {})}>
        <ConfirmContextProvider>{story()}</ConfirmContextProvider>
      </Provider>
    ),
  ],
};

export default Story;

export const DefaultStory = () => (
  <GasFeeTokenListItem tokenAddress={GAS_FEE_TOKEN_MOCK.tokenAddress} />
);

DefaultStory.storyName = 'Default';

export const SelectedStory = () => (
  <GasFeeTokenListItem
    tokenAddress={GAS_FEE_TOKEN_MOCK.tokenAddress}
    isSelected={true}
  />
);

SelectedStory.storyName = 'Selected';

export const NativeStory = () => (
  <GasFeeTokenListItem tokenAddress={NATIVE_TOKEN_ADDRESS} />
);

NativeStory.storyName = 'Native';

export const InsufficientFundsStory = () => (
  <GasFeeTokenListItem tokenAddress={NATIVE_TOKEN_ADDRESS} />
);

InsufficientFundsStory.storyName = 'Insufficient Funds';
InsufficientFundsStory.args = { sender: FROM_NO_BALANCE_MOCK };
