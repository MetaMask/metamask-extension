import React from 'react';
import { EditAccountsModal } from '.';

export default {
  title: 'Components/Multichain/EditAccountsModal',
  argTypes: {
    onClose: { action: 'onClose' },
  },
  args: {
    onClose: () => undefined,
  },
};

export const DefaultStory = (args) => <EditAccountsModal {...args} />;

DefaultStory.storyName = 'Default';
