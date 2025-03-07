import React from 'react';
import { Provider } from 'react-redux';

import {
  getMockConfirmStateForTransaction,
  getMockPersonalSignConfirmState,
} from '../../../../../../../../test/data/confirmations/helper';
import configureStore from '../../../../../../../store/store';
import { ConfirmContextProvider } from '../../../../../context/confirm';

import { TokenGasFeeModal } from './token-gas-fee-modal';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../../test/data/confirmations/contract-interaction';

const store = configureStore(
  getMockConfirmStateForTransaction(
    genUnapprovedContractInteractionConfirmation({
      gasFeeTokens: [{
        contractAddress: '0x1234567890123456789012345678901234567890',
        balance: '0xabcdef123',
        amount: '0x12345',
      }]
    }),
  ),
);

const Story = {
  title: 'Confirmations/Components/Confirm/TokenGasFeeModal',
  component: TokenGasFeeModal,
  decorators: [
    (story: any) => (
      <Provider store={store}>
        <ConfirmContextProvider>{story()}</ConfirmContextProvider>
      </Provider>
    ),
  ],
};

export default Story;

export const DefaultStory = () => <TokenGasFeeModal />;

DefaultStory.storyName = 'Default';
