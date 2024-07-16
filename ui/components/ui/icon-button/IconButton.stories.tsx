import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  IconColor,
  Size as ButtonSize,
} from '../../../helpers/constants/design-system';
import IconButton from './icon-button';

const meta: Meta<typeof IconButton> = {
  title: 'Components/ComponentLibrary/IconButton',
  component: IconButton,
  argTypes: {
    ariaLabel: {
      control: 'text',
    },
    iconName: {
      control: 'text',
    },
    size: {
      control: 'select',
      options: Object.values(ButtonSize),
    },
    color: {
      control: 'select',
      options: Object.values(IconColor),
    },
    disabled: {
      control: 'boolean',
    },
    onClick: {
      action: 'clicked',
    },
  },
  args: {
    ariaLabel: 'Icon button',
    iconName: 'add',
    size: ButtonSize.MD,
    color: IconColor.primaryDefault,
    disabled: false,
  },
};

export default meta;
type Story = StoryObj<typeof IconButton>;

export const DefaultStory: Story = {
  args: {},
};

DefaultStory.storyName = 'Default';

export const SizeStory: Story = {
  args: {},
  render: (args) => (
    <>
      <IconButton {...args} size={ButtonSize.SM} />
      <IconButton {...args} size={ButtonSize.MD} />
      <IconButton {...args} size={ButtonSize.LG} />
    </>
  ),
};

SizeStory.storyName = 'Size';

export const DisabledStory: Story = {
  args: {
    disabled: true,
  },
};

DisabledStory.storyName = 'Disabled';