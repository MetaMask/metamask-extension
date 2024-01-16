import React from 'react';
import { action } from '@storybook/addon-actions';
import ConnectedAccounts from './connected-accounts.component';

export default {
  title: 'Pages/ConnectedAccounts',
};

const subjectMetadata = {
  'https://snaps.metamask.io/': {
    extensionId: null,
    iconUrl: null,
    name: 'Starknet',
    origin: 'npm:@consensys/starknet-snap',
    subjectType: 'snap',
    svgIcon: '<svg>...</svg>',
  },
  'local:http://localhost:8080/': {
    extensionId: null,
    iconUrl: null,
    name: 'MetaMask Example Snap',
    origin: 'local:http://localhost:8080/',
    subjectType: 'snap',
    svgIcon: '<svg>...</svg>',
    version: '0.6.0',
  },
};

const permissionSubjects = {
  origin: 'https://snaps.metamask.io',
  permissions: {
    wallet_snap: {
      caveats: [
        {
          type: 'snapIds',
          value: {
            'npm:@consensys/starknet-snap': {
              version: '2.1.0',
            },
            'npm:@pianity/arsnap': {
              version: '0.2.2',
            },
            'npm:tezos-metamask-snap': {
              version: '1.0.1',
            },
          },
        },
      ],
      date: 1695297309455,
      id: 'rbS-Jp76heHR4y3Y1OUFQ',
      invoker: 'https://snaps.metamask.io',
      parentCapability: 'wallet_snap',
    },
  },
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
      originOfActiveTab="https://snaps.metamask.io/"
      subjectMetadata={subjectMetadata}
      permissionSubjects={permissionSubjects}
    />
  );
};

DefaultStory.storyName = 'Default';
