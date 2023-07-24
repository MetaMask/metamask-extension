import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import {
  Display,
  FlexDirection,
  IconColor,
  TextColor,
} from '../../../helpers/constants/design-system';

import { Box, Icon, IconName, IconSize } from '..';

import { HelpText } from './help-text';
import { HelpTextSeverity } from './help-text.types';

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
      options: Object.values(HelpTextSeverity),
    },
    color: {
      control: 'select',
      options: Object.values(TextColor),
    },
  },
  args: {
    children: 'Help text',
  },
} as Meta<typeof HelpText>;

const Template: StoryFn<typeof HelpText> = (args) => <HelpText {...args} />;

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';

export const Children: StoryFn<typeof HelpText> = (args) => (
  <Box display={Display.Flex} flexDirection={FlexDirection.Column} gap={2}>
    <HelpText {...args}>Plain text</HelpText>
    <HelpText>
      <span>Text and icon</span>
      <Icon
        marginLeft={1}
        color={IconColor.iconAlternative}
        name={IconName.Warning}
        size={IconSize.Inherit}
        as="span"
      />
    </HelpText>
  </Box>
);

export const SeverityStory: StoryFn<typeof HelpText> = (args) => (
  <>
    <HelpText {...args}>HelpText without severity prop</HelpText>
    <HelpText {...args} severity={HelpTextSeverity.Danger}>
      HelpText with severity: HelpTextSeverity.Danger
    </HelpText>
    <HelpText {...args} severity={HelpTextSeverity.Success}>
      HelpText with severity: HelpTextSeverity.Success
    </HelpText>
    <HelpText {...args} severity={HelpTextSeverity.Warning}>
      HelpText with severity: HelpTextSeverity.Warning
    </HelpText>
    <HelpText {...args} severity={HelpTextSeverity.Info}>
      HelpText with severity: HelpTextSeverity.Info
    </HelpText>
  </>
);

SeverityStory.storyName = 'Severity';

export const ColorStory: StoryFn<typeof HelpText> = (args) => (
  <Box display={Display.Flex} flexDirection={FlexDirection.Column} gap={2}>
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
