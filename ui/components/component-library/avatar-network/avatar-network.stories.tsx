import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import {
  Display,
  TextColor,
  BackgroundColor,
  BorderColor,
  AlignItems,
} from '../../../helpers/constants/design-system';
import { Box } from '..';
import { AvatarNetworkSize } from './avatar-network.types';
import README from './README.mdx';

import { AvatarNetwork } from './avatar-network';

export default {
  title: 'Components/ComponentLibrary/AvatarNetwork',
  component: AvatarNetwork,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: Object.values(AvatarNetworkSize),
    },
    color: {
      options: Object.values(TextColor),
      control: 'select',
    },
    backgroundColor: {
      options: Object.values(BackgroundColor),
      control: 'select',
    },
    borderColor: {
      options: Object.values(BorderColor),
      control: 'select',
    },
    name: {
      control: 'text',
    },
    src: {
      control: 'text',
    },
    showHalo: {
      control: 'boolean',
    },
  },
  args: {
    name: 'Arbitrum One',
    src: './images/arbitrum.svg',
    size: AvatarNetworkSize.Md,
    showHalo: false,
  },
} as Meta<typeof AvatarNetwork>;

const Template: StoryFn<typeof AvatarNetwork> = (args) => {
  return <AvatarNetwork {...args} />;
};

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';

export const SizeStory: StoryFn<typeof AvatarNetwork> = (args) => (
  <>
    <Box
      display={Display.Flex}
      alignItems={AlignItems.flexEnd}
      gap={1}
      marginBottom={4}
    >
      <AvatarNetwork {...args} size={AvatarNetworkSize.Xs} />
      <AvatarNetwork {...args} size={AvatarNetworkSize.Sm} />
      <AvatarNetwork {...args} size={AvatarNetworkSize.Md} />
      <AvatarNetwork {...args} size={AvatarNetworkSize.Lg} />
      <AvatarNetwork {...args} size={AvatarNetworkSize.Xl} />
    </Box>
    <Box display={Display.Flex} alignItems={AlignItems.flexEnd} gap={1}>
      <AvatarNetwork {...args} src="" size={AvatarNetworkSize.Xs} />
      <AvatarNetwork {...args} src="" size={AvatarNetworkSize.Sm} />
      <AvatarNetwork {...args} src="" size={AvatarNetworkSize.Md} />
      <AvatarNetwork {...args} src="" size={AvatarNetworkSize.Lg} />
      <AvatarNetwork {...args} src="" size={AvatarNetworkSize.Xl} />
    </Box>
  </>
);
SizeStory.storyName = 'Size';

export const Name = Template.bind({});
Name.args = {
  src: '',
};

export const Src: StoryFn<typeof AvatarNetwork> = (args) => (
  <Box display={Display.Flex} gap={1}>
    <AvatarNetwork {...args} src="./images/pol-token.svg" />
    <AvatarNetwork {...args} src="./images/arbitrum.svg" />
    <AvatarNetwork {...args} src="./images/optimism.svg" />
    <AvatarNetwork {...args} src="./images/avax-token.svg" />
    <AvatarNetwork {...args} src="./images/palm.svg" />
    <AvatarNetwork {...args} src="./images/bsc-filled.svg" />
    <AvatarNetwork {...args} src="./images/fantom-opera.svg" />
    <AvatarNetwork {...args} src="./images/harmony-one.svg" />
  </Box>
);

export const ShowHalo = Template.bind({});
ShowHalo.args = {
  showHalo: true,
};

export const ColorBackgroundColorAndBorderColor: StoryFn<
  typeof AvatarNetwork
> = (args) => (
  <Box display={Display.Flex} gap={1}>
    <AvatarNetwork
      {...args}
      backgroundColor={BackgroundColor.goerli}
      borderColor={BorderColor.goerli}
      name="G"
      color={TextColor.goerliInverse}
    />
    <AvatarNetwork
      {...args}
      backgroundColor={BackgroundColor.sepolia}
      borderColor={BorderColor.sepolia}
      name="S"
      color={TextColor.goerliInverse}
    />
  </Box>
);
ColorBackgroundColorAndBorderColor.args = {
  src: '',
};
