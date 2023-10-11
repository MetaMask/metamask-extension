import React from 'react';
import { ConnectionListItem } from './connection-list-item';

export default {
  title: 'Components/Multichain/ConnectionListItem',
  component: ConnectionListItem,
  argTypes: {
    key: {
      control: 'text',
    },
    connection: {
      control: 'object',
    },
  },
  args: {
    key: 'TestKey',
    connection: {
      extensionId: null,
      iconUrl: 'https://portfolio.metamask.io/favicon.png',
      name: 'MetaMask Portfolio',
      origin: 'https://portfolio.metamask.io',
      subjectType: 'website',
      addresses: ['0xTestAddress1', '0xTestAddress2'],
    },
  },
};

export const DefaultStory = (args) => (
  <div
    style={{ width: '350px', border: '1px solid var(--color-border-muted)' }}
  >
    <ConnectionListItem {...args} />
  </div>
);

DefaultStory.storyName = 'Default';

export const ChaosStory = (args) => (
  <div
    style={{ width: '350px', border: '1px solid var(--color-border-muted)' }}
  >
    <ConnectionListItem {...args} />
  </div>
);
ChaosStory.args = {
  key: 'TestKey',
  connection: {
    extensionId: null,
    iconUrl: 'https://portfolio.metamask.io/favicon.png',
    name: 'Connect'.repeat(100),
    origin: 'https://portfolio.metamask.io',
    subjectType: 'website',
    addresses: ['OxTestAddress1', 'OxTestAddress2'],
  },
};
