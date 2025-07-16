import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import {
  Display,
  FlexDirection,
  BlockSize,
} from '../../../helpers/constants/design-system';

import { Box } from '..';
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
    src: './images/avax-token.svg',
  },
} as Meta<typeof PickerNetwork>;

const Template = (args) => <PickerNetwork {...args} />;

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';

export const Label: StoryFn<typeof PickerNetwork> = (args) => (
  <Box
    display={Display.InlineFlex}
    flexDirection={FlexDirection.Column}
    gap={2}
  >
    <PickerNetwork {...args} />
    <PickerNetwork {...args} src="" label="Arbitrum One" />
    <PickerNetwork {...args} src="" label="Polygon Mainnet" />
    <PickerNetwork {...args} src="" label="Optimism" />
    <PickerNetwork
      {...args}
      src=""
      label="BNB Smart Chain (previously Binance Smart Chain Mainnet)"
      style={{ maxWidth: '200px' }}
    />
  </Box>
);

export const Src: StoryFn<typeof PickerNetwork> = (args) => (
  <Box
    display={Display.InlineFlex}
    flexDirection={FlexDirection.Column}
    gap={2}
  >
    <PickerNetwork {...args} label="Arbitrum One" src="./images/arbitrum.svg" />
    <PickerNetwork
      {...args}
      label="Polygon Mainnet"
      src="./images/pol-token.svg"
    />
    <PickerNetwork {...args} label="Optimism" src="./images/optimism.svg" />
  </Box>
);

export const Width: StoryFn<typeof PickerNetwork> = (args) => (
  <>
    <PickerNetwork marginBottom={2} {...args} />
    <PickerNetwork {...args} width={BlockSize.Full} />
  </>
);
