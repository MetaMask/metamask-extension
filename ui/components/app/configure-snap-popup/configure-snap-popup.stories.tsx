import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { useArgs } from '@storybook/client-api';
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
  render: (args) => {
    const [{ isOpen }, updateArgs] = useArgs();
    const handleClose = () => {
      updateArgs({ isOpen: false });
    };
    const handleOpen = () => {
      updateArgs({ isOpen: true });
    };
    return (
      <div>
        <Button onClick={handleOpen}>Open</Button>
        <ConfigureSnapPopup {...args} isOpen={isOpen} onClose={handleClose} />
      </div>
    );
  },
};

export const Install: Story = {
  args: {
    type: ConfigureSnapPopupType.INSTALL,
  },
  render: (args) => {
    const [{ isOpen }, updateArgs] = useArgs();
    const handleClose = () => {
      updateArgs({ isOpen: false });
    };
    const handleOpen = () => {
      updateArgs({ isOpen: true });
    };
    return (
      <div>
        <Button onClick={handleOpen}>Open</Button>
        <ConfigureSnapPopup {...args} isOpen={isOpen} onClose={handleClose} />
      </div>
    );
  },
};
