import React from 'react';

import DetectedTokenValues from './detected-token-values';

export default {
  title: 'Components/App/DetectedToken/DetectedTokenValues',
  id: __filename,
  argTypes: {
    address: { control: 'text' },
    symbol: { control: 'text' },
    decimals: { control: 'text' },
    iconUrl: { control: 'text' },
    aggregators: { control: 'array' },
  },
  args: {
    address: '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f',
    symbol: 'SNX',
    decimals: 18,
    iconUrl: 'https://assets.coingecko.com/coins/images/3406/large/SNX.png',
    aggregators: [
      'aave',
      'bancor',
      'cmc',
      'cryptocom',
      'coinGecko',
      'oneInch',
      'paraswap',
      'pmm',
      'synthetix',
      'zapper',
      'zerion',
      'zeroEx',
    ],
  },
};

const Template = (args) => {
  return <DetectedTokenValues token={args} />;
};

export const DefaultStory = Template.bind({});

DefaultStory.storyName = 'Default';
