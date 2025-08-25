import React, { useState } from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { AddressQRCodeModal } from './address-qr-code-modal';
import { Button } from '@metamask/design-system-react';

const meta: Meta<typeof AddressQRCodeModal> = {
  title: 'Components/MultichainAccounts/AddressQRCodeModal',
  component: AddressQRCodeModal,
};

export default meta;

type Story = StoryObj<typeof AddressQRCodeModal>;

export const Default: Story = {
  render: function DefaultStory(args) {
    const [isOpen, setIsOpen] = useState(true);
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
        <AddressQRCodeModal
          {...args}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      </>
    );
  },
};
