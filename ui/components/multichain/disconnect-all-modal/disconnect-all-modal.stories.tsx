import React from 'react';
import { DisconnectAllModal } from '.';

export default {
  title: 'Components/Multichain/DisconnectAllModal',
  component: DisconnectAllModal,
  argTypes: {
    onClose: { action: 'onClose' },
    onClick: { action: 'onClick' },
    origin: { control: 'text' },
  },
  args: {
    onClick: () => undefined,
    onClose: () => undefined,
    origin: 'https://example.com',
  },
};

export const DefaultStory = (args) => <DisconnectAllModal {...args} />;

DefaultStory.storyName = 'Default';
