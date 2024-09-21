import React from 'react';
import { Provider } from 'react-redux';
import configureStore from '../../../store/store';
import { updateSendAmount } from '../../../ducks/send';
import { AssetType } from '../../../../shared/constants/transaction';
import mockState from '../../../../test/data/mock-state.json';
import { AssetPickerAmount } from './asset-picker-amount';
import { INSUFFICIENT_FUNDS_ERROR_KEY } from '../../../helpers/constants/error-keys';
import { mockNetworkState } from '../../../../test/stub/networks';

const noop = () => {};

const storybook = {
  title: 'Components/Multichain/AssetPickerAmount',
  component: AssetPickerAmount,
};
export default storybook;

const store = configureStore({
  ...mockState,
  metamask: {
    ...mockState.metamask,
    currentCurrency: 'usd',
    currencyRates: {
      ETH: {
        conversionRate: 231.06,
      },
    },
    marketData: {
      ...mockState.metamask.marketData,
      '0x1': {
        ...mockState.metamask.marketData['0x1'],
        '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e': { price: 0.01 }
      }
    },
    tokens: [
      {
        address: '0x0000000000000000000000000000000000000000',
        symbol: 'TEST',
        decimals: '6',
      },
      {
        address: '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e',
        symbol: 'TEST',
        decimals: '6',
      },
      {
        address: '0xd8f6a2ffb0fc5952d16c9768b71cfd35b6399aa5',
        decimals: '8',
        symbol: 'TEST2',
      },
      {
        address: '0x617b3f8050a0bd94b6b1da02b4384ee5b4df13f4',
        symbol: 'META',
        decimals: '18',
      },
    ],
    ...mockNetworkState({ chainId: '0x1' }),
    preferences: {
      showFiatInTestnets: true,
    },
    useCurrencyRateCheck: true,
  },
  send: {
    ...mockState.send,
    selectedAccount: { address: '0x0', balance: '0x1' },
    currentTransactionUUID: '1-tx',
    draftTransactions: {
      '1-tx': {
        amount: {
          error: null,
          value: '0xde0b6b3a7640000',
        },
        sendAsset: {
          balance: '0x1158e460913d00000',
          details: null,
          error: null,
          type: 'NATIVE',
        },
        receiveAsset: {
          balance: '0x1158e460913d00000',
          details: null,
          error: null,
          type: 'NATIVE',
        },
        fromAccount: null,
        gas: {
          error: null,
          gasLimit: '0x5208',
          gasPrice: '0x0',
          gasTotal: '0x1ca62a544678',
          maxFeePerGas: '0x59682f0f',
          maxPriorityFeePerGas: '0x59682f00',
          wasManuallyEdited: false,
        },
        history: [],
        id: null,
        recipient: {
          address: '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b',
          error: null,
          nickname: 'Account 2',
          warning: null,
          type: '',
          recipientWarningAcknowledged: false,
        },
        status: 'VALID',
        transactionType: '0x2',
        userInputHexData: null,
      },
    },
  },
});

export const DefaultStory = () => (
  <div style={{ width: '400px' }}>
    <AssetPickerAmount
      onAmountChange={(newAmount: string) => {
        store.dispatch(updateSendAmount(newAmount));
      }}
      onAssetChange={noop}
      amount={{ value: '100' }}
      asset={{ type: AssetType.native, balance: '100' }}
    />
  </div>
);
DefaultStory.storyName = 'Default';
DefaultStory.decorators = [
  (story) => <Provider store={store}>{story()}</Provider>,
];

export const TokenStory = () => (
  <div style={{ width: '400px' }}>
    <AssetPickerAmount
      onAmountChange={(newAmount: string) =>
        store.dispatch(updateSendAmount(newAmount))
      }
      onAssetChange={noop}
      amount={{ value: '0xff' }}
      asset={{
        type: AssetType.token,
        balance: '0xfff',
        details: {
          address: '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e',
          symbol: 'YFI',
        },
      }}
    />{' '}
  </div>
);
TokenStory.storyName = 'ERC20 Token';
TokenStory.decorators = [
  (story) => <Provider store={store}>{story()}</Provider>,
];

