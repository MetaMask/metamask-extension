import React from 'react';
import { ConnectionListTooltip } from './connection-list-tooltip';

export default {
  title: 'Components/Multichain/ConnectionListTooltip',
};

const connection = {
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
};

export const DefaultStory = () => (
  <ConnectionListTooltip connection={connection} />
);

DefaultStory.storyName = 'Default';
