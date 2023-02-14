import React from 'react';
import {
  DISPLAY,
  FLEX_DIRECTION,
  Color,
  TextColor,
  Size,
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
      options: Object.values(TextColor),
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
        color={Color.inherit}
        name={ICON_NAMES.WARNING}
        size={Size.inherit}
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

export const ColorStory = (args) => (
  <Box display={DISPLAY.FLEX} flexDirection={FLEX_DIRECTION.COLUMN} gap={2}>
    <HelpText color={Color.textDefault} {...args}>
      This HelpText default color is Color.textDefault
    </HelpText>
    <HelpText color={Color.infoDefault} {...args}>
      This HelpText color is Color.infoDefault
    </HelpText>
    <HelpText color={Color.warningDefault} {...args}>
      This HelpText color is Color.warningDefault
    </HelpText>
    <HelpText color={Color.successDefault} {...args}>
      This HelpText color is Color.successDefault
    </HelpText>
  </Box>
);
ColorStory.storyName = 'Color';
