import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import {
  Size,
  AlignItems,
  BackgroundColor,
  IconColor,
  Color,
  Display,
} from '../../../helpers/constants/design-system';

import { Box } from '../box';

import { IconName } from '..';

import README from './README.mdx';
import { AvatarIcon, AvatarIconSize } from '.';

const marginSizeControlOptions = [
  undefined,
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  'auto',
];

export default {
  title: 'Components/ComponentLibrary/AvatarIcon',
  component: AvatarIcon,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    iconName: {
      options: Object.values(IconName),
      control: 'select',
    },
    size: {
      control: 'select',
      options: Object.values(AvatarIconSize),
    },
    backgroundColor: {
      control: 'select',
      options: Object.values(BackgroundColor),
    },
    color: {
      control: 'select',
      options: Object.values(Color),
    },
    className: {
      control: 'text',
    },
    marginTop: {
      options: marginSizeControlOptions,
      control: 'select',
      table: { category: 'box props' },
    },
    marginRight: {
      options: marginSizeControlOptions,
      control: 'select',
      table: { category: 'box props' },
    },
    marginBottom: {
      options: marginSizeControlOptions,
      control: 'select',
      table: { category: 'box props' },
    },
    marginLeft: {
      options: marginSizeControlOptions,
      control: 'select',
      table: { category: 'box props' },
    },
  },
  args: {
    size: AvatarIconSize.Md,
  },
} as Meta<typeof AvatarIcon>;

const Template: StoryFn<typeof AvatarIcon> = (args) => {
  return <AvatarIcon {...args} iconName={IconName.SwapHorizontal} />;
};

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';

export const SizeStory = (args) => (
  <Box display={Display.Flex} alignItems={AlignItems.baseline} gap={1}>
    <AvatarIcon {...args} size={Size.XS} />
    <AvatarIcon {...args} size={Size.SM} />
    <AvatarIcon {...args} size={Size.MD} />
    <AvatarIcon {...args} size={Size.LG} />
    <AvatarIcon {...args} size={Size.XL} />
  </Box>
);
SizeStory.storyName = 'Size';

SizeStory.args = {
  iconName: IconName.Confirmation,
};

export const IconNameStory = (args) => (
  <Box display={Display.Flex} gap={1}>
    <AvatarIcon
      color={IconColor.primaryDefault}
      backgroundColor={BackgroundColor.primaryMuted}
      {...args}
      iconName={IconName.SwapHorizontal}
    />
    <AvatarIcon
      color={IconColor.successDefault}
      backgroundColor={BackgroundColor.successMuted}
      {...args}
      iconName={IconName.Confirmation}
    />
    <AvatarIcon
      color={IconColor.infoDefault}
      backgroundColor={BackgroundColor.infoMuted}
      {...args}
      iconName={IconName.Info}
    />
    <AvatarIcon
      color={IconColor.warningDefault}
      backgroundColor={BackgroundColor.warningMuted}
      {...args}
      iconName={IconName.Warning}
    />
    <AvatarIcon
      color={IconColor.errorDefault}
      backgroundColor={BackgroundColor.errorMuted}
      {...args}
      iconName={IconName.Danger}
    />
  </Box>
);

IconNameStory.storyName = 'Icon Name';

export const ColorAndBackgroundColor = (args) => (
  <Box display={Display.Flex} gap={1}>
    <AvatarIcon
      color={IconColor.primaryDefault}
      backgroundColor={BackgroundColor.primaryMuted}
      {...args}
      iconName={IconName.SwapHorizontal}
    />
    <AvatarIcon
      color={IconColor.primaryInverse}
      backgroundColor={BackgroundColor.primaryDefault}
      {...args}
      iconName={IconName.SwapHorizontal}
    />
    <AvatarIcon
      color={IconColor.successDefault}
      backgroundColor={BackgroundColor.successMuted}
      {...args}
      iconName={IconName.Confirmation}
    />
    <AvatarIcon
      color={IconColor.infoDefault}
      backgroundColor={BackgroundColor.infoMuted}
      {...args}
      iconName={IconName.Info}
    />
    <AvatarIcon
      color={IconColor.warningDefault}
      backgroundColor={BackgroundColor.warningMuted}
      {...args}
      iconName={IconName.Warning}
    />
    <AvatarIcon
      color={IconColor.errorDefault}
      backgroundColor={BackgroundColor.errorMuted}
      {...args}
      iconName={IconName.Danger}
    />
  </Box>
);
