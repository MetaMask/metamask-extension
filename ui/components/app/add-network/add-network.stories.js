import React from 'react';
import AddNetwork from './add-network';

const MATIC_TOKEN_IMAGE_URL = './images/matic-token.png';
const ARBITRUM_IMAGE_URL = './images/arbitrum.svg';
const OPTIMISM_IMAGE_URL = './images/optimism.svg';
const AVALANCHE_IMAGE_URL = './images/avax-token.png';
const PALM_IMAGE_URL = './images/palm.svg';
const BSC_IMAGE_URL = './images/bsc-filled.svg';

export default {
  title: 'Components/App/AddNetwork',
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
        chainId: '42161',
        nickname: 'Arbitrum One',
        rpcUrl: 'https://arbitrum-mainnet.infura.io/v3/{INFURA_API_KEY}',
        ticker: 'AETH',
        rpcPrefs: {
          blockExplorerUrl: 'https://explorer.arbitrum.io',
          imageUrl: ARBITRUM_IMAGE_URL,
        },
      },
      {
        chainId: '43114',
        nickname: 'Avalanche Mainnet C-Chain',
        rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
        ticker: 'AVAX',
        rpcPrefs: {
          blockExplorerUrl: 'https://snowtrace.io/',
          imageUrl: AVALANCHE_IMAGE_URL,
        },
      },
      {
        chainId: '56',
        nickname: 'BNB Smart Chain',
        rpcUrl: 'https://bsc-dataseed.binance.org/',
        ticker: 'BNB',
        rpcPrefs: {
          blockExplorerUrl: 'https://bscscan.com/',
          imageUrl: BSC_IMAGE_URL,
        },
      },
      {
        chainId: '250',
        nickname: 'Fantom Opera',
        rpcUrl: 'https://rpc.ftm.tools/',
        ticker: 'FTM',
        rpcPrefs: {
          blockExplorerUrl: 'https://ftmscan.com/',
          imageUrl: '',
        },
      },
      {
        chainId: '1666600000',
        nickname: 'Harmony Mainnet Shard 0',
        rpcUrl: 'https://api.harmony.one/',
        ticker: 'ONE',
        rpcPrefs: {
          blockExplorerUrl: 'https://explorer.harmony.one/',
          imageUrl: '',
        },
      },
      {
        chainId: '10',
        nickname: 'Optimism',
        rpcUrl: 'https://optimism-mainnet.infura.io/v3/{INFURA_API_KEY}',
        ticker: 'KOR',
        rpcPrefs: {
          blockExplorerUrl: 'https://optimistic.etherscan.io/',
          imageUrl: OPTIMISM_IMAGE_URL,
        },
      },
      {
        chainId: '137',
        nickname: 'Polygon Mainnet',
        rpcUrl: 'https://polygon-mainnet.infura.io/v3/{INFURA_API_KEY}',
        ticker: 'MATIC',
        rpcPrefs: {
          blockExplorerUrl: 'https://polygonscan.com/',
          imageUrl: MATIC_TOKEN_IMAGE_URL,
        },
      },
      {
        chainId: '11297108109',
        nickname: 'Palm',
        rpcUrl: 'https://palm-mainnet.infura.io/v3/{INFURA_API_KEY}',
        ticker: 'PALM',
        rpcPrefs: {
          blockExplorerUrl: 'https://explorer.palm.io/',
          imageUrl: PALM_IMAGE_URL,
        },
      },
    ],
  },
};

export const DefaultStory = (args) => <AddNetwork {...args} />;

DefaultStory.storyName = 'Default';
