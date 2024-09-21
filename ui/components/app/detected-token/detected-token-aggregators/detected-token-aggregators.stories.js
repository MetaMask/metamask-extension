import React from 'react';
import { Display } from '../../../../helpers/constants/design-system';

import { Box } from '../../../component-library';
import DetectedTokenAggregators from './detected-token-aggregators';

export default {
  title: 'Components/App/DetectedToken/DetectedTokenAggregators',

  argTypes: {
    aggregators: { control: 'array' },
  },
  args: {
    aggregators1: [
      'Aave',
      'Bancor',
      'CMC',
      'Crypto.com',
      'CoinGecko',
      '1inch',
      'Paraswap',
      'PMM',
      'Synthetix',
      'Zapper',
      'Zerion',
      '0x',
    ],
    aggregators2: ['Aave', 'Bancor'],
  },
};

const Template = (args) => {
  return (
    <Box display={Display.Grid}>
      <DetectedTokenAggregators aggregators={args.aggregators1} />
      <DetectedTokenAggregators aggregators={args.aggregators2} />
    </Box>
  );
};

export const DefaultStory = Template.bind({});

DefaultStory.storyName = 'Default';
