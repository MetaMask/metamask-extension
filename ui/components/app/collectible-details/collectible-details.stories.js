import React from 'react';
import CollectibleDetails from './collectible-details';

export default {
  title: 'Collectibles Detail',
  id: __filename,
};

export const basic = () => {
  const collectible = {
    name: 'Catnip Spicywright',
    tokenId: '1124157',
    address: '0x06012c8cf97bead5deae237070f9587f8e7a266d',
    image: './images/catnip-spicywright.png',
    description:
      "Good day. My name is Catnip Spicywight, which got me teased a lot in high school. If I want to put low fat mayo all over my hamburgers, I shouldn't have to answer to anyone about it, am I right? One time I beat Arlene in an arm wrestle.",
  };
  return (
    <div style={{ width: '420px' }}>
      <CollectibleDetails collectible={collectible} />
    </div>
  );
};
