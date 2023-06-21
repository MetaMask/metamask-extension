import React from 'react';
import {
  Size,
  DISPLAY,
  TextColor,
  BackgroundColor,
  BorderColor,
  Color,
  AlignItems,
} from '../../../helpers/constants/design-system';

import Box from '../../ui/box/box';

import README from './README.mdx';

import { AvatarNetwork } from './avatar-network';
import { AVATAR_NETWORK_SIZES } from './avatar-network.constants';

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
      options: Object.values(AVATAR_NETWORK_SIZES),
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
    size: Size.MD,
    showHalo: false,
  },
};

const Template = (args) => {
  return <AvatarNetwork {...args} />;
};

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';

export const SizeStory = (args) => (
  <>
    <Box
      display={DISPLAY.FLEX}
      alignItems={AlignItems.flexEnd}
      gap={1}
      marginBottom={4}
    >
      <AvatarNetwork {...args} size={Size.XS} />
      <AvatarNetwork {...args} size={Size.SM} />
      <AvatarNetwork {...args} size={Size.MD} />
      <AvatarNetwork {...args} size={Size.LG} />
      <AvatarNetwork {...args} size={Size.XL} />
    </Box>
    <Box display={DISPLAY.FLEX} alignItems={AlignItems.flexEnd} gap={1}>
      <AvatarNetwork {...args} src="" size={Size.XS} />
      <AvatarNetwork {...args} src="" size={Size.SM} />
      <AvatarNetwork {...args} src="" size={Size.MD} />
      <AvatarNetwork {...args} src="" size={Size.LG} />
      <AvatarNetwork {...args} src="" size={Size.XL} />
    </Box>
  </>
);
SizeStory.storyName = 'Size';

export const Name = Template.bind({});
Name.args = {
  src: '',
};

export const Src = (args) => (
  <Box display={DISPLAY.FLEX} gap={1}>
    <AvatarNetwork {...args} src="./images/matic-token.png" />
    <AvatarNetwork {...args} src="./images/arbitrum.svg" />
    <AvatarNetwork {...args} src="./images/optimism.svg" />
    <AvatarNetwork {...args} src="./images/avax-token.png" />
    <AvatarNetwork {...args} src="./images/palm.svg" />
    <AvatarNetwork {...args} src="./images/bsc-filled.svg" />
    <AvatarNetwork {...args} src="./images/fantom-opera.svg" />
    <AvatarNetwork {...args} src="./images/harmony-one.svg" />
    <AvatarNetwork {...args} src="./images/aurora.png" />
  </Box>
);

export const ShowHalo = Template.bind({});
ShowHalo.args = {
  showHalo: true,
};

export const ColorBackgroundColorAndBorderColor = (args) => (
  <Box display={DISPLAY.FLEX} gap={1}>
    <AvatarNetwork
      {...args}
      backgroundColor={BackgroundColor.goerli}
      borderColor={BorderColor.goerli}
      name="G"
      color={Color.goerliInverse}
    />
    <AvatarNetwork
      {...args}
      backgroundColor={BackgroundColor.sepolia}
      borderColor={BorderColor.sepolia}
      name="S"
      color={Color.goerliInverse}
    />
  </Box>
);
ColorBackgroundColorAndBorderColor.args = {
  src: '',
};
