import React from 'react';
import { PERMISSIONS } from '../../../../helpers/constants/routes';
import { ETH_TOKEN_IMAGE_URL } from '../../../../../shared/constants/network';
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
      addresses: [
        '0xaaaF07C80ce267F3132cE7e6048B66E6E669365B',
        '0xbbbD671F1Fcc94bCF0ebC6Ec4790Da35E8d5e1E1',
      ],
      addressToNameMap: {
        '0xaaaF07C80ce267F3132cE7e6048B66E6E669365B': 'TestAddress1',
        '0xbbbD671F1Fcc94bCF0ebC6Ec4790Da35E8d5e1E1': 'TestAddress2',
      },
      networkIconUrl: ETH_TOKEN_IMAGE_URL,
      networkName: 'Test Dapp Network',
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
    addressToNameMap: {
      '0xaaaF07C80ce267F3132cE7e6048B66E6E669365B': 'TestAddress1',
      '0xbbbD671F1Fcc94bCF0ebC6Ec4790Da35E8d5e1E1': 'TestAddress2',
      '0xcccF07C80ce267F3132cE7e6048B66E6E669365B': 'TestAddress3',
      '0xdddD671F1Fcc94bCF0ebC6Ec4790Da35E8d5e1E1': 'TestAddress4',
      '0xeeeF07C80ce267F3132cE7e6048B66E6E669365B': 'TestAddress5',
      '0xfffD671F1Fcc94bCF0ebC6Ec4790Da35E8d5e1E1': 'TestAddress6',
      '0x999F07C80ce267F3132cE7e6048B66E6E669365B': 'TestAddress7',
      '0x888D671F1Fcc94bCF0ebC6Ec4790Da35E8d5e1E1': 'TestAddress8',
      '0x777F07C80ce267F3132cE7e6048B66E6E669365B': 'TestAddress9',
      '0x666D671F1Fcc94bCF0ebC6Ec4790Da35E8d5e1E1': 'TestAddress10',
    },
    networkIconUrl: ETH_TOKEN_IMAGE_URL,
    networkName: 'Test Dapp Network',
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
    addresses: [
      '0xaaaF07C80ce267F3132cE7e6048B66E6E669365B',
      '0xbbbD671F1Fcc94bCF0ebC6Ec4790Da35E8d5e1E1',
    ],
    addressToNameMap: {
      '0xaaaF07C80ce267F3132cE7e6048B66E6E669365B': 'TestAddress1',
      '0xbbbD671F1Fcc94bCF0ebC6Ec4790Da35E8d5e1E1': 'TestAddress2',
    },
  },
  onClick: () =>
    console.log(
      `${PERMISSIONS}/${encodeURIComponent(SnapStory.args.connection.origin)}`,
    ),
};
