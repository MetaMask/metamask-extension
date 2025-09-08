import React from 'react';
import { Provider } from 'react-redux';
import { PERMISSIONS } from '../../../../helpers/constants/routes';
import configureStore from '../../../../store/store';
import { ETH_TOKEN_IMAGE_URL } from '../../../../../shared/constants/network';
import mockState from '../../../../../test/data/mock-state.json';
import { ConnectionListItem } from './connection-list-item';

const store = configureStore(mockState);

export default {
  title: 'Components/Multichain/ConnectionListItem',
  component: ConnectionListItem,
  parameters: {
    docs: {
      description: {
        component:
          'A component for displaying connection information in a list item format.',
      },
    },
    controls: { sort: 'alpha' },
  },
  argTypes: {
    connection: {
      control: 'object',
      description: 'The connection data to display',
    },
    onClick: {
      control: false,
      description: 'The function to call when the connection is clicked',
      action: 'clicked',
    },
  },
  args: {
    connection: {
      extensionId: null,
      iconUrl: 'https://app.metamask.io/favicon.png',
      name: 'MetaMask Portfolio',
      origin: 'https://app.metamask.io',
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
  decorators: [(story) => <Provider store={store}>{story()}</Provider>],
};

const Template = (args) => (
  <div
    style={{ width: '350px', border: '1px solid var(--color-border-muted)' }}
  >
    <ConnectionListItem {...args} />
  </div>
);

export const Default = Template.bind({});
Default.storyName = 'Default';

export const Chaos = Template.bind({});
Chaos.args = {
  connection: {
    extensionId: null,
    iconUrl: 'https://app.metamask.io/favicon.png',
    name: 'Connect'.repeat(100),
    origin: 'https://app.metamask.io',
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
      `${PERMISSIONS}/${encodeURIComponent(Chaos.args?.connection.origin || '')}`,
    );
  },
};

export const Snap = Template.bind({});
Snap.args = {
  connection: {
    extensionId: null,
    iconUrl: 'https://app.metamask.io/favicon.png',
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
      `${PERMISSIONS}/${encodeURIComponent(Snap.args?.connection.origin || '')}`,
    ),
};

export const MultipleConnections = () => (
  <div style={{ width: '350px', margin: '0 auto' }}>
    <div
      style={{
        border: '1px solid var(--color-border-muted)',
        marginBottom: '8px',
      }}
    >
      <ConnectionListItem
        connection={{
          extensionId: null,
          iconUrl: 'https://app.metamask.io/favicon.png',
          name: 'MetaMask Portfolio',
          origin: 'https://app.metamask.io',
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
        }}
        onClick={() => console.log('Portfolio clicked')}
      />
    </div>
    <div
      style={{
        border: '1px solid var(--color-border-muted)',
        marginBottom: '8px',
      }}
    >
      <ConnectionListItem
        connection={{
          extensionId: null,
          iconUrl: 'https://uniswap.org/favicon.ico',
          name: 'Uniswap',
          origin: 'https://uniswap.org',
          subjectType: 'website',
          addresses: [
            '0xcccF07C80ce267F3132cE7e6048B66E6E669365B',
            '0xdddD671F1Fcc94bCF0ebC6Ec4790Da35E8d5e1E1',
            '0xeeeF07C80ce267F3132cE7e6048B66E6E669365B',
          ],
          addressToNameMap: {
            '0xcccF07C80ce267F3132cE7e6048B66E6E669365B': 'Trading Account',
            '0xdddD671F1Fcc94bCF0ebC6Ec4790Da35E8d5e1E1': 'Liquidity Pool',
            '0xeeeF07C80ce267F3132cE7e6048B66E6E669365B': 'Staking Account',
          },
          networkIconUrl: ETH_TOKEN_IMAGE_URL,
          networkName: 'Ethereum',
        }}
        onClick={() => console.log('Uniswap clicked')}
      />
    </div>
    <div style={{ border: '1px solid var(--color-border-muted)' }}>
      <ConnectionListItem
        connection={{
          extensionId: null,
          iconUrl: 'https://app.metamask.io/favicon.png',
          name: 'Test Snap',
          packageName: '@metamask/test-snap',
          subjectType: 'snap',
          addresses: ['0xfffF07C80ce267F3132cE7e6048B66E6E669365B'],
          addressToNameMap: {
            '0xfffF07C80ce267F3132cE7e6048B66E6E669365B': 'Snap Account',
          },
        }}
        onClick={() => console.log('Snap clicked')}
      />
    </div>
  </div>
);
