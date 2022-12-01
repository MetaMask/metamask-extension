import React from 'react';
import {
  SIZES,
  DISPLAY,
  ALIGN_ITEMS,
} from '../../../helpers/constants/design-system';

import Box from '../../ui/box/box';

import { ICON_NAMES } from '..';

import README from './README.mdx';
import { AvatarIcon, AVATAR_ICON_SIZES, AVATAR_ICON_SEVERITIES } from '.';

export default {
  title: 'Components/ComponentLibrary/AvatarIcon',
  id: __filename,
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
    severity: {
      options: Object.values(AVATAR_ICON_SEVERITIES),
      control: 'select',
    },
    size: {
      control: 'select',
      options: Object.values(AVATAR_ICON_SIZES),
    },
  },
  args: {
    size: SIZES.MD,
    iconName: ICON_NAMES.COPY_FILLED,
    ariaLabel: 'Test Avatar Icon',
  },
};

const Template = (args) => {
  return <AvatarIcon {...args} />;
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

export const IconName = (args) => <AvatarIcon {...args} />;
