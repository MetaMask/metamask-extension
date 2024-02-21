import React from 'react';
import { PERMISSIONS } from '../../../../helpers/constants/routes';
import { ConnectionListItem } from './connection-list-item';

export default {
  title: 'Components/Multichain/ConnectionListItem',
  component: ConnectionListItem,
  argTypes: {
    connection: {
      control: 'object',
    },
    onClick: {
      control: 'function',
      action: 'clicked',
    },
  },
  args: {
    connection: {
      extensionId: null,
      iconUrl: 'https://portfolio.metamask.io/favicon.png',
      name: 'MetaMask Portfolio',
      origin: 'https://portfolio.metamask.io',
      subjectType: 'website',
      addresses: ['0xTestAddress1', '0xTestAddress2'],
    },
    onClick: () => console.log('clicked'),
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
  connection: {
    extensionId: null,
    iconUrl: 'https://portfolio.metamask.io/favicon.png',
    name: 'Connect'.repeat(100),
    origin: 'https://portfolio.metamask.io',
    subjectType: 'website',
    addresses: [
      '0xaaaF07C80ce267F3132cE7e6048B66E6E669365B',
      '0xbbbD671F1Fcc94bCF0ebC6Ec4790Da35E8d5e1E1',
      '0xcccF07C80ce267F3132cE7e6048B66E6E669365B',
      '0xdddD671F1Fcc94bCF0ebC6Ec4790Da35E8d5e1E1',
      '0xeeeF07C80ce267F3132cE7e6048B66E6E669365B',
      '0xfffD671F1Fcc94bCF0ebC6Ec4790Da35E8d5e1E1',
      '0x999F07C80ce267F3132cE7e6048B66E6E669365B',
      '0x888D671F1Fcc94bCF0ebC6Ec4790Da35E8d5e1E1',
      '0x777F07C80ce267F3132cE7e6048B66E6E669365B',
      '0x666D671F1Fcc94bCF0ebC6Ec4790Da35E8d5e1E1',
    ],
  },
  onClick: () => {
    console.log(
      `${PERMISSIONS}/${encodeURIComponent(ChaosStory.args.connection.origin)}`,
    );
  },
};

export const SnapStory = (args) => (
  <div
    style={{ width: '350px', border: '1px solid var(--color-border-muted)' }}
  >
    <ConnectionListItem {...args} />
  </div>
);
SnapStory.args = {
  connection: {
    extensionId: null,
    iconUrl: 'https://portfolio.metamask.io/favicon.png',
    name: 'Connect'.repeat(100),
    packageName: '@metamask/storybooksnap',
    subjectType: 'snap',
    addresses: ['OxTestAddress1', 'OxTestAddress2'],
  },
  onClick: () =>
    console.log(
      `${PERMISSIONS}/${encodeURIComponent(SnapStory.args.connection.origin)}`,
    ),
};
