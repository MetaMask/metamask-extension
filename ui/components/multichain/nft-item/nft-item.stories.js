import React from 'react';
import { NftItem } from '.';

export default {
  title: 'Components/Multichain/NftItem',
  argTypes: {
    alt: {
      control: 'text',
    },
    name: {
      control: 'text',
    },
    src: {
      control: 'text',
    },
    networkName: {
      control: 'text',
    },
    networkSrc: {
      control: 'text',
    },
    tokenId: {
      control: 'text',
    },
    onClick: {
      action: 'onClick',
    },
  },
  args: {
    alt: 'Join Archer and his 6,969 frens as they take a trip further down the rabbit hole in search of a world with vibrant art, great vibes, and psychedelic tales.',
    name: 'Monkey Trip #2422',
    src: 'https://i.seadn.io/gcs/files/878e670c38e0f02e58bf730c51c30d0c.jpg',
    networkName: 'Ethereum Mainnet',
    networkSrc: './images/eth_logo.png',
    tokenId: '2422',
  },
};

export const DefaultStory = (args) => <NftItem {...args} />;

DefaultStory.storyName = 'Default';