export const FungibleTokenStory = () => (
  <div style={{ width: '400px' }}>
    <AssetPickerAmount
      onAmountChange={(newAmount: string) =>
        store.dispatch(updateSendAmount(newAmount))
      }
      onAssetChange={noop}
      amount={{ value: '0xff' }}
      asset={{
        type: AssetType.NFT,
        balance: '0xfff',
        details: {
          address: '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e',
          symbol: 'BAYC',
          isERC721: true,
          tokenId: 1,
          standard: 'ERC721',
        },
      }}
    />{' '}
  </div>
);
FungibleTokenStory.storyName = 'ERC721 Token';
FungibleTokenStory.decorators = [
  (story) => <Provider store={store}>{story()}</Provider>,
];

export const LongFungibleTokenStory = () => (
  <div style={{ width: '400px' }}>
    <AssetPickerAmount
      onAmountChange={(newAmount: string) =>
        store.dispatch(updateSendAmount(newAmount))
      }
      onAssetChange={noop}
      amount={{ value: '0xff' }}
      asset={{
        type: AssetType.NFT,
        balance: '0xfff',
        details: {
          address: '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e',
          symbol:
            'BAYCBAYCBAYCBAYCBAYCBAYCBAYC BAYCBAYCBAYCBAYCBAYCBAYCBAYCBAYCBAYC',
          isERC721: true,
          tokenId: 1,
          standard: 'ERC721',
        },
      }}
    />{' '}
  </div>
);
LongFungibleTokenStory.storyName = 'Long ERC721 Token';
LongFungibleTokenStory.decorators = [
  (story) => <Provider store={store}>{story()}</Provider>,
];

export const NFTStory = () => (
  <div style={{ width: '400px' }}>
    <AssetPickerAmount
      onAmountChange={(newAmount: string) =>
        store.dispatch(updateSendAmount(newAmount))
      }
      onAssetChange={noop}
      amount={{ value: '0xff' }}
      asset={{
        type: AssetType.NFT,
        balance: '0xfff',
        details: {
          address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
          symbol: 'BAYC',
          isERC721: false,
          tokenId: 1,
        },
      }}
    />{' '}
  </div>
);
NFTStory.storyName = 'ERC1155 Token';
NFTStory.decorators = [(story) => <Provider store={store}>{story()}</Provider>];

export const TokenStoryWithLargeNameAndValue = () => (
  <div style={{ width: '400px' }}>
    <AssetPickerAmount
      onAmountChange={(newAmount: string) =>
        store.dispatch(updateSendAmount(newAmount))
      }
      onAssetChange={noop}
      amount={{ value: '0x1ED09BEAD87C0378D8E6400000000' }}
      asset={{
        type: AssetType.token,
        balance: '0x1ED0',
        details: {
          address: '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e',
          symbol: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
          isERC721: false,
          standard: 'ERC1155',
        },
      }}
    />
  </div>
);
TokenStoryWithLargeNameAndValue.storyName =
  'ERC20 Token with large name and value';
TokenStoryWithLargeNameAndValue.decorators = [
  (story) => <Provider store={store}>{story()}</Provider>,
];

export const ErrorStory = () => (
  <div style={{ width: '400px' }}>
    <AssetPickerAmount
      onAmountChange={(newAmount: string) =>
        store.dispatch(updateSendAmount(newAmount))
      }
      onAssetChange={noop}
      amount={{ error: INSUFFICIENT_FUNDS_ERROR_KEY, value: '100' }}
      asset={{ type: AssetType.native, balance: '0' }}
    />{' '}
  </div>
);
ErrorStory.storyName = 'Error';
