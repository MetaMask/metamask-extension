import React from 'react';
import { AccountListItemMenu } from './account-list-item-menu';

const SampleIdentity = {
  address: '0x12C7...135f',
  name: 'Account 1',
  balance: '0x152387ad22c3f0',
  tokenBalance: '32.09 ETH',
};

export default {
  title: 'Components/Multichain/AccountListItemMenu',
  component: AccountListItemMenu,
};

export const DefaultStory = () => (
  <AccountListItemMenu
    anchorElement={null}
    identity={SampleIdentity}
    isRemovable
    blockExplorerUrlSubTitle="etherscan.io"
    onClose={() => console.log(`Closed menu for ${SampleIdentity.address}`)}
  />
);
