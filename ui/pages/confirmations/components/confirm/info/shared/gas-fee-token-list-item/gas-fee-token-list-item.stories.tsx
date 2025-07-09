import React from 'react';
import { Provider } from 'react-redux';

import { NATIVE_TOKEN_ADDRESS } from '../../../../../../../../shared/constants/transaction';
import { GasFeeTokenListItem } from './gas-fee-token-list-item';
import configureStore from '../../../../../../../store/store';
import { getMockConfirmStateForTransaction } from '../../../../../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../../test/data/confirmations/contract-interaction';
import { ConfirmContextProvider } from '../../../../../context/confirm';
import { Hex } from '@metamask/utils';
import { GAS_FEE_TOKEN_MOCK } from '../../../../../../../../test/data/confirmations/gas';

const FROM_MOCK = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';
const FROM_NO_BALANCE_MOCK = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bd';

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
