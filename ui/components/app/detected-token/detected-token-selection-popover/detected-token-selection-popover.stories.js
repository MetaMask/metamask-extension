import React from 'react';
import { Provider } from 'react-redux';

import testData from '../../../../../.storybook/test-data';
import configureStore from '../../../../store/store';
import DetectedTokenSelectionPopover from './detected-token-selection-popover';

const store = configureStore(testData);

export default {
  title: 'Components/App/DetectedToken/DetectedTokenSelectionPopover',
  decorators: [(story) => <Provider store={store}>{story()}</Provider>],

  argTypes: {
    selectedTokens: { control: 'array' },
    handleTokenSelection: { control: 'func' },
    onImport: { control: 'func' },
    onIgnoreAll: { control: 'func' },
  },
  args: {
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
  return <DetectedTokenSelectionPopover {...args} />;
};

export const DefaultStory = Template.bind({});

DefaultStory.storyName = 'Default';
