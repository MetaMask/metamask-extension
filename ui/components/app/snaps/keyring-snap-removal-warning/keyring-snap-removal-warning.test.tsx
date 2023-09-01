import React from 'react';
import { waitFor, fireEvent } from '@testing-library/react';
import { Snap } from '@metamask/snaps-utils';
import { renderWithProvider } from '../../../../../test/jest';
import messages from '../../../../../app/_locales/en/messages.json';
import KeyringSnapRemovalWarning from './keyring-snap-removal-warning';

const mockOnClose = jest.fn();
const mockOnCancel = jest.fn();
const mockOnBack = jest.fn();
const mockOnSubmit = jest.fn();

const mockSnap = {
  id: 'mock-snap-id',
  manifest: {
    proposedName: 'mock-snap',
  },
} as Snap;

const defaultArgs = {
  isOpen: true,
  snap: mockSnap,
  onClose: mockOnClose,
  onCancel: mockOnCancel,
  onBack: mockOnBack,
  onSubmit: mockOnSubmit,
  keyringAccounts: [
    {
      address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
      id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
      metadata: {
        name: 'Test Account',
        keyring: {
          type: 'HD Key Tree',
        },
      },
      options: {},
      supportedMethods: [
        'personal_sign',
        'eth_sign',
        'eth_signTransaction',
        'eth_signTypedData',
        'eth_signTypedData_v1',
        'eth_signTypedData_v3',
        'eth_signTypedData_v4',
      ],
      type: 'eip155:eoa',
    },
    {
      address: '0xc5b8dbac4c1d3f152cdeb400e2313f309c410acb',
      id: '07c2cfec-36c9-46c4-8115-3836d3ac9047',
      metadata: {
        name: 'Test Account 2',
        keyring: {
          type: 'HD Key Tree',
        },
      },
      options: {},
      supportedMethods: [
        'personal_sign',
        'eth_sign',
        'eth_signTransaction',
        'eth_signTypedData',
        'eth_signTypedData_v1',
        'eth_signTypedData_v3',
        'eth_signTypedData_v4',
      ],
      type: 'eip155:eoa',
    },
  ],
};

describe('Keyring Snap Remove Warning', () => {
  it('show render the keyring snap warning and content', () => {
    const { getByText } = renderWithProvider(
      <KeyringSnapRemovalWarning {...defaultArgs} />,
    );
    expect(
      getByText(messages.backupKeyringSnapReminder.message),
    ).toBeInTheDocument();
    expect(getByText(messages.removeKeyringSnap.message)).toBeInTheDocument();

    for (const account of defaultArgs.keyringAccounts) {
      expect(getByText(account.metadata.name)).toBeInTheDocument();
      expect(getByText(account.address)).toBeInTheDocument();
    }
  });

  it('displays the keyring snap confirmation removal modal', async () => {
    const { getByText, getByTestId, getAllByText } = renderWithProvider(
      <KeyringSnapRemovalWarning {...defaultArgs} />,
    );

    const nextButton = getByText('Continue');

    fireEvent.click(nextButton);

    await waitFor(() => {
      // translation is broken into three pieces
      expect(getByText(/Type/u)).toBeInTheDocument();
      expect(
        getByText(mockSnap.manifest?.proposedName as string),
      ).toBeInTheDocument();
      expect(
        getByText(/to confirm you want to remove this snap:/u),
      ).toBeInTheDocument();
    });

    const confirmationInput = getByTestId('remove-snap-confirmation-input');

    fireEvent.change(confirmationInput, {
      target: { value: mockSnap.manifest?.proposedName },
    });

    await waitFor(() => {
      const removeSnapButton = getAllByText('Remove snap')[1];
      expect(removeSnapButton).not.toBeDisabled();
      fireEvent.click(removeSnapButton);
      expect(mockOnSubmit).toBeCalled();
    });
  });
});
