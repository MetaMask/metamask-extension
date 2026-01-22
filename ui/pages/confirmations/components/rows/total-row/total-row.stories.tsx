import React from 'react';
import { Provider } from 'react-redux';
import { cloneDeep, merge } from 'lodash';
import { TransactionMeta } from '@metamask/transaction-controller';

import mockState from '../../../../../../test/data/mock-state.json';
import configureStore from '../../../../../store/store';
import { ConfirmContextProvider } from '../../../context/confirm';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';
import { ApprovalType } from '@metamask/controller-utils';

import { TotalRow } from './total-row';

const CHAIN_ID_MOCK = '0x1';

const transaction = genUnapprovedContractInteractionConfirmation({
  chainId: CHAIN_ID_MOCK,
}) as TransactionMeta;

const createMockState = (isLoading = false, totalUsd = '125.50') => {
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
          isLoading,
          totals: totalUsd
            ? {
                total: { usd: totalUsd },
              }
            : undefined,
        },
      },
      currentCurrency: 'usd',
      currencyRates: {
        ETH: { conversionRate: 2000 },
      },
      preferences: {
        ...state.metamask.preferences,
        showFiatInTestnets: true,
      },
    },
    localeMessages: {
      currentLocale: 'en',
      current: {
        total: { message: 'Total' },
      },
      en: {
        total: { message: 'Total' },
      },
    },
  });

  return state;
};

const Story = {
  title: 'Confirmations/Components/Rows/TotalRow',
  component: TotalRow,
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

export const DefaultStory = () => <TotalRow />;
DefaultStory.storyName = 'Default';

export const LoadingStory = () => {
  const store = configureStore(createMockState(true));
  return (
    <Provider store={store}>
      <ConfirmContextProvider confirmationId={transaction.id}>
        <TotalRow />
      </ConfirmContextProvider>
    </Provider>
  );
};
LoadingStory.storyName = 'Loading';

export const LargeAmountStory = () => {
  const store = configureStore(createMockState(false, '12500.99'));
  return (
    <Provider store={store}>
      <ConfirmContextProvider confirmationId={transaction.id}>
        <TotalRow />
      </ConfirmContextProvider>
    </Provider>
  );
};
LargeAmountStory.storyName = 'Large Amount';
