import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Box, Button } from '@metamask/design-system-react';

import { AddWalletModal } from './add-wallet-modal';

const meta: Meta<typeof AddWalletModal> = {
  title: 'Components/MultichainAccounts/AddWalletModal',
  component: AddWalletModal,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    isOpen: false,
    onClose: () => console.log('Modal closed'),
  },
  render: function Story(args) {
    const [isOpen, setIsOpen] = useState(false);

    const handleOpen = () => setIsOpen(true);
    const handleClose = () => {
      setIsOpen(false);
      args.onClose?.();
    };

    return (
      <Box>
        <Button onClick={handleOpen}>Open Add Wallet Modal</Button>
        <AddWalletModal {...args} isOpen={isOpen} onClose={handleClose} />
      </Box>
    );
  },
};
