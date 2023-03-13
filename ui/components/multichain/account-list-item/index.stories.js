import React from 'react';

import { Provider } from 'react-redux';

import testData from '../../../../.storybook/test-data';
import configureStore from '../../../store/store';
import { AccountListItem } from '.';

const store = configureStore(testData);

const [chaosAddress, simpleAddress, hardwareAddress] = Object.keys(
  testData.metamask.identities,
);

const SimpleIdentity = {
  ...testData.metamask.identities[simpleAddress],
  balance: '0x152387ad22c3f0',
};

const HardwareIdentity = {
  ...testData.metamask.identities[hardwareAddress],
  balance: '0x152387ad22c3f0',
};

const ChaosIdentity = {
  ...testData.metamask.identities[chaosAddress],
  balance: '0x152387ad22c3f0',
};

console.log(SimpleIdentity, HardwareIdentity, ChaosIdentity);

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
    identity: SimpleIdentity,
    onClick,
  },
};

export const DefaultStory = (args) => (
  <div
    style={{ width: '328px', border: '1px solid var(--color-border-muted)' }}
  >
    <AccountListItem {...args} />
  </div>
);

export const SelectedItem = (args) => (
  <div
    style={{ width: '328px', border: '1px solid var(--color-border-muted)' }}
  >
    <AccountListItem {...args} selected />
  </div>
);

export const HardwareItem = (args) => (
  <div
    style={{ width: '328px', border: '1px solid var(--color-border-muted)' }}
  >
    <AccountListItem {...args} identity={HardwareIdentity} />
  </div>
);
HardwareItem.decorators = [
  (story) => <Provider store={store}>{story()}</Provider>,
];

export const SelectedHardwareItem = (args) => (
  <div
    style={{ width: '328px', border: '1px solid var(--color-border-muted)' }}
  >
    <AccountListItem {...args} identity={HardwareIdentity} selected />
  </div>
);
HardwareItem.decorators = [
  (story) => <Provider store={store}>{story()}</Provider>,
];

export const ChaosDataItem = (args) => (
  <div
    style={{ width: '328px', border: '1px solid var(--color-border-muted)' }}
  >
    <AccountListItem {...args} identity={ChaosIdentity} />
  </div>
);

export const ConnectedSiteItem = (args) => (
  <div
    style={{ width: '328px', border: '1px solid var(--color-border-muted)' }}
  >
    <AccountListItem
      {...args}
      connectedAvatar="https://uniswap.org/favicon.ico"
      connectedAvatarName="Uniswap"
    />
  </div>
);

export const ConnectedSiteChaosItem = (args) => (
  <div
    style={{ width: '328px', border: '1px solid var(--color-border-muted)' }}
  >
    <AccountListItem
      {...args}
      identity={ChaosIdentity}
      connectedAvatar="https://uniswap.org/favicon.ico"
      connectedAvatarName="Uniswap"
    />
  </div>
);

DefaultStory.storyName = 'Default';
