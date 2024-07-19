import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  IconColor,
} from '../../../helpers/constants/design-system';
import IconButton from './icon-button';
import { Icon, IconName } from '../../component-library';

const meta: Meta<typeof IconButton> = {
  title: 'Components/ComponentLibrary/IconButton',
  component: IconButton,
  argTypes: {
    ariaLabel: {
      control: 'text',
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
    color: IconColor.primaryDefault,
    disabled: false,
    Icon: <Icon name={IconName.Diagram} color={IconColor.primaryInverse} />,
    label: 'Add',
  },
};

export default meta;
type Story = StoryObj<typeof IconButton>;

export const Default: Story = {
  args: {},
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};