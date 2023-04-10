import React from 'react';

import { Provider } from 'react-redux';

import testData from '../../../../.storybook/test-data';
import configureStore from '../../../store/store';
import { AccountListItem } from '.';

const store = configureStore(testData);

const [chaosAddress, simpleAddress, hardwareAddress] = Object.keys(
  testData.metamask.identities,
);

const SIMPLE_IDENTITY = {
  ...testData.metamask.identities[simpleAddress],
  balance: '0x152387ad22c3f0',
};

const HARDWARE_IDENTITY = {
  ...testData.metamask.identities[hardwareAddress],
  balance: '0x152387ad22c3f0',
};

const CHAOS_IDENTITY = {
  ...testData.metamask.identities[chaosAddress],
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
  },
  args: {
    identity: SIMPLE_IDENTITY,
    onClick,
  },
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
HardwareItem.args = { identity: HARDWARE_IDENTITY };
HardwareItem.decorators = [
  (story) => <Provider store={store}>{story()}</Provider>,
];

export const SelectedHardwareItem = (args) => (
  <div {...CONTAINER_STYLES}>
    <AccountListItem {...args} />
  </div>
);
SelectedHardwareItem.args = { identity: HARDWARE_IDENTITY, selected: true };
SelectedHardwareItem.decorators = [
  (story) => <Provider store={store}>{story()}</Provider>,
];

export const ChaosDataItem = (args) => (
  <div {...CONTAINER_STYLES}>
    <AccountListItem {...args} />
  </div>
);
ChaosDataItem.args = { identity: CHAOS_IDENTITY };

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
  identity: CHAOS_IDENTITY,
  connectedAvatar: 'https://uniswap.org/favicon.ico',
  connectedAvatarName: 'Uniswap',
};

DefaultStory.storyName = 'Default';
