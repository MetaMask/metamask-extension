import React from 'react';
import { AccountListItem } from './account-list-item';

const SampleIdentity = {
  address: '0x12C7...135f',
  name: 'Account 1',
  balance: '0x152387ad22c3f0',
};

const ChaosIdentity = {
  address: '0x12C7...135f',
  name: 'pneumonoultramicroscopicsilicovolcanoconiosis',
  balance: '0x152387ad22c3f0',
};

const noop = () => console.log('Clicked account!');

export default {
  title: 'Components/Multichain/AccountListItem',
  component: AccountListItem,
};

export const DefaultStory = () => (
  <div style={{ width: '328px', border: '1px solid #eee' }}>
    <AccountListItem identity={SampleIdentity} onClick={noop} />
  </div>
);

export const SelectedItem = () => (
  <div style={{ width: '328px', border: '1px solid #eee' }}>
    <AccountListItem identity={SampleIdentity} onClick={noop} selected />
  </div>
);

export const HardwareItem = () => (
  <div style={{ width: '328px', border: '1px solid #eee' }}>
    <AccountListItem identity={SampleIdentity} onClick={noop} label="Ledger" />
  </div>
);

export const SelectedHardwareItem = () => (
  <div style={{ width: '328px', border: '1px solid #eee' }}>
    <AccountListItem
      identity={SampleIdentity}
      onClick={noop}
      label="Ledger"
      selected
    />
  </div>
);

export const ChaosDataItem = () => (
  <div style={{ width: '328px', border: '1px solid #eee' }}>
    <AccountListItem identity={ChaosIdentity} onClick={noop} selected />
  </div>
);

export const ConnectedSiteItem = () => (
  <div style={{ width: '328px', border: '1px solid #eee' }}>
    <AccountListItem
      onClick={noop}
      identity={SampleIdentity}
      connectedAvatar="https://uniswap.org/favicon.ico"
      connectedAvatarName="Uniswap"
    />
  </div>
);

export const ConnectedSiteChaosItem = () => (
  <div style={{ width: '328px', border: '1px solid #eee' }}>
    <AccountListItem
      onClick={noop}
      identity={ChaosIdentity}
      connectedAvatar="https://uniswap.org/favicon.ico"
      connectedAvatarName="Uniswap"
    />
  </div>
);

DefaultStory.storyName = 'Default';
