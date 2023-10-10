import React from 'react';
import ExportPrivateKeyModal from './export-private-key-modal.component';

export default {
  title: 'Components/App/Modals/ExportPrivateKeyModal',
  id: __filename,
  component: ExportPrivateKeyModal,
  argTypes: {
    clearAccountDetails: {
      action: 'clearAccountDetails',
    },
    hideModal: {
      action: 'hideModal',
    },
    hideWarning: {
      action: 'hideWarning',
    },
    previousModalState: {
      control: 'select',
      options: [undefined, 'ACCOUNT_DETAILS', 'OTHER'],
    },
    showAccountDetailModal: {
      action: 'showAccountDetailModal',
    },
    warning: {
      control: 'text',
    },
  },
  args: {
    exportAccount: async () =>
      '0x0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789',
    selectedIdentity: { name: 'Example account', address: '0x1234' },
  },
};

const Template = (args) => {
  return <ExportPrivateKeyModal {...args} />;
};

export const DefaultStory = Template.bind({});

DefaultStory.storyName = 'Default';

export const InvalidPassword = Template.bind({});
InvalidPassword.args = {
  exportAccount: async () => {
    throw new Error('Invalid password');
  },
};

InvalidPassword.storyName = 'InvalidPassword';
