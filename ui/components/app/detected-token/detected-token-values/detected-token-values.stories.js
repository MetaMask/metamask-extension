import React from 'react';
import { Provider } from 'react-redux';
import testData from '../../../../../.storybook/test-data';
import configureStore from '../../../../store/store';
import DetectedTokenValues from './detected-token-values';

export default {
  title: 'Components/App/DetectedToken/DetectedTokenValues',
  component: DetectedTokenValues,
  argTypes: {
    token: { control: 'object' },
    handleTokenSelection: { action: 'handleTokenSelection' }, // Action for interactions
    tokensListDetected: { control: 'object' },
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

// Mock store data
const customData = {
  ...testData,
  metamask: {
    ...testData.metamask,
  },
};

const customStore = configureStore(customData);

const Template = (args) => (
  <Provider store={customStore}>
    <DetectedTokenValues {...args} />
  </Provider>
);

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';
