import React from 'react';
import { Provider } from 'react-redux';
import { cloneDeep, merge } from 'lodash';
import { TransactionMeta } from '@metamask/transaction-controller';
import { ApprovalType } from '@metamask/controller-utils';

import mockState from '../../../../../../test/data/mock-state.json';
import configureStore from '../../../../../store/store';
import { ConfirmContextProvider } from '../../../context/confirm';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';
import { ClaimableBonusRow } from './claimable-bonus-row';

const CHAIN_ID_MOCK = '0x1';

const transaction = genUnapprovedContractInteractionConfirmation({
  chainId: CHAIN_ID_MOCK,
}) as TransactionMeta;

const createMockState = () => {
  const state = cloneDeep(mockState);

  merge(state, {
    metamask: {
      pendingApprovals: {
        [transaction.id]: {
          id: transaction.id,
          type: ApprovalType.Transaction,
          time: transaction.time,
        },
      },
      transactions: [transaction],
      transactionData: {
        [transaction.id]: {
          isLoading: false,
          quotes: [{ id: 'quote-1' }],
        },
      },
    },
  });

  return state;
};

const Story = {
  title: 'Confirmations/Components/Rows/ClaimableBonusRow',
  component: ClaimableBonusRow,
  decorators: [
    (story: () => JSX.Element) => (
      <Provider store={configureStore(createMockState())}>
        <ConfirmContextProvider confirmationId={transaction.id}>
          {story()}
        </ConfirmContextProvider>
      </Provider>
    ),
  ],
};

export default Story;

export const DefaultStory = () => <ClaimableBonusRow />;
DefaultStory.storyName = 'Default';
