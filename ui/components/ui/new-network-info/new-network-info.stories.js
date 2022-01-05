import React from 'react';
import NewNetworkInfo from '.';

export default {
  title: 'Components/UI/NewNetworkInfo',
  id: __filename,
};

export const DefaultStory = () => {

  const featuredRPC =   {
    chainId: '0x89',
    nickname: 'Polygon Mumbai',
    rpcUrl:
      'https://polygon-mainnet.infura.io/v3/2b6d4a83d89a438eb1b5d036788ab29c',
    ticker: 'MATIC',
    rpcPrefs: {
      blockExplorerUrl: 'https://mumbai.polygonscan.com/',
      imageUrl: './images/matic-token.png',
    },
  }


  return <NewNetworkInfo featuredRPC={featuredRPC} />;
};

DefaultStory.storyName = 'Default';
