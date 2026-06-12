import React from 'react';
import { Provider } from 'react-redux';
import { cloneDeep, merge } from 'lodash';
import { TransactionMeta } from '@metamask/transaction-controller';

import mockState from '../../../../../../test/data/mock-state.json';
import configureStore from '../../../../../store/store';
import { ConfirmContextProvider } from '../../../context/confirm';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';
import { ApprovalType } from '@metamask/controller-utils';

import { BridgeFeeRow } from './bridge-fee-row';

const CHAIN_ID_MOCK = '0x1';

const transaction = genUnapprovedContractInteractionConfirmation({
  chainId: CHAIN_ID_MOCK,
}) as TransactionMeta;

const createMockState = (isLoading = false, hasQuotes = true) => {
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
          quotes: hasQuotes ? [{ id: 'quote-1' }] : [],
          totals: hasQuotes
            ? {
                fees: {
                  provider: { usd: '1.50' },
                  sourceNetwork: { estimate: { usd: '2.00' } },
                  targetNetwork: { usd: '0.50' },
                },
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
        transactionFee: { message: 'Transaction fee' },
        metamaskFee: { message: 'MetaMask fee' },
        networkFee: { message: 'Network fee' },
        bridgeFee: { message: 'Bridge fee' },
      },
      en: {
        transactionFee: { message: 'Transaction fee' },
        metamaskFee: { message: 'MetaMask fee' },
        networkFee: { message: 'Network fee' },
        bridgeFee: { message: 'Bridge fee' },
      },
    },
  });

  return state;
};

const Story = {
  title: 'Confirmations/Components/Rows/BridgeFeeRow',
  component: BridgeFeeRow,
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

export const DefaultStory = () => <BridgeFeeRow />;
DefaultStory.storyName = 'Default';

export const LoadingStory = () => {
  const store = configureStore(createMockState(true));
  return (
    <Provider store={store}>
      <ConfirmContextProvider confirmationId={transaction.id}>
        <BridgeFeeRow />
      </ConfirmContextProvider>
    </Provider>
  );
};
LoadingStory.storyName = 'Loading';

export const NoQuotesStory = () => {
  const store = configureStore(createMockState(false, false));
  return (
    <Provider store={store}>
      <ConfirmContextProvider confirmationId={transaction.id}>
        <BridgeFeeRow />
      </ConfirmContextProvider>
    </Provider>
  );
};
NoQuotesStory.storyName = 'No Quotes';
