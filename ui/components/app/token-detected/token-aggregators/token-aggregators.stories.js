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
    aggregatorsList2: ['aave', 'bancor'],
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
