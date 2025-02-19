import React from 'react';
import { Provider } from 'react-redux';

import configureStore from '../../../../../../../store/store';
import { NestedTransactionData } from './nested-transaction-data';
import { ConfirmContextProvider } from '../../../../../context/confirm';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../../test/data/confirmations/contract-interaction';
import { getMockConfirmStateForTransaction } from '../../../../../../../../test/data/confirmations/helper';
import { BatchTransactionParams } from '@metamask/transaction-controller';

const TRANSACTION_MOCK = genUnapprovedContractInteractionConfirmation({
  nestedTransactions: [
    {
      data: '0x123456',
      to: '0x1234567890123456789012345678901234567890',
      value: '0x123',
    },
    {
      data: '0xabcdef',
      to: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      value: '0xabc',
    },
  ],
});

const STATE_MOCK = getMockConfirmStateForTransaction(TRANSACTION_MOCK);

const store = configureStore(STATE_MOCK);

const Story = {
  title: 'Confirmations/Components/Confirm/NestedTransactionData',
  component: NestedTransactionData,
  decorators: [
    (story) => {
      return (
        <Provider store={store}>
          <ConfirmContextProvider>{story()}</ConfirmContextProvider>
        </Provider>
      );
    },
  ],
};

export default Story;

export const DefaultStory = () => <NestedTransactionData />;

DefaultStory.storyName = 'Default';
