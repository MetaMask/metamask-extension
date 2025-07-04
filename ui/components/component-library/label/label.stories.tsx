import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  Display,
  FlexDirection,
  AlignItems,
  IconColor,
} from '../../../helpers/constants/design-system';

import { Label } from './label';

import README from './README.mdx';
import { Icon, IconName, IconSize } from '../icon';
import { Box } from '../box';
import { TextField } from '../text-field';

const meta: Meta<typeof Label> = {
  component: Label,
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
};

export default meta;
type Story = StoryObj<typeof Label>;

export const DefaultStory: Story = {
  name: 'Default',
  render: (args) => <Label {...args} />,
};

export const Children: Story = {
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

export const HtmlFor: Story = {
  args: {
    children: 'Network name',
    htmlFor: 'add-network',
  },
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
};
