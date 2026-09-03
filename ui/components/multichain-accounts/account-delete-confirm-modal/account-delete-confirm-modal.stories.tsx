import React, { useState } from 'react';
import { StoryFn, Meta } from '@storybook/react';
import { Button } from '@metamask/design-system-react';
import {
  AccountDeleteConfirmModal,
  AccountDeleteConfirmModalProps,
} from './account-delete-confirm-modal';

export default {
  title: 'Components/MultichainAccounts/AccountDeleteConfirmModal',
  component: AccountDeleteConfirmModal,
  parameters: {
    docs: {
      description: {
        component:
          'A modal for confirming removal of an imported private-key account from the account list edit mode.',
      },
    },
  },
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Whether the modal is visible',
    },
    accountName: {
      control: 'text',
      description: 'Account name interpolated into the modal title',
    },
    onClose: {
      action: 'closed',
      description: 'Function called when the modal is dismissed',
    },
    onConfirm: {
      action: 'confirmed',
      description: 'Function called when the removal is confirmed',
    },
  },
} as Meta<AccountDeleteConfirmModalProps>;

const DefaultTemplate: StoryFn<AccountDeleteConfirmModalProps> = (args) => (
  <AccountDeleteConfirmModal {...args} />
);

export const Default = DefaultTemplate.bind({});
Default.args = {
  isOpen: true,
  accountName: 'Account 3',
  onClose: () => console.log('Modal closed'),
  onConfirm: () => console.log('Account removal confirmed'),
};

export const WithLongAccountName = DefaultTemplate.bind({});
WithLongAccountName.args = {
  isOpen: true,
  accountName: 'My Very Long Imported Private Key Account Name',
  onClose: () => console.log('Modal closed'),
  onConfirm: () => console.log('Account removal confirmed'),
};

const InteractiveTemplate: StoryFn = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Delete Confirm Modal</Button>
      <AccountDeleteConfirmModal
        isOpen={isOpen}
        accountName="Account 3"
        onClose={() => setIsOpen(false)}
        onConfirm={() => setIsOpen(false)}
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
