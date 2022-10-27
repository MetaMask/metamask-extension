import React, { useState } from 'react';
import {
  DISPLAY,
  FLEX_DIRECTION,
  COLORS,
  SIZES,
  ALIGN_ITEMS,
  SEVERITIES,
} from '../../../helpers/constants/design-system';

import Box from '../../ui/box';
import { Icon, ICON_NAMES } from '../icon';
import { TextFieldBase } from '../text-field-base';

import { HELP_TEXT_SEVERITIES } from './help-text.constants';
import { HelpText } from './help-text';

import README from './README.mdx';

export default {
  title: 'Components/ComponentLibrary/HelpText',
  id: __filename,
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
    severity: {
      control: 'select',
      options: Object.values(HELP_TEXT_SEVERITIES),
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

export const Severity = (args) => (
  <Box display={DISPLAY.FLEX} flexDirection={FLEX_DIRECTION.COLUMN} gap={2}>
    <HelpText {...args}>None</HelpText>
    <HelpText {...args} severity={SEVERITIES.INFO}>
      SEVERITIES.INFO
    </HelpText>
    <HelpText {...args} severity={SEVERITIES.DANGER}>
      SEVERITIES.DANGER
    </HelpText>
    <HelpText {...args} severity={SEVERITIES.WARNING}>
      SEVERITIES.WARNING
    </HelpText>
    <HelpText {...args} severity={SEVERITIES.SUCCESS}>
      SEVERITIES.SUCCESS
    </HelpText>
  </Box>
);
