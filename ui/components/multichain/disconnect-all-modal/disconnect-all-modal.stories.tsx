import React from 'react';
import { DisconnectAllModal } from '.';

export default {
  title: 'Components/Multichain/DisconnectAllModal',
  component: DisconnectAllModal,
  argTypes: {
    onClose: { action: 'onClose' },
    onClick: { action: 'onClick' },
  },
  args: {
    onClick: () => undefined,
    onClose: () => undefined,
  },
};

export const DefaultStory = (args) => <DisconnectAllModal {...args} />;

DefaultStory.storyName = 'Default';
