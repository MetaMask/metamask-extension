import React from 'react';
import CollectiblesDetail from '.';

export default {
  title: 'Collectibles Detail',
  id: __filename,
};

export const basic = () => {
  const collectible = {
    name: 'Catnip Spicywright',
    tokenID: '1124157',
    address: '0x0601...266d',
    imageURL: './images/catnip-spicywright.png',
    description:
      "Good day. My name is Catnip Spicywight, which got me teased a lot in high school. If I want to put low fat mayo all over my hamburgers, I shouldn't have to answer to anyone about it, am I right? One time I beat Arlene in an arm wrestle.",
    lastSold: '04/10/2019',
    lastPriceSold: '$0.01',
    link: 'https://cryptokitties.com/foobar',
    onSendNFT: () => {
      console.log('sending');
    },
  };
  return (
    <div style={{ width: '420px' }}>
      <CollectiblesDetail {...collectible} />
    </div>
  );
};
