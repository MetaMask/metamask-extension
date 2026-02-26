import React from 'react';
import { Provider } from 'react-redux';
import { cloneDeep, merge } from 'lodash';
import { TransactionMeta } from '@metamask/transaction-controller';

import mockState from '../../../../../../test/data/mock-state.json';
import configureStore from '../../../../../store/store';
import { ConfirmContextProvider } from '../../../context/confirm';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';
import { ApprovalType } from '@metamask/controller-utils';

import { BridgeTimeRow } from './bridge-time-row';

const CHAIN_ID_MOCK = '0x1';
const DIFFERENT_CHAIN_ID = '0x89';
const TOKEN_ADDRESS_MOCK = '0x6B175474E89094C44Da98b954EedeAC495271d0F';

const transaction = genUnapprovedContractInteractionConfirmation({
  chainId: CHAIN_ID_MOCK,
}) as TransactionMeta;

const createMockState = (
  isLoading = false,
  hasQuotes = true,
  isSameChain = false,
  estimatedDuration = 120,
) => {
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
          paymentToken: {
            address: TOKEN_ADDRESS_MOCK,
            chainId: isSameChain ? CHAIN_ID_MOCK : DIFFERENT_CHAIN_ID,
            symbol: 'DAI',
            decimals: 18,
          },
          quotes: hasQuotes ? [{ id: 'quote-1' }] : [],
          totals: hasQuotes
            ? {
                estimatedDuration,
              }
            : undefined,
        },
      },
      currentCurrency: 'usd',
      preferences: {
        ...state.metamask.preferences,
        showFiatInTestnets: true,
      },
    },
    localeMessages: {
      currentLocale: 'en',
      current: {
        estimatedTime: { message: 'Estimated time' },
        minute: { message: 'min' },
        second: { message: 'sec' },
      },
      en: {
        estimatedTime: { message: 'Estimated time' },
        minute: { message: 'min' },
        second: { message: 'sec' },
      },
    },
  });

  return state;
};

const Story = {
  title: 'Confirmations/Components/Rows/BridgeTimeRow',
  component: BridgeTimeRow,
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

export const DefaultStory = () => <BridgeTimeRow />;
DefaultStory.storyName = 'Default (2 minutes)';

export const SameChainStory = () => {
  const store = configureStore(createMockState(false, true, true));
  return (
    <Provider store={store}>
      <ConfirmContextProvider confirmationId={transaction.id}>
        <BridgeTimeRow />
      </ConfirmContextProvider>
    </Provider>
  );
};
SameChainStory.storyName = 'Same Chain (< 10 seconds)';

export const LessThanOneMinuteStory = () => {
  const store = configureStore(createMockState(false, true, false, 25));
  return (
    <Provider store={store}>
      <ConfirmContextProvider confirmationId={transaction.id}>
        <BridgeTimeRow />
      </ConfirmContextProvider>
    </Provider>
  );
};
LessThanOneMinuteStory.storyName = 'Less Than 1 Minute';

export const LoadingStory = () => {
  const store = configureStore(createMockState(true));
  return (
    <Provider store={store}>
      <ConfirmContextProvider confirmationId={transaction.id}>
        <BridgeTimeRow />
      </ConfirmContextProvider>
    </Provider>
  );
};
LoadingStory.storyName = 'Loading';
