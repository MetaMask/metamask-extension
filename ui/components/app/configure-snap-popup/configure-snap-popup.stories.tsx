import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../../component-library';
import ConfigureSnapPopup, {
  ConfigureSnapPopupType,
} from './configure-snap-popup';

const meta: Meta<typeof ConfigureSnapPopup> = {
  title: 'Components/App/ConfigureSnapPopup',
  component: ConfigureSnapPopup,
  argTypes: {
    type: {
      control: {
        type: 'select',
        options: [
          ConfigureSnapPopupType.CONFIGURE,
          ConfigureSnapPopupType.INSTALL,
        ],
      },
    },
    isOpen: {
      control: {
        type: 'boolean',
      },
    },
    onClose: {
      action: 'onClose',
    },
    link: {
      control: {
        type: 'text',
      },
    },
  },
  args: {
    type: ConfigureSnapPopupType.CONFIGURE,
    link: 'https://metamask.io',
  },
};

export default meta;
type Story = StoryObj<typeof ConfigureSnapPopup>;

export const Configure: Story = {
  args: {
    type: ConfigureSnapPopupType.CONFIGURE,
  },
  render: (args) => <ConfigureSnapPopup {...args} />,
};

export const Install: Story = {
  args: {
    type: ConfigureSnapPopupType.INSTALL,
  },
  render: (args) => <ConfigureSnapPopup {...args} />,
};
