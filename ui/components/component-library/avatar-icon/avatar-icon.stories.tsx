import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import {
  DISPLAY,
  AlignItems,
  BackgroundColor,
  IconColor,
  Color,
} from '../../../helpers/constants/design-system';

import Box from '../../ui/box/box';

import { IconName } from '..';

import { AvatarBaseSize } from '../avatar-base/avatar-base.types';
import README from './README.mdx';
import { AvatarIcon } from '.';

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
      options: Object.values(AvatarBaseSize),
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
    size: AvatarBaseSize.Md,
  },
} as ComponentMeta<typeof AvatarIcon>;

const Template: ComponentStory<typeof AvatarIcon> = (args) => {
  return <AvatarIcon {...args} iconName={IconName.SwapHorizontal} />;
};

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';

export const SizeStory: ComponentStory<typeof AvatarIcon> = (args) => (
  <Box display={DISPLAY.FLEX} alignItems={AlignItems.baseline} gap={1}>
    <AvatarIcon {...args} size={AvatarBaseSize.Xs} />
    <AvatarIcon {...args} size={AvatarBaseSize.Sm} />
    <AvatarIcon {...args} size={AvatarBaseSize.Md} />
    <AvatarIcon {...args} size={AvatarBaseSize.Lg} />
    <AvatarIcon {...args} size={AvatarBaseSize.Xl} />
  </Box>
);
SizeStory.storyName = 'Size';

SizeStory.args = {
  iconName: IconName.Confirmation,
};

export const IconNameStory: ComponentStory<typeof AvatarIcon> = (args) => (
  <Box display={DISPLAY.FLEX} gap={1}>
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

export const ColorAndBackgroundColor: ComponentStory<typeof AvatarIcon> = (
  args,
) => (
  <Box display={DISPLAY.FLEX} gap={1}>
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
