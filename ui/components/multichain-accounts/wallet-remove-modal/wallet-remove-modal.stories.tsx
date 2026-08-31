import React, { useState } from 'react';
import { Meta, StoryFn } from '@storybook/react';
import { Button } from '@metamask/design-system-react';
import {
  WalletRemoveModal,
  WalletRemoveModalProps,
} from './wallet-remove-modal';

const meta: Meta<typeof WalletRemoveModal> = {
  title: 'Components/MultichainAccounts/WalletRemoveModal',
  component: WalletRemoveModal,
  parameters: {
    docs: {
      description: {
        component: 'A modal for confirming wallet removal.',
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
    onBackupNow: {
      action: 'backupNow',
      description: 'Function called when the backup now action is clicked',
    },
    walletName: {
      control: 'text',
      description: 'Display name of the wallet being removed',
    },
    isBackedUp: {
      control: 'boolean',
      description: 'Whether the wallet is backed up',
    },
  },
};

export default meta;

const DefaultTemplate: StoryFn<WalletRemoveModalProps> = (args) => (
  <WalletRemoveModal {...args} />
);

export const Default = DefaultTemplate.bind({});
Default.args = {
  isOpen: true,
  onClose: () => console.log('Modal closed'),
  onSubmit: () => console.log('Wallet removal confirmed'),
  onBackupNow: () => console.log('Backup now clicked'),
  walletName: 'Wallet 2',
  isBackedUp: true,
};

export const NotBackedUp = DefaultTemplate.bind({});
NotBackedUp.args = {
  isOpen: true,
  onClose: () => console.log('Modal closed'),
  onSubmit: () => console.log('Wallet removal confirmed'),
  onBackupNow: () => console.log('Backup now clicked'),
  walletName: 'Wallet 2',
  isBackedUp: false,
};

const InteractiveTemplate: StoryFn = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Remove Wallet Modal</Button>
      <WalletRemoveModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSubmit={() => setIsOpen(false)}
        onBackupNow={() => console.log('Backup now clicked')}
        walletName="Wallet 2"
        isBackedUp={false}
      />
    </>
  );
};

export const Interactive = InteractiveTemplate.bind({});
Interactive.parameters = {
  docs: {
    description: {
      story: 'Interactive modal opened from a trigger button.',
    },
  },
};
