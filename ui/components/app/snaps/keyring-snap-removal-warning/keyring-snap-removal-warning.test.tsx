import React from 'react';
import { waitFor, fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import { Snap } from '@metamask/snaps-utils';
import mockStore from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/jest';
import { toChecksumHexAddress } from '../../../../../shared/modules/hexstring-utils';
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
      name: 'Test Account',
    },
    {
      address: '0xc5b8dbac4c1d3f152cdeb400e2313f309c410acb',
      name: 'Test Account 2',
    },
  ],
};

describe('Keyring Snap Remove Warning', () => {
  let store: any;
  beforeAll(() => {
    store = configureMockStore()(mockStore);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  it('show render the keyring snap warning and content', () => {
    const { getByText } = renderWithProvider(
      <KeyringSnapRemovalWarning {...defaultArgs} />,
      store,
    );
    expect(
      getByText(messages.backupKeyringSnapReminder.message),
    ).toBeInTheDocument();
    expect(getByText(messages.removeKeyringSnap.message)).toBeInTheDocument();

    for (const account of defaultArgs.keyringAccounts) {
      expect(getByText(account.name)).toBeInTheDocument();
      expect(
        getByText(toChecksumHexAddress(account.address)),
      ).toBeInTheDocument();
    }
  });

  it('displays the keyring snap confirmation removal modal', async () => {
    const { getByText, getByTestId, getAllByText } = renderWithProvider(
      <KeyringSnapRemovalWarning {...defaultArgs} />,
      store,
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
      const removeSnapButton = getAllByText('Remove Snap')[1];
      expect(removeSnapButton).not.toBeDisabled();
      fireEvent.click(removeSnapButton);
      expect(mockOnSubmit).toBeCalled();
    });
  });

  it('opens block explorer for account', async () => {
    global.platform = { openTab: jest.fn(), closeCurrentWindow: jest.fn() };
    const { getByText, getAllByTestId } = renderWithProvider(
      <KeyringSnapRemovalWarning {...defaultArgs} />,
      store,
    );

    const getAccountsToBeRemoved = getAllByTestId('keyring-account-list-item');
    expect(getAccountsToBeRemoved.length).toBe(2);

    expect(getByText(defaultArgs.keyringAccounts[0].name)).toBeInTheDocument();
    expect(getByText(defaultArgs.keyringAccounts[1].name)).toBeInTheDocument();

    const accountLink = getAllByTestId('keyring-account-link');

    fireEvent.click(accountLink[0]);

    await waitFor(() => {
      expect(global.platform.openTab).toHaveBeenCalled();
    });
  });
  describe('#onBack', () => {
    it('will dismiss modal if modal is showing accounts', async () => {
      const { getByLabelText } = renderWithProvider(
        <KeyringSnapRemovalWarning {...defaultArgs} />,
        store,
      );

      const backButton = getByLabelText('Back');

      fireEvent.click(backButton);

      await waitFor(() => {
        expect(mockOnBack).toHaveBeenCalled();
      });
    });

    it('it will return to account list if modal is showing confirmation', async () => {
      const { getByText, getByLabelText } = renderWithProvider(
        <KeyringSnapRemovalWarning {...defaultArgs} />,
        store,
      );

      const continueButton = getByText('Continue');

      fireEvent.click(continueButton);

      const backButton = getByLabelText('Back');

      fireEvent.click(backButton);

      await waitFor(() => {
        expect(mockOnBack).not.toHaveBeenCalled();
      });
    });
  });
});
