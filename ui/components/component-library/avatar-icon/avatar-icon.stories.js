import React from 'react';
import {
  SIZES,
  DISPLAY,
  ALIGN_ITEMS,
  COLORS,
  BACKGROUND_COLORS,
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
      options: Object.values(BACKGROUND_COLORS),
    },
    color: {
      control: 'select',
      options: Object.values(COLORS),
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
    size: SIZES.MD,
  },
};

const Template = (args) => {
  return <AvatarIcon iconName={ICON_NAMES.SWAP_HORIZONTAL_OUTLINE} {...args} />;
};

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';

export const Size = (args) => (
  <Box display={DISPLAY.FLEX} alignItems={ALIGN_ITEMS.BASELINE} gap={1}>
    <AvatarIcon {...args} size={SIZES.XS} />
    <AvatarIcon {...args} size={SIZES.SM} />
    <AvatarIcon {...args} size={SIZES.MD} />
    <AvatarIcon {...args} size={SIZES.LG} />
    <AvatarIcon {...args} size={SIZES.XL} />
  </Box>
);

Size.args = {
  iconName: ICON_NAMES.CHECK_CIRCLE_ON_FILLED,
};

export const IconName = (args) => (
  <Box display={DISPLAY.FLEX} gap={1}>
    <AvatarIcon
      color={COLORS.PRIMARY_DEFAULT}
      backgroundColor={BACKGROUND_COLORS.PRIMARY_MUTED}
      iconName={ICON_NAMES.SWAP_HORIZONTAL_OUTLINE}
      {...args}
    />
    <AvatarIcon
      color={COLORS.SUCCESS_DEFAULT}
      backgroundColor={BACKGROUND_COLORS.SUCCESS_MUTED}
      iconName={ICON_NAMES.CHECK_CIRCLE_ON_FILLED}
      {...args}
    />
    <AvatarIcon
      color={COLORS.INFO_DEFAULT}
      backgroundColor={BACKGROUND_COLORS.INFO_MUTED}
      iconName={ICON_NAMES.INFO_FILLED}
      {...args}
    />
    <AvatarIcon
      color={COLORS.WARNING_DEFAULT}
      backgroundColor={BACKGROUND_COLORS.WARNING_MUTED}
      iconName={ICON_NAMES.WARNING_FILLED}
      {...args}
    />
    <AvatarIcon
      color={COLORS.ERROR_DEFAULT}
      backgroundColor={BACKGROUND_COLORS.ERROR_MUTED}
      iconName={ICON_NAMES.DANGER_FILLED}
      {...args}
    />
  </Box>
);

export const ColorAndBackgroundColor = (args) => (
  <Box display={DISPLAY.FLEX} gap={1}>
    <AvatarIcon
      color={COLORS.PRIMARY_DEFAULT}
      backgroundColor={BACKGROUND_COLORS.PRIMARY_MUTED}
      iconName={ICON_NAMES.SWAP_HORIZONTAL_OUTLINE}
      {...args}
    />
    <AvatarIcon
      color={COLORS.PRIMARY_INVERSE}
      backgroundColor={BACKGROUND_COLORS.PRIMARY_DEFAULT}
      iconName={ICON_NAMES.SWAP_HORIZONTAL_OUTLINE}
      {...args}
    />
    <AvatarIcon
      color={COLORS.SUCCESS_DEFAULT}
      backgroundColor={BACKGROUND_COLORS.SUCCESS_MUTED}
      iconName={ICON_NAMES.CHECK_CIRCLE_ON_FILLED}
      {...args}
    />
    <AvatarIcon
      color={COLORS.INFO_DEFAULT}
      backgroundColor={BACKGROUND_COLORS.INFO_MUTED}
      iconName={ICON_NAMES.INFO_FILLED}
      {...args}
    />
    <AvatarIcon
      color={COLORS.WARNING_DEFAULT}
      backgroundColor={BACKGROUND_COLORS.WARNING_MUTED}
      iconName={ICON_NAMES.WARNING_FILLED}
      {...args}
    />
    <AvatarIcon
      color={COLORS.ERROR_DEFAULT}
      backgroundColor={BACKGROUND_COLORS.ERROR_MUTED}
      iconName={ICON_NAMES.DANGER_FILLED}
      {...args}
    />
  </Box>
);
