import React from 'react';
import { waitFor, fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/jest';
import messages from '../../../../../app/_locales/en/messages.json';
import SnapRemoveWarning from './snap-remove-warning';

const mockOnCancel = jest.fn();
const mockOnSubmit = jest.fn();
const snapName = 'test-snap';

const defaultArgs = {
  isOpen: true,
  onCancel: mockOnCancel,
  onSubmit: mockOnSubmit,
  snapName,
  snapUrl: 'test-snap-url',
};

const keyringArgs = {
  ...defaultArgs,
  keyringAccounts: [
    {
      address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
      id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
      metadata: {
        keyring: {
          type: 'HD Key Tree',
        },
      },
      name: 'Test Account',
      options: {},
      supportedMethods: [
        'personal_sign',
        'eth_sendTransaction',
        'eth_sign',
        'eth_signTransaction',
        'eth_signTypedData',
        'eth_signTypedData_v1',
        'eth_signTypedData_v2',
        'eth_signTypedData_v3',
        'eth_signTypedData_v4',
      ],
      type: 'eip155:eoa',
    },
    {
      address: '0xc5b8dbac4c1d3f152cdeb400e2313f309c410acb',
      id: '07c2cfec-36c9-46c4-8115-3836d3ac9047',
      metadata: {
        keyring: {
          type: 'HD Key Tree',
        },
      },
      name: 'Test Account 2',
      options: {},
      supportedMethods: [
        'personal_sign',
        'eth_sendTransaction',
        'eth_sign',
        'eth_signTransaction',
        'eth_signTypedData',
        'eth_signTypedData_v1',
        'eth_signTypedData_v2',
        'eth_signTypedData_v3',
        'eth_signTypedData_v4',
      ],
      type: 'eip155:eoa',
    },
  ],
};

describe('Snap Remove Warning', () => {
  describe('Snap Warning', () => {
    it('should render the snap warning and content', () => {
      const { getByText, queryByText } = renderWithProvider(
        <SnapRemoveWarning {...defaultArgs} />,
      );
      expect(getByText('Please confirm')).toBeInTheDocument();
      expect(
        getByText(`Are you sure you want to remove ${snapName}?`),
      ).toBeInTheDocument();
      expect(
        queryByText(messages.keyringAccountName.message),
      ).not.toBeInTheDocument();
    });
  });

  describe('Keyring Snap Warning', () => {
    it('show render the keyring snap warning and content', () => {
      const { getByText, queryByText } = renderWithProvider(
        <SnapRemoveWarning {...keyringArgs} />,
      );
      expect(getByText('Please confirm')).toBeInTheDocument();
      expect(
        queryByText(`Are you sure you want to remove ${snapName}?`),
      ).not.toBeInTheDocument();
      expect(
        getByText(messages.backupKeyringSnapReminder.message),
      ).toBeInTheDocument();
      expect(getByText(messages.removeKeyringSnap.message)).toBeInTheDocument();

      for (const account of keyringArgs.keyringAccounts) {
        expect(getByText(account.name)).toBeInTheDocument();
        expect(getByText(account.address)).toBeInTheDocument();
      }
    });

    it('displays the keyring snap confirmation removal modal', async () => {
      const { getByText, getByTestId } = renderWithProvider(
        <SnapRemoveWarning {...keyringArgs} />,
      );

      const nextButton = getByText('Remove snap');

      fireEvent.click(nextButton);

      await waitFor(() => {
        // translation is broken into three pieces
        expect(getByText(/Type/u)).toBeInTheDocument();
        expect(getByText(snapName)).toBeInTheDocument();
        expect(
          getByText(/to confirm you want to remove this snap:/u),
        ).toBeInTheDocument();
      });

      const confirmationInput = getByTestId('remove-snap-confirmation-input');

      fireEvent.change(confirmationInput, { target: { value: snapName } });

      await waitFor(() => {
        expect(mockOnSubmit).toBeCalled();
      });
    });
  });
});
