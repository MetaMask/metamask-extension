import React from 'react';
import AddNetwork from '.';

const MATIC_TOKEN_IMAGE_URL = './images/matic-token.png';
const ARBITRUM_IMAGE_URL = './images/arbitrum.svg';
const OPTIMISM_IMAGE_URL = './images/optimism.svg';

export default {
  title: 'Components/APP/AddNetwork',
  id: __filename,
  argTypes: {
    onBackClick: {
      action: 'onBackClick',
    },
    onAddNetworkClick: {
      action: 'onAddNetworkClick',
    },
    onAddNetworkManuallyClick: {
      action: 'onAddNetworkManuallyClick',
    },
    featuredRPCS: {
      control: 'array',
    },
  },
  args: {
    featuredRPCS: [
      {
        chainId: '0x89',
        nickname: 'Polygon Mumbai',
        rpcUrl:
          'https://polygon-mainnet.infura.io/v3/2b6d4a83d89a438eb1b5d036788ab29c',
        ticker: 'MATIC',
        rpcPrefs: {
          blockExplorerUrl: 'https://mumbai.polygonscan.com/',
          imageUrl: MATIC_TOKEN_IMAGE_URL,
        },
      },
      {
        chainId: '0x99',
        nickname: 'Optimism Testnet ',
        rpcUrl:
          'https://optimism-kovan.infura.io/v3/2b6d4a83d89a438eb1b5d036788ab29c',
        ticker: 'KOR',
        rpcPrefs: {
          blockExplorerUrl: 'https://kovan-optimistic.etherscan.io/',
          imageUrl: OPTIMISM_IMAGE_URL,
        },
      },
      {
        chainId: '0x66eeb',
        nickname: 'Arbitrum Testnet',
        rpcUrl:
          'https://arbitrum-rinkeby.infura.io/v3/2b6d4a83d89a438eb1b5d036788ab29c',
        ticker: 'ARETH',
        rpcPrefs: {
          blockExplorerUrl: 'https://testnet.arbiscan.io/',
          imageUrl: ARBITRUM_IMAGE_URL,
        },
      },
    ],
  },
};

export const DefaultStory = (args) => <AddNetwork {...args} />;

DefaultStory.storyName = 'Default';
