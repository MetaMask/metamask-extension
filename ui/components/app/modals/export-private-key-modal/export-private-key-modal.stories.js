import React from 'react';
import ExportPrivateKeyModal from '.';

export default {
  title: 'Components/App/Modals/ExportPrivateKeyModal',
  id: __filename,
  argTypes: {
    exportAccount: {
      action: 'exportAccount',
    },
    selectedIdentity: {
      control: 'object',
    },
    warning: {
      control: 'node',
    },
    showAccountDetailModal: {
      action: 'showAccountDetailModal',
    },
    hideModal: {
      action: 'hideModal',
    },
    hideWarning: {
      action: 'hideWarning',
    },
    clearAccountDetails: {
      action: 'clearAccountDetails',
    },
    previousModalState: {
      control: 'text',
    },
  },
};

export const DefaultStory = (args) => <ExportPrivateKeyModal {...args} />;

DefaultStory.storyName = 'Default';
