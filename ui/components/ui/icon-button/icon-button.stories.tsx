import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import IconButton from './icon-button';
import {
  IconColor,
} from '../../../helpers/constants/design-system';
import { Icon, IconName } from '../../component-library';

const meta: Meta<typeof IconButton> = {
  title: 'Components/UI/IconButton',
  component: IconButton,
  argTypes: {
    onClick: { action: 'clicked' },
    Icon: { control: 'object' },
    disabled: { control: 'boolean' },
    label: { control: 'text' },
    tooltipRender: { control: 'function' },
    className: { control: 'text' },
    iconButtonClassName: { control: 'text' },
  },
  args: {
    onClick: () => {},
    Icon: <Icon name={IconName.Add} color={IconColor.primaryInverse} />,
    disabled: false,
    label: 'Icon Button',
    tooltipRender: undefined,
    className: '',
    iconButtonClassName: '',
  },
};

export default meta;
type Story = StoryObj<typeof IconButton>;

export const Default: Story = {};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const LongLabel: Story = {
  args: {
    label: 'This is a very long label that should trigger the tooltip',
  },
};

