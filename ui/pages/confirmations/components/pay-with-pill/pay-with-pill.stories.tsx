import React from 'react';
import { Provider } from 'react-redux';
import { cloneDeep, merge } from 'lodash';
import { TransactionMeta } from '@metamask/transaction-controller';
import { ApprovalType } from '@metamask/controller-utils';

import mockState from '../../../../../test/data/mock-state.json';
import configureStore from '../../../../store/store';
import { ConfirmContextProvider } from '../../context/confirm';
import {
  genUnapprovedContractInteractionConfirmation,
  CONTRACT_INTERACTION_SENDER_ADDRESS,
} from '../../../../../test/data/confirmations/contract-interaction';
import { PayWithPill, PayWithPillSkeleton } from './pay-with-pill';

const CHAIN_ID_MOCK = '0x5';
const TOKEN_ADDRESS_MOCK = '0x6b175474e89094c44da98b954eedeac495271d0f';
const SENDER_ADDRESS = CONTRACT_INTERACTION_SENDER_ADDRESS;

const transaction = genUnapprovedContractInteractionConfirmation({
  chainId: CHAIN_ID_MOCK,
}) as TransactionMeta;

const createMockState = (hasPaymentToken = true) => {
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
          paymentToken: hasPaymentToken
            ? {
                address: TOKEN_ADDRESS_MOCK,
                chainId: CHAIN_ID_MOCK,
                symbol: 'USDC',
                decimals: 6,
                balanceUsd: '750.00',
              }
            : undefined,
          tokens: [],
          quotes: [],
        },
      },
      enabledNetworkMap: {
        eip155: {
          [CHAIN_ID_MOCK]: true,
        },
      },
      accountsByChainId: {
        [CHAIN_ID_MOCK]: {
          [SENDER_ADDRESS]: {
            balance: '0x346ba7725f412cbfdb',
          },
        },
      },
      internalAccounts: {
        accounts: {
          'mock-account-id': {
            id: 'mock-account-id',
            address: SENDER_ADDRESS,
            metadata: {
              name: 'Test Account',
              keyring: { type: 'HD Key Tree' },
            },
            options: {},
            methods: [],
            type: 'eip155:eoa',
          },
        },
        selectedAccount: 'mock-account-id',
      },
      currentCurrency: 'usd',
      currencyRates: {
        ETH: { conversionRate: 2000 },
        usd: { conversionRate: 1 },
      },
      preferences: {
        ...state.metamask.preferences,
        showFiatInTestnets: true,
      },
    },
  });

  return state;
};

const Story = {
  title: 'Confirmations/Components/PayWithPill',
  component: PayWithPill,
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

export const DefaultStory = () => <PayWithPill />;
DefaultStory.storyName = 'Default';

export const SkeletonStory = () => <PayWithPillSkeleton />;
SkeletonStory.storyName = 'Skeleton';
