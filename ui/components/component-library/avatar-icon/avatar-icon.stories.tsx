import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import {
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
  },
  args: {
    size: AvatarIconSize.Md,
    iconName: IconName.SwapHorizontal,
  },
} as Meta<typeof AvatarIcon>;

const Template: StoryFn<typeof AvatarIcon> = (args) => {
  return <AvatarIcon {...args} />;
};

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';

export const SizeStory: StoryFn<typeof AvatarIcon> = (args) => (
  <Box display={Display.Flex} alignItems={AlignItems.baseline} gap={1}>
    <AvatarIcon {...args} size={AvatarIconSize.Xs} />
    <AvatarIcon {...args} size={AvatarIconSize.Sm} />
    <AvatarIcon {...args} size={AvatarIconSize.Md} />
    <AvatarIcon {...args} size={AvatarIconSize.Lg} />
    <AvatarIcon {...args} size={AvatarIconSize.Xl} />
  </Box>
);
SizeStory.storyName = 'Size';

export const IconNameStory: StoryFn<typeof AvatarIcon> = (args) => (
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

export const ColorAndBackgroundColor: StoryFn<typeof AvatarIcon> = (args) => (
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
