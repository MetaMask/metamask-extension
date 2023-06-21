import React from 'react';

import DetectedTokenValues from './detected-token-values';

export default {
  title: 'Components/App/DetectedToken/DetectedTokenValues',

  argTypes: {
    token: { control: 'object' },
    handleTokenSelection: { control: 'func' },
    tokensListDetected: { control: 'array' },
  },
  args: {
    token: {
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
    tokensListDetected: {
      '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f': {
        token: {
          name: 'Synthetix Network',
          address: '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f',
          symbol: 'SNX',
          decimals: 18,
          iconUrl:
            'https://assets.coingecko.com/coins/images/3406/large/SNX.png',
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
        selected: true,
      },
      '0x514910771af9ca656af840dff83e8264ecf986ca': {
        token: {
          name: 'ChainLink Token',
          address: '0x514910771af9ca656af840dff83e8264ecf986ca',
          symbol: 'LINK',
          decimals: 18,
          iconUrl:
            'https://crypto.com/price/coin-data/icon/LINK/color_icon.png',
          aggregators: ['coinGecko', 'oneInch', 'paraswap', 'zapper', 'zerion'],
        },
        selected: true,
      },
    },
  },
};

const Template = (args) => {
  return <DetectedTokenValues {...args} />;
};

export const DefaultStory = Template.bind({});

DefaultStory.storyName = 'Default';
