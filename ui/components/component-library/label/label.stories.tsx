import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import README from './README.mdx';
import {
  Display,
  FlexDirection,
  AlignItems,
  IconColor,
} from '../../../helpers/constants/design-system';

import { Label } from './label';

import { Icon, IconName, IconSize } from '../icon';
import { Box } from '../box';
import { TextField } from '../text-field';

export default {
  title: 'Components/ComponentLibrary/Label',

  component: Label,
  tags: ['autodocs'],
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    htmlFor: {
      control: 'text',
    },
    children: {
      control: 'text',
    },
    className: {
      control: 'text',
    },
  },
  args: {
    children: 'Label',
  },
} satisfies Meta<typeof Label>;

export const DefaultStory: StoryObj<typeof Label> = {
  render: (args) => <Label {...args} />,
  name: 'Default',
};

export const Children: StoryObj<typeof Label> = {
  render: (args) => (
  <Box
    display={Display.InlineFlex}
    flexDirection={FlexDirection.Column}
    gap={2}
  >
    <Label {...args}>Plain text</Label>
    <Label {...args} display={Display.Flex} alignItems={AlignItems.flexStart}>
      Text and icon
      <Icon
        color={IconColor.iconAlternative}
        name={IconName.Info}
        size={IconSize.Inherit}
      />
    </Label>
    <Label
      {...args}
      display={Display.InlineFlex}
      flexDirection={FlexDirection.Column}
      alignItems={AlignItems.flexStart}
    >
      Label that wraps an input
      <TextField placeholder="Click label to focus" />
    </Label>
  </Box>
  ),
};

export const HtmlFor: StoryObj<typeof Label> = {
  render: (args) => {
  const [value, setValue] = useState('');
  const handleOnChange = (e) => {
    setValue(e.target.value);
  };
  return (
    <Box display={Display.InlineFlex} flexDirection={FlexDirection.Column}>
      <Label {...args} />
      <TextField
        id="add-network"
        value={value}
        onChange={handleOnChange}
        placeholder="Enter network name"
      />
    </Box>
  );
  },
  args: {
    children: 'Network name',
    htmlFor: 'add-network',
  },
};
