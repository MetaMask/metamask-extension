import React from 'react';
import { Provider } from 'react-redux';
import { cloneDeep, merge } from 'lodash';
import { TransactionMeta } from '@metamask/transaction-controller';
import { ApprovalType } from '@metamask/controller-utils';

import mockState from '../../../../../../test/data/mock-state.json';
import configureStore from '../../../../../store/store';
import { ConfirmContextProvider } from '../../../context/confirm';
import {
  genUnapprovedContractInteractionConfirmation,
  CONTRACT_INTERACTION_SENDER_ADDRESS,
} from '../../../../../../test/data/confirmations/contract-interaction';

import { CustomAmount } from './custom-amount';

const CHAIN_ID_MOCK = '0x5';

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
          isMaxAmount: false,
          tokens: [],
          quotes: [],
        },
      },
      currentCurrency: 'usd',
      currencyRates: {
        ETH: { conversionRate: 2000 },
        usd: { conversionRate: 1 },
      },
      internalAccounts: {
        accounts: {
          'mock-account-id': {
            id: 'mock-account-id',
            address: CONTRACT_INTERACTION_SENDER_ADDRESS,
            metadata: {
              name: 'Test Account',
              keyring: {
                type: 'HD Key Tree',
              },
            },
            options: {},
            methods: [],
            type: 'eip155:eoa',
          },
        },
        selectedAccount: 'mock-account-id',
      },
    },
  });

  return state;
};

const Story = {
  title: 'Confirmations/Components/Transactions/CustomAmount',
  component: CustomAmount,
  decorators: [
    (story: () => JSX.Element) => (
      <Provider store={configureStore(createMockState())}>
        <ConfirmContextProvider confirmationId={transaction.id}>
          <div style={{ padding: '20px', maxWidth: '400px' }}>{story()}</div>
        </ConfirmContextProvider>
      </Provider>
    ),
  ],
};

export default Story;

export const DefaultStory = () => <CustomAmount amountFiat="123.45" />;
DefaultStory.storyName = 'Default';

export const LargeAmountStory = () => <CustomAmount amountFiat="12345.67" />;
LargeAmountStory.storyName = 'Large Amount';

export const VeryLargeAmountStory = () => (
  <CustomAmount amountFiat="123456789.12" />
);
VeryLargeAmountStory.storyName = 'Very Large Amount';

export const EuroCurrencyStory = () => (
  <CustomAmount amountFiat="500.00" currency="eur" />
);
EuroCurrencyStory.storyName = 'Euro Currency';

export const JpyCurrencyStory = () => (
  <CustomAmount amountFiat="50000" currency="jpy" />
);
JpyCurrencyStory.storyName = 'JPY Currency';

export const WithAlertStory = () => (
  <CustomAmount amountFiat="100.00" hasAlert />
);
WithAlertStory.storyName = 'With Alert (Error Color)';

export const DisabledStory = () => (
  <CustomAmount amountFiat="100.00" disabled />
);
DisabledStory.storyName = 'Disabled';

export const LoadingStory = () => (
  <CustomAmount amountFiat="100.00" isLoading />
);
LoadingStory.storyName = 'Loading';
