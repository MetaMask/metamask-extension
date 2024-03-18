import React from 'react';

import { Provider } from 'react-redux';

import testData from '../../../../.storybook/test-data';
import configureStore from '../../../store/store';
import { Checkbox } from '../../component-library';
import { AccountListItem, AccountListItemMenuTypes } from '.';

const store = configureStore(testData);

const [chaosId, simpleId, hardwareId] = Object.keys(
  testData.metamask.internalAccounts.accounts,
);

const SIMPLE_ACCOUNT = {
  ...testData.metamask.internalAccounts.accounts[simpleId],
  balance: '0x152387ad22c3f0',
  metadata: {
    ...testData.metamask.internalAccounts.accounts[simpleId].metadata,
    keyring: {
      type: 'HD Key Tree',
    },
  },
  label: 'Simple Account 1',
  keyring: {
    type: 'HD Key Tree',
  },
};

const HARDWARE_ACCOUNT = {
  ...testData.metamask.internalAccounts.accounts[hardwareId],
  metadata: {
    ...testData.metamask.internalAccounts.accounts[hardwareId].metadata,
    keyring: {
      type: 'Ledger Hardware',
    },
  },
  label: 'Ledger Account 1',
  keyring: {
    type: 'Ledger Hardware',
  },
  balance: '0x152387ad22c3f0',
};

const CHAOS_ACCOUNT = {
  ...testData.metamask.internalAccounts.accounts[chaosId],
  label: 'Chaos Account 1',
  keyring: {
    type: 'Simple Key Pair',
  },
  balance: '0x152387ad22c3f0',
};

const SNAP_IDENTITY = {
  ...testData.metamask.internalAccounts.accounts[
    '784225f4-d30b-4e77-a900-c8bbce735b88'
  ],
  metadata: {
    name: 'Snap Account 1',
    keyring: {
      type: 'Snap Keyring',
      name: 'snap-name',
    },
    snap: {
      name: 'Test Snap Name',
      id: 'snap-id',
      enabled: true,
    },
  },
  label: 'Snap Account 1',
  keyring: {
    type: 'Snap Keyring',
  },
  balance: '0x152387ad22c3f0',
};

const CONTAINER_STYLES = {
  style: {
    width: '328px',
    border: '1px solid var(--color-border-muted)',
  },
};

const onClick = () => console.log('Clicked account!');

export default {
  title: 'Components/Multichain/AccountListItem',
  component: AccountListItem,
  argTypes: {
    identity: {
      control: 'object',
    },
    selected: {
      control: 'boolean',
    },
    onClick: {
      action: 'onClick',
    },
    closeMenu: {
      action: 'closeMenu',
    },
    connectedAvatar: {
      control: 'text',
    },
    connectedAvatarName: {
      control: 'text',
    },
    menuType: {
      control: 'text',
    },
  },
  args: {
    identity: SIMPLE_ACCOUNT,
    onClick,
    menuType: AccountListItemMenuTypes.Account,
  },
  decorators: [(story) => <Provider store={store}>{story()}</Provider>],
};

export const DefaultStory = (args) => (
  <div {...CONTAINER_STYLES}>
    <AccountListItem {...args} />
  </div>
);

export const SelectedItem = (args) => (
  <div {...CONTAINER_STYLES}>
    <AccountListItem {...args} />
  </div>
);
SelectedItem.args = { selected: true };

export const HardwareItem = (args) => (
  <div {...CONTAINER_STYLES}>
    <AccountListItem {...args} />
  </div>
);
HardwareItem.args = { identity: HARDWARE_ACCOUNT };
HardwareItem.decorators = [
  (story) => <Provider store={store}>{story()}</Provider>,
];

export const SelectedHardwareItem = (args) => (
  <div {...CONTAINER_STYLES}>
    <AccountListItem {...args} />
  </div>
);
SelectedHardwareItem.args = { identity: HARDWARE_ACCOUNT, selected: true };
SelectedHardwareItem.decorators = [
  (story) => <Provider store={store}>{story()}</Provider>,
];

export const ChaosDataItem = (args) => (
  <div {...CONTAINER_STYLES}>
    <AccountListItem {...args} />
  </div>
);
ChaosDataItem.args = { identity: CHAOS_ACCOUNT };

export const ConnectedSiteItem = (args) => (
  <div {...CONTAINER_STYLES}>
    <AccountListItem {...args} />
  </div>
);
ConnectedSiteItem.args = {
  connectedAvatar: 'https://uniswap.org/favicon.ico',
  connectedAvatarName: 'Uniswap',
};

export const ConnectedSiteChaosItem = (args) => (
  <div {...CONTAINER_STYLES}>
    <AccountListItem {...args} />
  </div>
);
ConnectedSiteChaosItem.args = {
  identity: CHAOS_ACCOUNT,
  connectedAvatar: 'https://uniswap.org/favicon.ico',
  connectedAvatarName: 'Uniswap',
};

export const ChaosStartAccessoryDataItem = (args) => (
  <div {...CONTAINER_STYLES}>
    <AccountListItem {...args} />
  </div>
);
ChaosStartAccessoryDataItem.args = {
  identity: CHAOS_ACCOUNT,
  startAccessory: <Checkbox />,
};

export const SnapItem = (args) => (
  <div {...CONTAINER_STYLES}>
    <AccountListItem {...args} />
  </div>
);
SnapItem.args = { identity: SNAP_IDENTITY };
SnapItem.decorators = [(story) => <Provider store={store}>{story()}</Provider>];

DefaultStory.storyName = 'Default';
