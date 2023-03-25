import React from 'react';
import {
  DISPLAY,
  FLEX_DIRECTION,
  IconColor,
  TextColor,
  Size,
  SEVERITIES,
} from '../../../helpers/constants/design-system';

import Box from '../../ui/box';

import { Icon, IconName } from '..';

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
    severity: {
      control: 'select',
      options: Object.values(SEVERITIES),
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
    <HelpText>
      <span>Text and icon</span>
      <Icon
        marginLeft={1}
        color={IconColor.iconAlternative}
        name={IconName.Warning}
        size={Size.inherit}
        as="span"
      />
    </HelpText>
  </Box>
);

export const SeverityStory = (args) => (
  <>
    <HelpText {...args}>HelpText without severity prop</HelpText>
    <HelpText {...args} severity={SEVERITIES.DANGER}>
      HelpText with severity: SEVERITY.DANGER
    </HelpText>
    <HelpText {...args} severity={SEVERITIES.SUCCESS}>
      HelpText with severity: SEVERITY.SUCCESS
    </HelpText>
    <HelpText {...args} severity={SEVERITIES.WARNING}>
      HelpText with severity: SEVERITY.WARNING
    </HelpText>
    <HelpText {...args} severity={SEVERITIES.INFO}>
      HelpText with severity: SEVERITY.INFO
    </HelpText>
  </>
);

SeverityStory.storyName = 'Severity';

export const ColorStory = (args) => (
  <Box display={DISPLAY.FLEX} flexDirection={FLEX_DIRECTION.COLUMN} gap={2}>
    <HelpText color={TextColor.textDefault} {...args}>
      This HelpText default color is TextColor.textDefault
    </HelpText>
    <HelpText color={TextColor.textAlternative} {...args}>
      This HelpText color is TextColor.textAlternative
    </HelpText>
    <HelpText color={TextColor.textMuted} {...args}>
      This HelpText color is TextColor.textMuted
    </HelpText>
  </Box>
);
ColorStory.storyName = 'Color';
