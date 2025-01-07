import React from 'react';
import { Provider } from 'react-redux';
import configureStore from '../../../store/store';
import { updateSendAmount } from '../../../ducks/send';
import { AssetType } from '../../../../shared/constants/transaction';
import mockState from '../../../../test/data/mock-state.json';
import { AssetPickerAmount } from './asset-picker-amount';
import { INSUFFICIENT_FUNDS_ERROR_KEY } from '../../../helpers/constants/error-keys';
import { mockNetworkState } from '../../../../test/stub/networks';
const noop = () => { };
const storybook = {
    title: 'Components/Multichain/AssetPickerAmount',
    component: AssetPickerAmount,
};
export default storybook;
const store = configureStore({
    CurrencyController: {
        currentCurrency: 'usd'
    },
    marketData: {
        ...mockState.metamask.marketData,
        '0x1': {
            ...mockState.metamask.marketData['0x1'],
            '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e': { price: 0.01 }
        }
    },
    TokensController: {
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
        ]
    },
    PreferencesController: {
        preferences: {
            showFiatInTestnets: true,
        }
    }
});
export const DefaultStory = () => (<div>style) = {}, { width: , '400px':  };
 >
    <AssetPickerAmount>onAmountChange;
{
    (newAmount: string) => {
        store.dispatch(updateSendAmount(newAmount));
    };
}
onAssetChange = { noop };
amount = {};
{
    value: '100';
}
asset = {};
{
    type: AssetType.native, balance;
    '100';
}
/>
    < /div>;
;
DefaultStory.storyName = 'Default';
DefaultStory.decorators = [
    (story) => <Provider>store, { store } > { story(); } < /Provider>,
];
export const TokenStory = () => (<div>style) = {}, { width: , '400px':  };
 >
    <AssetPickerAmount>onAmountChange;
{
    (newAmount: string) => store.dispatch(updateSendAmount(newAmount));
}
onAssetChange = { noop };
amount = {};
{
    value: '0xff';
}
asset = {};
{
    type: AssetType.token,
        balance;
    '0xfff',
        details;
    {
        address: '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e',
            symbol;
        'YFI',
        ;
    }
}
/>{' '}
    < /div>;
;
TokenStory.storyName = 'ERC20 Token';
TokenStory.decorators = [
    (story) => <Provider>store, { store } > { story(); } < /Provider>,
];
export const FungibleTokenStory = () => (<div>style) = {}, { width: , '400px':  };
 >
    <AssetPickerAmount>onAmountChange;
{
    (newAmount: string) => store.dispatch(updateSendAmount(newAmount));
}
onAssetChange = { noop };
amount = {};
{
    value: '0xff';
}
asset = {};
{
    type: AssetType.NFT,
        balance;
    '0xfff',
        details;
    {
        address: '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e',
            symbol;
        'BAYC',
            isERC721;
        true,
            tokenId;
        1,
            standard;
        'ERC721',
        ;
    }
}
/>{' '}
    < /div>;
;
FungibleTokenStory.storyName = 'ERC721 Token';
FungibleTokenStory.decorators = [
    (story) => <Provider>store, { store } > { story(); } < /Provider>,
];
export const LongFungibleTokenStory = () => (<div>style) = {}, { width: , '400px':  };
 >
    <AssetPickerAmount>onAmountChange;
{
    (newAmount: string) => store.dispatch(updateSendAmount(newAmount));
}
onAssetChange = { noop };
amount = {};
{
    value: '0xff';
}
asset = {};
{
    type: AssetType.NFT,
        balance;
    '0xfff',
        details;
    {
        address: '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e',
            symbol;
        'BAYCBAYCBAYCBAYCBAYCBAYCBAYC BAYCBAYCBAYCBAYCBAYCBAYCBAYCBAYCBAYC',
            isERC721;
        true,
            tokenId;
        1,
            standard;
        'ERC721',
        ;
    }
}
/>{' '}
    < /div>;
;
LongFungibleTokenStory.storyName = 'Long ERC721 Token';
LongFungibleTokenStory.decorators = [
    (story) => <Provider>store, { store } > { story(); } < /Provider>,
];
export const NFTStory = () => (<div>style) = {}, { width: , '400px':  };
 >
    <AssetPickerAmount>onAmountChange;
{
    (newAmount: string) => store.dispatch(updateSendAmount(newAmount));
}
onAssetChange = { noop };
amount = {};
{
    value: '0xff';
}
asset = {};
{
    type: AssetType.NFT,
        balance;
    '0xfff',
        details;
    {
        address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
            symbol;
        'BAYC',
            isERC721;
        false,
            tokenId;
        1,
        ;
    }
}
/>{' '}
    < /div>;
;
NFTStory.storyName = 'ERC1155 Token';
NFTStory.decorators = [(story) => <Provider>store, { store } > { story(); } < /Provider>];];
export const TokenStoryWithLargeNameAndValue = () => (<div>style) = {}, { width: , '400px':  };
 >
    <AssetPickerAmount>onAmountChange;
{
    (newAmount: string) => store.dispatch(updateSendAmount(newAmount));
}
onAssetChange = { noop };
amount = {};
{
    value: '0x1ED09BEAD87C0378D8E6400000000';
}
asset = {};
{
    type: AssetType.token,
        balance;
    '0x1ED0',
        details;
    {
        address: '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e',
            symbol;
        'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
            isERC721;
        false,
            standard;
        'ERC1155',
        ;
    }
}
/>
    < /div>;
;
TokenStoryWithLargeNameAndValue.storyName =
    'ERC20 Token with large name and value';
TokenStoryWithLargeNameAndValue.decorators = [
    (story) => <Provider>store, { store } > { story(); } < /Provider>,
];
export const ErrorStory = () => (<div>style) = {}, { width: , '400px':  };
 >
    <AssetPickerAmount>onAmountChange;
{
    (newAmount: string) => store.dispatch(updateSendAmount(newAmount));
}
onAssetChange = { noop };
amount = {};
{
    error: INSUFFICIENT_FUNDS_ERROR_KEY, value;
    '100';
}
asset = {};
{
    type: AssetType.native, balance;
    '0';
}
/>{' '}
    < /div>;
;
ErrorStory.storyName = 'Error';
