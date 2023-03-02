import React from 'react';
import { AccountListItem } from './account-list-item';

const SampleIdentity = {
  address: '0x12C7...135f',
  name: 'Account 1',
  balance: '$1,234',
  tokenBalance: '32.09 ETH',
};

const ChaosIdentity = {
  address: '0x12C7...135f',
  name: 'pneumonoultramicroscopicsilicovolcanoconiosis',
  balance: '$1,234,567',
  tokenBalance: '3,299.09 ETH',
};

export default {
  title: 'Components/Redesign/AccountListItem',
  component: AccountListItem,
};

export const DefaultStory = () => (
  <div style={{ width: '328px', border: '1px solid #eee' }}>
    <AccountListItem identity={SampleIdentity} />
  </div>
);

export const SelectedItem = () => (
  <div style={{ width: '328px', border: '1px solid #eee' }}>
    <AccountListItem identity={SampleIdentity} selected />
  </div>
);

export const HardwareItem = () => (
  <div style={{ width: '328px', border: '1px solid #eee' }}>
    <AccountListItem identity={SampleIdentity} isHardware />
  </div>
);

export const SelectedHardwareItem = () => (
  <div style={{ width: '328px', border: '1px solid #eee' }}>
    <AccountListItem identity={SampleIdentity} isHardware selected />
  </div>
);

export const ChaosDataItem = () => (
  <div style={{ width: '328px', border: '1px solid #eee' }}>
    <AccountListItem identity={ChaosIdentity} selected />
  </div>
);

export const ConnectedSiteItem = () => (
  <div style={{ width: '328px', border: '1px solid #eee' }}>
    <AccountListItem
      identity={SampleIdentity}
      connectedAvatar="https://uniswap.org/favicon.ico"
    />
  </div>
);

export const ConnectedSiteChaosItem = () => (
  <div style={{ width: '328px', border: '1px solid #eee' }}>
    <AccountListItem
      identity={ChaosIdentity}
      connectedAvatar="https://uniswap.org/favicon.ico"
    />
  </div>
);

DefaultStory.storyName = 'Default';
