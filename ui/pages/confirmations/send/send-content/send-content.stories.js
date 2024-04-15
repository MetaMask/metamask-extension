import React from 'react';
import { Provider } from 'react-redux';

import mockState from '../../../../../test/data/mock-state.json';
import { AssetType } from '../../../../../shared/constants/transaction';
import configureStore from '../../../../store/store';

import SendContent from './send-content.component';

const store = configureStore({
  ...mockState,
  send: {
    currentTransactionUUID: '1-tx',
    draftTransactions: {
      '1-tx': {
        asset: {
          balance: '0x1158e460913d00000', // 20000000000000000000
          details: {
            name: 'Catnip Spicywright From The Artist Known As',
            tokenId: '1124157112415711241571124157112415711241571124157',
            address: '0x06012c8cf97bead5deae237070f9587f8e7a266d',
            image: './catnip-spicywright.png',
            imageThumbnail: 'https://www.cryptokitties.co/.../1124157',
            description:
              "Good day. My name is Catnip Spicywight, which got me teased a lot in high school. If I want to put low fat mayo all over my hamburgers, I shouldn't have to answer to anyone about it, am I right? One time I beat Arlene in an arm wrestle.",
            lastSale: {
              event_timestamp: '2023-01-18T21:51:23',
              total_price: '4900000000000000',
              payment_token: {
                symbol: 'ETH',
              },
            },
          },
          error: null,
          type: AssetType.NFT,
        },
        fromAccount: { address: '0x000000' },
      },
    },
  },
});

export default {
  title: 'Pages/Send/SendContent',

  argsTypes: {
    showHexData: {
      control: 'boolean',
    },
    isOwnedAccount: {
      control: 'boolean',
    },
    contact: {
      control: 'object',
    },
    noGasPrice: {
      control: 'boolean',
    },
    isEthGasPrice: {
      control: 'boolean',
    },

    gasIsExcessive: {
      control: 'boolean',
    },
    networkOrAccountNotSupports1559: {
      control: 'boolean',
    },
    getIsBalanceInsufficient: {
      control: 'boolean',
    },
    error: {
      control: 'text',
    },
    warning: {
      control: 'text',
    },
    to: {
      control: 'text',
    },
    assetError: {
      control: 'text',
    },
    asset: {
      control: 'object',
    },
    recipient: {
      control: 'object',
    },
  },
};

export const DefaultStory = (args) => {
  return (
    <div style={{ width: '400px' }}>
      <SendContent {...args} />
    </div>
  );
};

DefaultStory.storyName = 'Default';
DefaultStory.args = {
  showHexData: false,
  isOwnedAccount: true,
  noGasPrice: false,
  isEthGasPrice: false,
  gasIsExcessive: false,
  error: 'connecting',
  warning: 'connecting',
  asset: {
    type: 'NATIVE',
  },
  recipient: {
    mode: 'CONTACT_LIST',
    userInput: '0x31A2764925BD47CCBd57b2F277702dB46e9C5F66',
    address: '0x31A2764925BD47CCBd57b2F277702dB46e9C5F66',
    nickname: 'John Doe',
    error: null,
    warning: null,
  },
  contact: { name: 'testName' },
  networkOrAccountNotSupports1559: false,
  getIsBalanceInsufficient: false,
  to: 'string to',
  assetError: null,
};

export const NftStory = (args) => {
  return (
    <div style={{ width: '400px' }}>
      <SendContent {...args} />
    </div>
  );
};

NftStory.storyName = 'NFT';
NftStory.decorators = [(story) => <Provider store={store}>{story()}</Provider>];
NftStory.args = {
  showHexData: false,
  isOwnedAccount: true,
  noGasPrice: false,
  isEthGasPrice: false,
  gasIsExcessive: false,
  error: 'connecting',
  warning: 'connecting',
  asset: {
    type: 'NFT',
  },
  recipient: {
    mode: 'CONTACT_LIST',
    userInput: '0x31A2764925BD47CCBd57b2F277702dB46e9C5F66',
    address: '0x31A2764925BD47CCBd57b2F277702dB46e9C5F66',
    nickname: 'John Doe',
    error: null,
    warning: null,
  },
  sendAsset: {
    balance: '0x1',
    details: {
      address: '0xDc7382Eb0Bc9C352A4CbA23c909bDA01e0206414',
      tokenId: '2',
      standard: 'ERC721',
      tokenURI:
        'data:application/json;base64,eyJuYW1lIjogIlRlc3QgRGFwcCBDb2xsZWN0aWJsZXMgIzIiLCAiZGVzY3JpcHRpb24iOiAiVGVzdCBEYXBwIENvbGxlY3RpYmxlcyBmb3IgdGVzdGluZy4iLCAiaW1hZ2UiOiAiZGF0YTppbWFnZS9zdmcreG1sO2Jhc2U2NCxQSE4yWnlCb1pXbG5hSFE5SWpNMU1DSWdkMmxrZEdnOUlqTTFNQ0lnZG1sbGQwSnZlRDBpTUNBd0lERXdNQ0F4TURBaUlIaHRiRzV6UFNKb2RIUndPaTh2ZDNkM0xuY3pMbTl5Wnk4eU1EQXdMM04yWnlJK1BHUmxabk0rUEhCaGRHZ2dhV1E5SWsxNVVHRjBhQ0lnWm1sc2JEMGlibTl1WlNJZ2MzUnliMnRsUFNKeVpXUWlJR1E5SWsweE1DdzVNQ0JST1RBc09UQWdPVEFzTkRVZ1VUa3dMREV3SURVd0xERXdJRkV4TUN3eE1DQXhNQ3cwTUNCUk1UQXNOekFnTkRVc056QWdVVGN3TERjd0lEYzFMRFV3SWlBdlBqd3ZaR1ZtY3o0OGRHVjRkRDQ4ZEdWNGRGQmhkR2dnYUhKbFpqMGlJMDE1VUdGMGFDSStVWFZwWTJzZ1luSnZkMjRnWm05NElHcDFiWEJ6SUc5MlpYSWdkR2hsSUd4aGVua2daRzluTGp3dmRHVjRkRkJoZEdnK1BDOTBaWGgwUGp3dmMzWm5QZz09IiwgImF0dHJpYnV0ZXMiOiBbeyJ0cmFpdF90eXBlIjogIlRva2VuIElkIiwgInZhbHVlIjogIjIifV19',
      symbol: 'TDC',
      name: 'TestDappCollectibles',
      image:
        'data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjM1MCIgd2lkdGg9IjM1MCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdGggaWQ9Ik15UGF0aCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZWQiIGQ9Ik0xMCw5MCBROTAsOTAgOTAsNDUgUTkwLDEwIDUwLDEwIFExMCwxMCAxMCw0MCBRMTAsNzAgNDUsNzAgUTcwLDcwIDc1LDUwIiAvPjwvZGVmcz48dGV4dD48dGV4dFBhdGggaHJlZj0iI015UGF0aCI+UXVpY2sgYnJvd24gZm94IGp1bXBzIG92ZXIgdGhlIGxhenkgZG9nLjwvdGV4dFBhdGg+PC90ZXh0Pjwvc3ZnPg==',
    },
    error: null,
    type: 'NFT',
  },
  contact: { name: 'testName' },
  networkOrAccountNotSupports1559: false,
  getIsBalanceInsufficient: false,
  to: 'string to',
  assetError: null,
};
