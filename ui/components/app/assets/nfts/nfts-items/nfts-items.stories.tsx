import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import NftsItems from './nfts-items.js';

export default {
  title: 'UI/Components/App/Assets/NFTs/NftsItems',
  component: NftsItems,
  argTypes: {
    collections: { control: 'object' },
    previouslyOwnedCollection: { control: 'object' },
    isModal: { control: 'boolean' },
    onCloseModal: { action: 'onCloseModal' },
    showTokenId: { control: 'boolean' },
    displayPreviouslyOwnedCollection: { control: 'boolean' },
  },
} as Meta<typeof NftsItems>;

const Template: StoryFn<typeof NftsItems> = (args) => <NftsItems {...args} />;

export const Default = Template.bind({});
Default.args = {
  collections: {
    collection1: {
      nfts: [
        {
          address: '0x123',
          tokenId: '1',
          name: 'NFT 1',
          image: 'https://example.com/nft1.png',
        },
        {
          address: '0x123',
          tokenId: '2',
          name: 'NFT 2',
          image: 'https://example.com/nft2.png',
        },
      ],
      collectionName: 'Collection 1',
      collectionImage: 'https://example.com/collection1.png',
    },
    '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4': {
      nfts: [
        {
          address: '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4',
          tokenId: '1',
          name: 'Special NFT 1',
          image: 'https://example.com/special-nft1.png',
        },
        {
          address: '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4',
          tokenId: '2',
          name: 'Special NFT 2',
          image: 'https://example.com/special-nft2.png',
        },
      ],
      collectionName: 'Special Collection',
      collectionImage: 'https://example.com/special-collection.png',
    },
  },
  previouslyOwnedCollection: {
    nfts: [
      {
        address: '0x456',
        tokenId: '3',
        name: 'Previously Owned NFT',
        image: 'https://example.com/nft3.png',
      },
    ],
    collectionName: 'Previously Owned',
    collectionImage: 'https://example.com/previously-owned.png',
  },
  isModal: false,
  showTokenId: true,
  displayPreviouslyOwnedCollection: true,
};
