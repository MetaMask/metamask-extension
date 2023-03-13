import React from 'react';
import {
  Size,
  DISPLAY,
  AlignItems,
  BackgroundColor,
  IconColor,
  Color,
} from '../../../helpers/constants/design-system';

import Box from '../../ui/box/box';

import { ICON_NAMES } from '..';

import README from './README.mdx';
import { AvatarIcon, AVATAR_ICON_SIZES } from '.';

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
      options: Object.values(ICON_NAMES),
      control: 'select',
    },
    size: {
      control: 'select',
      options: Object.values(AVATAR_ICON_SIZES),
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
    size: Size.MD,
  },
};

const Template = (args) => {
  return <AvatarIcon iconName={ICON_NAMES.SWAP_HORIZONTAL} {...args} />;
};

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';

export const SizeStory = (args) => (
  <Box display={DISPLAY.FLEX} alignItems={AlignItems.baseline} gap={1}>
    <AvatarIcon {...args} size={Size.XS} />
    <AvatarIcon {...args} size={Size.SM} />
    <AvatarIcon {...args} size={Size.MD} />
    <AvatarIcon {...args} size={Size.LG} />
    <AvatarIcon {...args} size={Size.XL} />
  </Box>
);
SizeStory.storyName = 'Size';

SizeStory.args = {
  iconName: ICON_NAMES.CONFIRMATION,
};

export const IconName = (args) => (
  <Box display={DISPLAY.FLEX} gap={1}>
    <AvatarIcon
      color={IconColor.primaryDefault}
      backgroundColor={BackgroundColor.primaryMuted}
      iconName={ICON_NAMES.SWAP_HORIZONTAL}
      {...args}
    />
    <AvatarIcon
      color={IconColor.successDefault}
      backgroundColor={BackgroundColor.successMuted}
      iconName={ICON_NAMES.CONFIRMATION}
      {...args}
    />
    <AvatarIcon
      color={IconColor.infoDefault}
      backgroundColor={BackgroundColor.infoMuted}
      iconName={ICON_NAMES.INFO}
      {...args}
    />
    <AvatarIcon
      color={IconColor.warningDefault}
      backgroundColor={BackgroundColor.warningMuted}
      iconName={ICON_NAMES.WARNING}
      {...args}
    />
    <AvatarIcon
      color={IconColor.errorDefault}
      backgroundColor={BackgroundColor.errorMuted}
      iconName={ICON_NAMES.DANGER}
      {...args}
    />
  </Box>
);

export const ColorAndBackgroundColor = (args) => (
  <Box display={DISPLAY.FLEX} gap={1}>
    <AvatarIcon
      color={IconColor.primaryDefault}
      backgroundColor={BackgroundColor.primaryMuted}
      iconName={ICON_NAMES.SWAP_HORIZONTAL}
      {...args}
    />
    <AvatarIcon
      color={IconColor.primaryInverse}
      backgroundColor={BackgroundColor.primaryDefault}
      iconName={ICON_NAMES.SWAP_HORIZONTAL}
      {...args}
    />
    <AvatarIcon
      color={IconColor.successDefault}
      backgroundColor={BackgroundColor.successMuted}
      iconName={ICON_NAMES.CONFIRMATION}
      {...args}
    />
    <AvatarIcon
      color={IconColor.infoDefault}
      backgroundColor={BackgroundColor.infoMuted}
      iconName={ICON_NAMES.INFO}
      {...args}
    />
    <AvatarIcon
      color={IconColor.warningDefault}
      backgroundColor={BackgroundColor.warningMuted}
      iconName={ICON_NAMES.WARNING}
      {...args}
    />
    <AvatarIcon
      color={IconColor.errorDefault}
      backgroundColor={BackgroundColor.errorMuted}
      iconName={ICON_NAMES.DANGER}
      {...args}
    />
  </Box>
);
