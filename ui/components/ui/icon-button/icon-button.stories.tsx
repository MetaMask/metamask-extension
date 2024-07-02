import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import IconButton from './icon-button';
import { TextVariant } from '../../../helpers/constants/design-system';
import Tooltip from '../tooltip/tooltip';

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
  },
  args: {
    onClick: () => {},
    Icon: <div>Icon</div>,
    disabled: false,
    label: 'Icon Button',
    tooltipRender: undefined,
    className: '',
  },
};

export default meta;
type Story = StoryObj<typeof IconButton>;

export const Default: Story = {};

Default.storyName = 'Default';
