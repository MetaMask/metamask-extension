import React from 'react';
import { Provider } from 'react-redux';
import { cloneDeep, merge } from 'lodash';
import { TransactionMeta } from '@metamask/transaction-controller';

import mockState from '../../../../../test/data/mock-state.json';
import configureStore from '../../../../store/store';
import { ConfirmContextProvider } from '../../context/confirm';
import {
  genUnapprovedContractInteractionConfirmation,
  CONTRACT_INTERACTION_SENDER_ADDRESS,
} from '../../../../../test/data/confirmations/contract-interaction';
import { ApprovalType } from '@metamask/controller-utils';

import { PayTokenAmount, PayTokenAmountSkeleton } from './pay-token-amount';

const CHAIN_ID_MOCK = '0x1';
const TOKEN_ADDRESS_MOCK = '0x6B175474E89094C44Da98b954EesdfAC495271d0F';

const transaction = genUnapprovedContractInteractionConfirmation({
  chainId: CHAIN_ID_MOCK,
}) as TransactionMeta;

const createMockState = (isLoading = false, hasPayToken = true) => {
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
          paymentToken: hasPayToken
            ? {
                address: TOKEN_ADDRESS_MOCK,
                chainId: CHAIN_ID_MOCK,
                symbol: 'DAI',
                decimals: 18,
              }
            : undefined,
          tokens: [],
          quotes: isLoading ? [] : [{ id: 'quote-1' }],
        },
      },
      currentCurrency: 'usd',
      currencyRates: {
        ETH: {
          conversionRate: 2000,
          usdConversionRate: 2000,
        },
      },
      marketData: {
        [CHAIN_ID_MOCK]: {
          [TOKEN_ADDRESS_MOCK]: {
            price: 1,
          },
        },
      },
      networkConfigurationsByChainId: {
        [CHAIN_ID_MOCK]: {
          chainId: CHAIN_ID_MOCK,
          nativeCurrency: 'ETH',
          rpcEndpoints: [{ networkClientId: 'mainnet' }],
          defaultRpcEndpointIndex: 0,
        },
      },
      preferences: {
        ...state.metamask.preferences,
        showFiatInTestnets: true,
      },
    },
    localeMessages: {
      currentLocale: 'en',
    },
  });

  return state;
};

const Story = {
  title: 'Confirmations/Components/PayTokenAmount',
  component: PayTokenAmount,
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

export const DefaultStory = () => <PayTokenAmount amountHuman="100" />;
DefaultStory.storyName = 'Default';

export const DisabledStory = () => (
  <PayTokenAmount amountHuman="100" disabled />
);
DisabledStory.storyName = 'Disabled';

export const SkeletonStory = () => <PayTokenAmountSkeleton />;
SkeletonStory.storyName = 'Skeleton';

export const LoadingStory = () => {
  const store = configureStore(createMockState(true));
  return (
    <Provider store={store}>
      <ConfirmContextProvider confirmationId={transaction.id}>
        <PayTokenAmount amountHuman="100" />
      </ConfirmContextProvider>
    </Provider>
  );
};
LoadingStory.storyName = 'Loading';
