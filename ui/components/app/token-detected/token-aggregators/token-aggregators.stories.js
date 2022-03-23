import React from 'react';
import { DISPLAY } from '../../../../helpers/constants/design-system';

import Box from '../../../ui/box';
import TokenAggregators from './token-aggregators';

export default {
  title: 'Components/App/TokenDetected/TokenAggregators',
  id: __filename,
  argTypes: {
    aggregatorsList: { control: 'array' },
  },
  args: {
    aggregatorsList1: [
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
    aggregatorsList2: ['Aave', 'Bancor'],
  },
};

const Template = (args) => {
  return (
    <Box display={DISPLAY.GRID}>
      <TokenAggregators aggregatorsList={args.aggregatorsList1} />
      <TokenAggregators aggregatorsList={args.aggregatorsList2} />
    </Box>
  );
};

export const DefaultStory = Template.bind({});

DefaultStory.storyName = 'Default';
