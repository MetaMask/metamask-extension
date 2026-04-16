import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import IconButton from './icon-button';
import { IconColor } from '../../../helpers/constants/design-system';
import Tooltip from '../tooltip/tooltip';
import { Icon, IconName } from '../../component-library';

const meta: Meta<typeof IconButton> = {
  title: 'Components/UI/IconButton',
  component: IconButton,
  argTypes: {
    onClick: { action: 'clicked' },
    Icon: { control: 'object' },
    disabled: { control: 'boolean' },
    label: { control: 'text' },
    className: { control: 'text' },
  },
  args: {
    onClick: () => {},
    Icon: <Icon name={IconName.Send} />,
    disabled: false,
    label: 'Send',
    className: '',
  },
};

export default meta;
type Story = StoryObj<typeof IconButton>;

export const Default: Story = {};

export const WithLongLabel: Story = {
  args: {
    label: 'This is a very long button label that should be truncated',
  },
};

// Test case: Emulate "Bridge button disabled when chain is unsupported"
export const UnsupportedNetwork: Story = {
  args: {
    label: 'Bridge',
    disabled: true,
    Icon: <Icon name={IconName.Bridge} color={IconColor.iconDefault} />,
    tooltipRender: (content) => {
      // This matches exactly what the test expects
      const buttonWithAttr = React.cloneElement(content);

      return (
        <Tooltip title="Unavailable on this network" position="bottom">
          {buttonWithAttr}
        </Tooltip>
      );
    },
  },
};
