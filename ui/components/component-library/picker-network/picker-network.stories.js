import React from 'react';
import {
  DISPLAY,
  FLEX_DIRECTION,
} from '../../../helpers/constants/design-system';

import Box from '../../ui/box';
import README from './README.mdx';
import { PickerNetwork } from './picker-network';

export default {
  title: 'Components/ComponentLibrary/PickerNetwork',

  component: PickerNetwork,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    label: {
      control: 'text',
    },
    src: {
      control: 'text',
    },
  },
  args: {
    label: 'Avalanche C-Chain',
    src: './images/avax-token.png',
  },
};

export const DefaultStory = (args) => <PickerNetwork {...args} />;

export const Label = (args) => (
  <Box display={DISPLAY.FLEX} flexDirection={FLEX_DIRECTION.COLUMN} gap={2}>
    <PickerNetwork {...args} label="Arbitrum One" />
    <PickerNetwork {...args} label="Polygon Mainnet" />
    <PickerNetwork {...args} label="Optimism" />
  </Box>
);

export const Src = (args) => (
  <Box display={DISPLAY.FLEX} flexDirection={FLEX_DIRECTION.COLUMN} gap={2}>
    <PickerNetwork {...args} label="Arbitrum One" src="./images/arbitrum.svg" />
    <PickerNetwork
      {...args}
      label="Polygon Mainnet"
      src="./images/matic-token.png"
    />
    <PickerNetwork {...args} label="Optimism" src="./images/optimism.svg" />
  </Box>
);

DefaultStory.storyName = 'Default';
