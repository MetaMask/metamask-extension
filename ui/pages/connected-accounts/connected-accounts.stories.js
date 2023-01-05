import React from 'react';
import { action } from '@storybook/addon-actions';
import ConnectedAccounts from './connected-accounts.component';

export default {
  title: 'Pages/ConnectedAccounts',
};

const account = [
  {
    name: 'Account 1',
    address: '0x983211ce699ea5ab57cc528086154b6db1ad8e55',
  },
];
const identities = {
  name: 'Account 1',
  address: '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4',
};
export const DefaultStory = () => {
  return (
    <ConnectedAccounts
      connectedAccounts={account}
      activeTabOrigin="https://metamask.github.io"
      accountToConnect={identities}
      connectAccount={action('Account Connected')}
      removePermittedAccount={action('Account Removed')}
      setSelectedAddress={action('Selected Address Changed')}
    />
  );
};

DefaultStory.storyName = 'Default';
