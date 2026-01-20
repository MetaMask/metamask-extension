import React from 'react';
import { Provider } from 'react-redux';
import { cloneDeep, merge } from 'lodash';
import { TransactionMeta } from '@metamask/transaction-controller';
import { ApprovalType } from '@metamask/controller-utils';

import mockState from '../../../../../../test/data/mock-state.json';
import configureStore from '../../../../../store/store';
import { ConfirmContextProvider } from '../../../context/confirm';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';

import {
  CustomAmountInfo,
  CustomAmountInfoSkeleton,
} from './custom-amount-info';

const CHAIN_ID_MOCK = '0x1';
const TOKEN_ADDRESS_MOCK = '0x6b175474e89094c44da98b954eedeac495271d0f';

const transaction = genUnapprovedContractInteractionConfirmation({
  chainId: CHAIN_ID_MOCK,
}) as TransactionMeta;

const createMockState = ({
  isLoading = false,
  hasQuotes = true,
  hasAvailableTokens = true,
}: {
  isLoading?: boolean;
  hasQuotes?: boolean;
  hasAvailableTokens?: boolean;
} = {}) => {
  const state = cloneDeep(mockState);

  const availableTokens = hasAvailableTokens
    ? [
        {
          address: TOKEN_ADDRESS_MOCK,
          chainId: CHAIN_ID_MOCK,
          symbol: 'DAI',
          decimals: 18,
          balanceFiat: '1000',
          balanceHuman: '1000',
          balanceRaw: '1000000000000000000000',
          balanceUsd: '1000',
        },
      ]
    : [];

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
                targetAmount: { usd: '100' },
              }
            : undefined,
          requiredTokens: [
            {
              address: TOKEN_ADDRESS_MOCK,
              chainId: CHAIN_ID_MOCK,
              amount: '100000000000000000000',
              amountUsd: '100',
              decimals: 18,
              skipIfBalance: false,
            },
          ],
          availableTokens,
          paymentToken: hasAvailableTokens
            ? {
                address: TOKEN_ADDRESS_MOCK,
                chainId: CHAIN_ID_MOCK,
                symbol: 'DAI',
                decimals: 18,
                balanceFiat: '1000',
                balanceHuman: '1000',
                balanceRaw: '1000000000000000000000',
                balanceUsd: '1000',
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
  });

  return state;
};

const Story = {
  title: 'Confirmations/Components/Info/CustomAmountInfo',
  component: CustomAmountInfo,
  decorators: [
    (story: () => JSX.Element) => (
      <Provider store={configureStore(createMockState())}>
        <ConfirmContextProvider confirmationId={transaction.id}>
          <div
            style={{
              maxWidth: '400px',
              height: '500px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {story()}
          </div>
        </ConfirmContextProvider>
      </Provider>
    ),
  ],
};

export default Story;

export const DefaultStory = () => <CustomAmountInfo />;
DefaultStory.storyName = 'Default';

export const WithMaxButtonStory = () => <CustomAmountInfo hasMax />;
WithMaxButtonStory.storyName = 'With Max Button';

export const DisablePayStory = () => <CustomAmountInfo disablePay />;
DisablePayStory.storyName = 'Disable Pay';

export const LoadingStory = () => {
  const store = configureStore(createMockState({ isLoading: true }));
  return (
    <Provider store={store}>
      <ConfirmContextProvider confirmationId={transaction.id}>
        <div
          style={{
            maxWidth: '400px',
            height: '500px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <CustomAmountInfo hasMax />
        </div>
      </ConfirmContextProvider>
    </Provider>
  );
};
LoadingStory.storyName = 'Loading';

export const NoAvailableTokensStory = () => {
  const store = configureStore(createMockState({ hasAvailableTokens: false }));
  return (
    <Provider store={store}>
      <ConfirmContextProvider confirmationId={transaction.id}>
        <div
          style={{
            maxWidth: '400px',
            height: '500px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <CustomAmountInfo hasMax />
        </div>
      </ConfirmContextProvider>
    </Provider>
  );
};
NoAvailableTokensStory.storyName = 'No Available Tokens';

export const SkeletonStory = () => <CustomAmountInfoSkeleton />;
SkeletonStory.storyName = 'Skeleton';
