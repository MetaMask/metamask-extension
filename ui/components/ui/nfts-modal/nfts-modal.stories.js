import React, { useState } from 'react';
import Button from '../button';
import Box from '../box';
import NftsModal from './nfts-modal';

const collections = {
  '0xce0772Bbcd38c66440b7264702da2b17aCDb1468': {
    collectibles: [
      {
        address: '0xce0772Bbcd38c66440b7264702da2b17aCDb1468',
        description: 'Test Dapp Collectibles for testing.',
        favorite: false,
        image:
          'data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjM1MCIgd2lkdGg9IjM1MCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdGggaWQ9Ik15UGF0aCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZWQiIGQ9Ik0xMCw5MCBROTAsOTAgOTAsNDUgUTkwLDEwIDUwLDEwIFExMCwxMCAxMCw0MCBRMTAsNzAgNDUsNzAgUTcwLDcwIDc1LDUwIiAvPjwvZGVmcz48dGV4dD48dGV4dFBhdGggaHJlZj0iI015UGF0aCI+UXVpY2sgYnJvd24gZm94IGp1bXBzIG92ZXIgdGhlIGxhenkgZG9nLjwvdGV4dFBhdGg+PC90ZXh0Pjwvc3ZnPg==',
        isCurrentlyOwned: true,
        name: 'Test Dapp Collectibles #1',
        standard: 'ERC721',
        tokenId: '1',
      },
      {
        address: '0xce0772Bbcd38c66440b7264702da2b17aCDb1468',
        description: 'Test Dapp Collectibles for testing.',
        favorite: false,
        image:
          'data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjM1MCIgd2lkdGg9IjM1MCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdGggaWQ9Ik15UGF0aCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZWQiIGQ9Ik0xMCw5MCBROTAsOTAgOTAsNDUgUTkwLDEwIDUwLDEwIFExMCwxMCAxMCw0MCBRMTAsNzAgNDUsNzAgUTcwLDcwIDc1LDUwIiAvPjwvZGVmcz48dGV4dD48dGV4dFBhdGggaHJlZj0iI015UGF0aCI+UXVpY2sgYnJvd24gZm94IGp1bXBzIG92ZXIgdGhlIGxhenkgZG9nLjwvdGV4dFBhdGg+PC90ZXh0Pjwvc3ZnPg==',
        isCurrentlyOwned: true,
        name: 'Test Dapp Collectibles #2',
        standard: 'ERC721',
        tokenId: '2',
      },
    ],
    collectionImage: undefined,
    collectionName: 'TestDappCollectibles',
  },
  '0xf5de760f2e916647fd766B4AD9E85ff943cE3A2b': {
    collectibles: [
      {
        address: '0xf5de760f2e916647fd766B4AD9E85ff943cE3A2b',
        description: 'A test NFT dispensed from faucet.paradigm.xyz.',
        favorite: false,
        image:
          'https://ipfs.io/ipfs/bafybeifvwitulq6elvka2hoqhwixfhgb42l4aiukmtrw335osetikviuuu',
        isCurrentlyOwned: true,
        name: 'MultiFaucet Test NFT',
        standard: 'ERC721',
        tokenId: '1383367',
      },
    ],
    collectionImage: undefined,
    collectionName: 'MultiFaucet NFT',
  },
};

export default {
  title: 'Components/UI/NftsModal',
  id: __filename,
  argTypes: {
    collections: { control: 'object' },
    senderAddress: { control: 'text' },
    accountName: { control: 'text' },
    assetName: { control: 'text' },
    total: { control: 'number' },
    isSetApproveForAll: { control: 'boolean' },
    onClose: { action: 'onClose' },
  },
  args: {
    collections,
    senderAddress: '0xcF2dBaB1176aF6F261d19092E1Ea7710868dC59E',
    accountName: 'Account 1',
    assetName: 'TestDappCollectibles',
    total: 6,
    isSetApproveForAll: false,
  },
};

export const DefaultStory = (args) => {
  const [isShowingNftsModal, setIsShowingNftsModal] = useState(false);
  return (
    <Box>
      <Button
        style={{ width: 'auto' }}
        onClick={() => setIsShowingNftsModal(true)}
      >
        Show modal
      </Button>
      {isShowingNftsModal && (
        <NftsModal {...args} onClose={() => setIsShowingNftsModal(false)} />
      )}
    </Box>
  );
};

DefaultStory.storyName = 'Default';
