import React, { useState } from 'react';
import { StoryFn, Meta } from '@storybook/react';
import {
  AccountRemoveModal,
  AccountRemoveModalProps,
} from './account-remove-modal';
import { Button } from '../../component-library';

export default {
  title: 'Components/MultichainAccounts/AccountRemoveModal',
  component: AccountRemoveModal,
  parameters: {
    docs: {
      description: {
        component: 'A modal for confirming account removal action.',
      },
    },
  },
  argTypes: {
    onClose: {
      action: 'closed',
      description: 'Function called when the modal is closed',
    },
    onSubmit: {
      action: 'submitted',
      description: 'Function called when the removal is confirmed',
    },
  },
} as Meta<AccountRemoveModalProps>;

const DefaultTemplate: StoryFn<AccountRemoveModalProps> = (args) => (
  <AccountRemoveModal {...args} />
);

export const Default = DefaultTemplate.bind({});
Default.args = {
  isOpen: true,
  onClose: () => console.log('Modal closed'),
  onSubmit: () => console.log('Account removal confirmed'),
  accountName: 'Ledger EVM Account',
  accountAddress: '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1',
};

const InteractiveTemplate: StoryFn = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => {
    setIsOpen(false);
  };
  const handleSubmit = () => {
    setIsOpen(false);
  };

  return (
    <>
      <Button onClick={handleOpen}>Open Remove Account Modal</Button>
      <AccountRemoveModal
        isOpen={isOpen}
        onClose={handleClose}
        onSubmit={handleSubmit}
        accountName="Ledger EVM Account"
        accountAddress="0x5CfE73b6021E818B776b421B1c4Db2474086a7e1"
      />
    </>
  );
};

export const Interactive = InteractiveTemplate.bind({});
Interactive.parameters = {
  docs: {
    description: {
      story: 'Interactive modal.',
    },
  },
};
