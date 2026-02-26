import React from 'react';
import { Provider } from 'react-redux';
import { cloneDeep, merge } from 'lodash';

import mockState from '../../../../../../test/data/mock-state.json';
import configureStore from '../../../../../store/store';
import { ConfirmContextProvider } from '../../../context/confirm';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';
import { ApprovalType } from '@metamask/controller-utils';

import { PayWithModal } from './pay-with-modal';

const CHAIN_ID_MOCK = '0x5';
const TOKEN_ADDRESS_MOCK = '0x6b175474e89094c44da98b954eedeac495271d0f';
const USDC_ADDRESS_MOCK = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';

const ACCOUNT_1_ADDRESS = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';
const ACCOUNT_2_ADDRESS = '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b';

const transaction = genUnapprovedContractInteractionConfirmation({
  chainId: CHAIN_ID_MOCK,
});

const createMockState = () => {
  const state = cloneDeep(mockState);

  merge(state, {
    metamask: {
      pendingApprovals: {
        [transaction.id]: {
          id: transaction.id,
          type: ApprovalType.Transaction,
        },
      },
      transactions: [transaction],
      transactionData: {
        [transaction.id]: {
          isLoading: false,
          paymentToken: {
            address: TOKEN_ADDRESS_MOCK,
            chainId: CHAIN_ID_MOCK,
          },
          tokens: [],
          quotes: [],
        },
      },
      enabledNetworkMap: {
        eip155: {
          [CHAIN_ID_MOCK]: true,
        },
      },
      allTokens: {
        [CHAIN_ID_MOCK]: {
          [ACCOUNT_1_ADDRESS]: [
            {
              address: TOKEN_ADDRESS_MOCK,
              symbol: 'DAI',
              decimals: 18,
              name: 'Dai Stablecoin',
            },
            {
              address: USDC_ADDRESS_MOCK,
              symbol: 'USDC',
              decimals: 6,
              name: 'USD Coin',
            },
          ],
          [ACCOUNT_2_ADDRESS]: [],
        },
      },
      allIgnoredTokens: {},
      tokenBalances: {
        [ACCOUNT_1_ADDRESS]: {
          [CHAIN_ID_MOCK]: {
            [TOKEN_ADDRESS_MOCK]: '0x1111d67bb1bb0000', // 1.23 DAI (18 decimals)
            [USDC_ADDRESS_MOCK]: '0x23bdb0', // 2.34 USDC (6 decimals)
          },
        },
        [ACCOUNT_2_ADDRESS]: {
          [CHAIN_ID_MOCK]: {},
        },
      },
      accountsByChainId: {
        [CHAIN_ID_MOCK]: {
          [ACCOUNT_1_ADDRESS]: {
            balance: '0x346ba7725f412cbfdb',
          },
          [ACCOUNT_2_ADDRESS]: {
            balance: '0x0',
          },
        },
      },
      marketData: {
        [CHAIN_ID_MOCK]: {
          [TOKEN_ADDRESS_MOCK]: { price: 1, currency: 'usd' },
          [USDC_ADDRESS_MOCK]: { price: 1, currency: 'usd' },
          '0x0000000000000000000000000000000000000000': {
            price: 2000,
            currency: 'usd',
          },
        },
      },
      currencyRates: {
        ETH: { conversionRate: 2000 },
        usd: { conversionRate: 1 },
      },
      currentCurrency: 'usd',
      preferences: {
        ...state.metamask.preferences,
        showFiatInTestnets: true,
      },
    },
  });

  return state;
};

const store = configureStore(createMockState());

const Story = {
  title: 'Confirmations/Components/Modals/PayWithModal',
  component: PayWithModal,
  decorators: [
    (story: () => JSX.Element) => (
      <Provider store={store}>
        <ConfirmContextProvider>{story()}</ConfirmContextProvider>
      </Provider>
    ),
  ],
};

export default Story;

export const DefaultStory = () => (
  <PayWithModal isOpen={true} onClose={() => console.log('Modal closed')} />
);

DefaultStory.storyName = 'Default';
