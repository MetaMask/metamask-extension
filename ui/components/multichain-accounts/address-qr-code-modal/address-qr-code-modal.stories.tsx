import React, { useState } from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { AddressQRCodeModal } from './address-qr-code-modal';
import type { AddressQRCodeModalProps } from './address-qr-code-modal';
import { Button } from '@metamask/design-system-react';
import mockState from '../../../../test/data/mock-state.json';

const mockStore = configureStore([]);

// Use the existing accounts from mock-state.json
const mockAccounts = mockState.metamask.internalAccounts.accounts;
const createMockState = () => mockState;

const meta: Meta<typeof AddressQRCodeModal> = {
  title: 'Components/MultichainAccounts/AddressQRCodeModal',
  component: AddressQRCodeModal,
  decorators: [
    (Story) => (
      <Provider store={mockStore(createMockState())}>
        <Story />
      </Provider>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof AddressQRCodeModal>;

export const Default: Story = {
  render: function Default(args) {
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
  args: {
    address: mockAccounts['cf8dace4-9439-4bd4-b3a8-88c821c8fcb3'].address,
  },
};
