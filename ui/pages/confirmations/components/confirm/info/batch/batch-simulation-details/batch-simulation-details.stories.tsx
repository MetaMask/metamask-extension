import React from 'react';
import { Provider } from 'react-redux';

import configureStore from '../../../../../../../store/store';
import { BatchSimulationDetails } from './batch-simulation-details';
import { ConfirmContextProvider } from '../../../../../context/confirm';
import {
  CHAIN_ID,
  genUnapprovedContractInteractionConfirmation,
} from '../../../../../../../../test/data/confirmations/contract-interaction';
import { getMockConfirmStateForTransaction } from '../../../../../../../../test/data/confirmations/helper';
import {
  CHAIN_IDS,
  SimulationTokenStandard,
} from '@metamask/transaction-controller';
import { NameType } from '@metamask/name-controller';
import { Hex } from '@metamask/utils';
import { buildApproveTransactionData } from '../../../../../../../../test/data/confirmations/token-approve';
import { TOKEN_VALUE_UNLIMITED_THRESHOLD } from '../../shared/constants';
import { buildSetApproveForAllTransactionData } from '../../../../../../../../test/data/confirmations/set-approval-for-all';

const ERC20_TOKEN_1_MOCK = '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599'; // WBTC
const ERC20_TOKEN_2_MOCK = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'; // USDC
const ERC721_TOKEN_MOCK = '0x06012c8cf97bead5deae237070f9587f8e7a266d'; // CryptoKitties
const ERC1155_TOKEN_MOCK = '0x60e4d786628fea6478f785a6d7e704777c86a7c6'; // MAYC

const DUMMY_BALANCE_CHANGE = {
  previousBalance: '0xIGNORED' as Hex,
  newBalance: '0xIGNORED' as Hex,
};

const TRANSACTION_MOCK = genUnapprovedContractInteractionConfirmation({
  nestedTransactions: [
    {
      data: '0x095ea7b30000000000000000000000009bc5baf874d2da8d216ae9f137804184ee5afef40000000000000000000000000000000000000000000000000000000123456901',
      to: ERC20_TOKEN_2_MOCK,
    },
    {
      data: '0x095ea7b30000000000000000000000009bc5baf874d2da8d216ae9f137804184ee5afef40000000000000000000000000000000000000000000000000000000000000721',
      to: ERC721_TOKEN_MOCK,
    },
    {
      data: buildApproveTransactionData(ERC20_TOKEN_2_MOCK, TOKEN_VALUE_UNLIMITED_THRESHOLD),
      to: ERC20_TOKEN_2_MOCK,
    },
    {
      data: buildSetApproveForAllTransactionData(ERC721_TOKEN_MOCK, true),
      to: ERC721_TOKEN_MOCK,
    }
  ],
  simulationData: {
    nativeBalanceChange: {
      ...DUMMY_BALANCE_CHANGE,
      difference: '0x12345678912345678',
      isDecrease: true,
    },
    tokenBalanceChanges: [
      {
        ...DUMMY_BALANCE_CHANGE,
        address: ERC20_TOKEN_1_MOCK,
        difference: '0x123456',
        isDecrease: false,
        standard: SimulationTokenStandard.erc20,
      },
      {
        ...DUMMY_BALANCE_CHANGE,
        address: ERC1155_TOKEN_MOCK,
        difference: '0x13',
        isDecrease: false,
        id: '0x1155',
        standard: SimulationTokenStandard.erc1155,
      },
    ],
  },
});

const STATE_MOCK = getMockConfirmStateForTransaction(TRANSACTION_MOCK, {
  metamask: {
    names: {
      [NameType.ETHEREUM_ADDRESS]: {
        ['0x1234567890123456789012345678901234567890']: {
          [CHAIN_ID]: {
            name: 'USDC',
          },
        },
      },
    },
    tokensChainsCache: {
      [CHAIN_ID]: {
        data: {
          [ERC20_TOKEN_1_MOCK]: {
            address: ERC20_TOKEN_1_MOCK,
            symbol: 'WBTC',
            name: 'Wrapped Bitcoin',
            iconUrl: `https://static.cx.metamask.io/api/v1/tokenIcons/1/${ERC20_TOKEN_1_MOCK}.png`,
          },
          [ERC20_TOKEN_2_MOCK]: {
            address: ERC20_TOKEN_2_MOCK,
            symbol: 'USDC',
            name: 'USD Coin',
            iconUrl: `https://static.cx.metamask.io/api/v1/tokenIcons/1/${ERC20_TOKEN_2_MOCK}.png`,
          },
          [ERC721_TOKEN_MOCK]: {
            address: ERC721_TOKEN_MOCK,
            symbol: 'CK',
            name: 'CryptoKitties',
            iconUrl: `https://static.cx.metamask.io/api/v1/tokenIcons/1/${ERC721_TOKEN_MOCK}.png`,
          },
          [ERC1155_TOKEN_MOCK]: {
            address: ERC1155_TOKEN_MOCK,
            symbol: 'MAYC',
            name: 'Mutant Ape Yacht Club',
            iconUrl: `https://static.cx.metamask.io/api/v1/tokenIcons/1/${ERC1155_TOKEN_MOCK}.png `,
          },
        },
      },
    },
  },
});

const store = configureStore(STATE_MOCK);

const Story = {
  title: 'Confirmations/Components/Confirm/BatchSimulationDetails',
  component: BatchSimulationDetails,
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

export const DefaultStory = () => <BatchSimulationDetails />;

DefaultStory.storyName = 'Default';
