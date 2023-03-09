import React from 'react';
import NftDetails from './nft-details';

const nft = {
  name: 'Catnip Spicywright',
  tokenId: '1124157',
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
};

export default {
  title: 'Components/App/NftsDetail',

  argTypes: {
    nft: {
      control: 'object',
    },
  },
  args: {
    nft,
  },
};

export const DefaultStory = (args) => {
  return <NftDetails {...args} />;
};

DefaultStory.storyName = 'Default';

export const NoImage = (args) => {
  return <NftDetails {...args} />;
};

NoImage.args = {
  nft: {
    ...nft,
    image: undefined,
  },
};
