import React from 'react';
import { Provider } from 'react-redux';

import configureStore from '../../../../../../../store/store';
import { NestedTransaction } from './nested-transaction';
import { ConfirmContextProvider } from '../../../../../context/confirm';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../../test/data/confirmations/contract-interaction';
import { getMockConfirmStateForTransaction } from '../../../../../../../../test/data/confirmations/helper';
import { BatchTransactionParams } from '@metamask/transaction-controller';

const BATCH_TRANSACTION_PARAMS_MOCK: BatchTransactionParams = {
  data: '0x12345',
  to: '0x1234567890123456789012345678901234567890',
  value: '0xabc',
};

const TRANSACTION_MOCK = genUnapprovedContractInteractionConfirmation({
  nestedTransactions: [BATCH_TRANSACTION_PARAMS_MOCK],
});

const STATE_MOCK = getMockConfirmStateForTransaction(TRANSACTION_MOCK);

const store = configureStore(STATE_MOCK);

const Story = {
  title: 'Confirmations/Components/Confirm/NestedTransaction',
  component: NestedTransaction,
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

export const DefaultStory = () => <NestedTransaction index={0} />;

DefaultStory.storyName = 'Default';
