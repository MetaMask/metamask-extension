import React from 'react';
import { AccountListItemMenu } from './account-list-item-menu';

const SampleIdentity = {
  address: '0x12C7...135f',
  name: 'Account 1',
  balance: '$1,234',
  tokenBalance: '32.09 ETH',
};

export default {
  title: 'Components/Redesign/AccountListItemMenu',
  component: AccountListItemMenu,
};

export const DefaultStory = () => (
  <AccountListItemMenu
    anchorElement={null}
    identity={SampleIdentity}
    isRemovable
    blockExplorerUrlSubTitle="etherscan.io"
    onClose={() => {}}
  />
);
