import React from 'react';
import { Provider } from 'react-redux';

import configureStore from '../../../../../../../store/store';
import { NestedTransactionData } from './nested-transaction-data';
import { ConfirmContextProvider } from '../../../../../context/confirm';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../../test/data/confirmations/contract-interaction';
import { getMockConfirmStateForTransaction } from '../../../../../../../../test/data/confirmations/helper';

import {
  CONTRACT_ADDRESS_FOUR_BYTE,
  CONTRACT_ADDRESS_SOURCIFY,
  TRANSACTION_DATA_FOUR_BYTE,
} from '../../../../../../../../test/data/confirmations/transaction-decode';

const FOUR_BYTE_DATA = '0xabcdefab';
const SOURCIFY_DATA = '0x98765432';

const TRANSACTION_MOCK = genUnapprovedContractInteractionConfirmation({
  nestedTransactions: [
    {
      data: '0x12345678',
      to: '0x1234567890123456789012345678901234567890',
      value: '0x123',
    },
    {
      data: FOUR_BYTE_DATA,
      to: CONTRACT_ADDRESS_FOUR_BYTE,
      value: '0xabc',
    },
    {
      data: SOURCIFY_DATA,
      to: CONTRACT_ADDRESS_SOURCIFY,
      value: '0xabc',
    },
  ],
});

const STATE_MOCK = getMockConfirmStateForTransaction(TRANSACTION_MOCK, {
  metamask: {
    knownMethodData: {
      [FOUR_BYTE_DATA]: {
        name: 'Some Function',
      },
      [SOURCIFY_DATA]: {
        name: 'Cancel Authorization',
      },
    },
  },
});

const store = configureStore(STATE_MOCK);

const Story = {
  title: 'Pages/Confirmations/Components/Confirm/Info/Batch/NestedTransactionData',
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
