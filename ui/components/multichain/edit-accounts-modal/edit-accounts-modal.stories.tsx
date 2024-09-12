import React from 'react';
import { EditAccountsModal } from '.';

export default {
  title: 'Components/Multichain/EditAccountsModal',
  argTypes: {
    onClose: { action: 'onClose' },
    activeTabOrigin: { control: 'text' },
  },
  args: {
    onClose: () => undefined,
    activeTabOrigin: 'https://test.dapp',
  },
};

export const DefaultStory = (args) => <EditAccountsModal {...args} />;

DefaultStory.storyName = 'Default';
