import React from 'react';
import {
  DISPLAY,
  FLEX_DIRECTION,
  COLORS,
  TEXT_COLORS,
  SIZES,
} from '../../../helpers/constants/design-system';

import Box from '../../ui/box';

import { Icon, ICON_NAMES } from '..';

import { HelpText } from './help-text';

import README from './README.mdx';

export default {
  title: 'Components/ComponentLibrary/HelpText',

  component: HelpText,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    children: {
      control: 'text',
    },
    className: {
      control: 'text',
    },
    error: {
      control: 'boolean',
    },
    color: {
      control: 'select',
      options: Object.values(TEXT_COLORS),
    },
  },
  args: {
    children: 'Help text',
  },
};

const Template = (args) => <HelpText {...args} />;

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';

export const Children = (args) => (
  <Box display={DISPLAY.FLEX} flexDirection={FLEX_DIRECTION.COLUMN} gap={2}>
    <HelpText {...args}>Plain text</HelpText>
    <HelpText {...args}>
      Text and icon
      <Icon
        marginLeft={1}
        color={COLORS.INHERIT}
        name={ICON_NAMES.WARNING_FILLED}
        size={SIZES.AUTO}
      />
    </HelpText>
  </Box>
);

export const ErrorStory = (args) => (
  <HelpText error {...args}>
    This HelpText in error state
  </HelpText>
);
ErrorStory.storyName = 'Error';

export const Color = (args) => (
  <Box display={DISPLAY.FLEX} flexDirection={FLEX_DIRECTION.COLUMN} gap={2}>
    <HelpText color={COLORS.TEXT_DEFAULT} {...args}>
      This HelpText default color is COLORS.TEXT_DEFAULT
    </HelpText>
    <HelpText color={COLORS.INFO_DEFAULT} {...args}>
      This HelpText color is COLORS.INFO_DEFAULT
    </HelpText>
    <HelpText color={COLORS.WARNING_DEFAULT} {...args}>
      This HelpText color is COLORS.WARNING_DEFAULT
    </HelpText>
    <HelpText color={COLORS.SUCCESS_DEFAULT} {...args}>
      This HelpText color is COLORS.SUCCESS_DEFAULT
    </HelpText>
  </Box>
);
