import React, { useState } from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { Button } from '@metamask/design-system-react';
import { AddressQRCodeModal } from './address-qr-code-modal';

const meta: Meta<typeof AddressQRCodeModal> = {
  title: 'Components/MultichainAccounts/AddressQRCodeModal',
  component: AddressQRCodeModal,
};

export default meta;

type Story = StoryObj<typeof AddressQRCodeModal>;

export const Default: Story = {
  render: function DefaultStory() {
    const [isOpen, setIsOpen] = useState(true);
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
        <AddressQRCodeModal
          accountName="Account 1"
          address="0xa0b86991c431e50c0dd0b653aa1e8c7b7c66f5e4b"
          networkName="Ethereum"
          networkImageSrc="./images/eth_logo.svg"
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      </>
    );
  },
};

export const Solana: Story = {
  render: function SolanaStory() {
    const [isOpen, setIsOpen] = useState(true);
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
        <AddressQRCodeModal
          accountName="Account 1"
          address="Dh9ZYBBCdD5FjjgKpAi9w9GQvK4f8k3b8a8HHKhz7kLa"
          networkName="Solana"
          networkImageSrc="./images/solana-logo.svg"
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      </>
    );
  },
};

export const Bitcoin: Story = {
  render: function BitcoinStory() {
    const [isOpen, setIsOpen] = useState(true);
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
        <AddressQRCodeModal
          accountName="Account 1"
          address="bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
          networkName="Bitcoin"
          networkImageSrc="./images/bitcoin-logo.svg"
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      </>
    );
  },
};

export const UnknownNetwork: Story = {
  render: function BitcoinStory() {
    const [isOpen, setIsOpen] = useState(true);
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
        <AddressQRCodeModal
          accountName="Account 1"
          address="0x0000000000000000000000000000000000000000"
          networkName="Unknown Network"
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      </>
    );
  },
};
