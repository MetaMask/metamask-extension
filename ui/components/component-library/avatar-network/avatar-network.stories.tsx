import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import {
  DISPLAY,
  TextColor,
  BackgroundColor,
  BorderColor,
  Color,
  AlignItems,
} from '../../../helpers/constants/design-system';

import Box from '../../ui/box/box';

import { AvatarBaseSize } from '../avatar-base/avatar-base.types';
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
      options: Object.values(AvatarBaseSize),
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
    size: AvatarBaseSize.Md,
    showHalo: false,
  },
} as ComponentMeta<typeof AvatarNetwork>;

const Template: ComponentStory<typeof AvatarNetwork> = (args) => {
  return <AvatarNetwork {...args} />;
};

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';

export const SizeStory: ComponentStory<typeof AvatarNetwork> = (args) => (
  <>
    <Box
      display={DISPLAY.FLEX}
      alignItems={AlignItems.flexEnd}
      gap={1}
      marginBottom={4}
    >
      <AvatarNetwork {...args} size={AvatarBaseSize.Xs} />
      <AvatarNetwork {...args} size={AvatarBaseSize.Sm} />
      <AvatarNetwork {...args} size={AvatarBaseSize.Md} />
      <AvatarNetwork {...args} size={AvatarBaseSize.Lg} />
      <AvatarNetwork {...args} size={AvatarBaseSize.Xl} />
    </Box>
    <Box display={DISPLAY.FLEX} alignItems={AlignItems.flexEnd} gap={1}>
      <AvatarNetwork {...args} src="" size={AvatarBaseSize.Xs} />
      <AvatarNetwork {...args} src="" size={AvatarBaseSize.Sm} />
      <AvatarNetwork {...args} src="" size={AvatarBaseSize.Md} />
      <AvatarNetwork {...args} src="" size={AvatarBaseSize.Lg} />
      <AvatarNetwork {...args} src="" size={AvatarBaseSize.Xl} />
    </Box>
  </>
);
SizeStory.storyName = 'Size';

export const Name = Template.bind({});
Name.args = {
  src: '',
};

export const Src: ComponentStory<typeof AvatarNetwork> = (args) => (
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

export const ColorBackgroundColorAndBorderColor: ComponentStory<
  typeof AvatarNetwork
> = (args) => (
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
