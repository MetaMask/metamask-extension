import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { fireEvent, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../test/data/mock-state.json';
import * as actions from '../../../store/actions';
// eslint-disable-next-line import/no-restricted-paths
import { importAccountErrorIsSRP } from '../../../../app/_locales/en/messages.json';
import { ImportAccount } from './import-account';

jest.mock('../../../store/actions', () => ({
  importNewAccount: jest.fn(),
  checkIsSeedlessPasswordOutdated: jest.fn(),
}));

const mockedActions = jest.mocked(actions);

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

const mockOnActionComplete = jest.fn();

const renderImportAccount = (storeState: typeof mockState = mockState) => {
  const store = mockStore(storeState);
  return renderWithProvider(
    <ImportAccount onActionComplete={mockOnActionComplete} />,
    store,
  );
};

describe('ImportAccount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the component with private key import by default', () => {
      const { getByText, getByLabelText } = renderImportAccount();

      expect(getByText('Select type')).toBeInTheDocument();
      expect(
        getByLabelText('Enter your private key string here:'),
      ).toBeInTheDocument();
    });

    it('renders import account message with help link', () => {
      const { getByRole } = renderImportAccount();

      // Check that the help link is present
      const helpLink = getByRole('link', { name: 'here' });
      expect(helpLink).toBeInTheDocument();
      expect(helpLink).toHaveAttribute(
        'href',
        expect.stringContaining('support.metamask.io'),
      );
    });

    it('renders private key view when "Private key" is selected', () => {
      const { getByLabelText } = renderImportAccount();

      expect(
        getByLabelText('Enter your private key string here:'),
      ).toBeInTheDocument();
    });
  });

  describe('dropdown selection', () => {
    it('switches to JSON import view when JSON File is selected', async () => {
      const { getByRole, queryByLabelText, getByTestId } =
        renderImportAccount();

      const dropdown = getByRole('combobox');
      fireEvent.change(dropdown, { target: { value: 'JSON File' } });

      await waitFor(() => {
        expect(
          queryByLabelText('Enter your private key string here:'),
        ).not.toBeInTheDocument();
        expect(getByTestId('file-input')).toBeInTheDocument();
      });
    });

    it('hides warning when switching import types', async () => {
      // Trigger error by entering private key and attempting import
      const testError = new Error('Test error');
      mockedActions.importNewAccount.mockReturnValue(() =>
        Promise.reject(testError),
      );
      const { getByLabelText, getByText, getByRole, queryByText } =
        renderImportAccount();
      const privateKeyInput = getByLabelText(
        'Enter your private key string here:',
      );
      fireEvent.change(privateKeyInput, {
        target: { value: '0xabcdef1234567890' },
      });
      const importButton = getByText('Import');
      fireEvent.click(importButton);
      // Ensure error is shown
      await waitFor(() => {
        expect(queryByText('Test error')).toBeInTheDocument();
      });

      const dropdown = getByRole('combobox');
      fireEvent.change(dropdown, { target: { value: 'JSON File' } });

      await waitFor(() => {
        expect(queryByText('Test error')).not.toBeInTheDocument();
      });
    });
  });

  describe('private key import', () => {
    it('calls importNewAccount with private key strategy', async () => {
      const mockSelectedAddress = '0x1234567890abcdef';
      mockedActions.importNewAccount.mockReturnValue((() =>
        Promise.resolve({
          selectedAddress: mockSelectedAddress,
        })) as unknown as ReturnType<typeof actions.importNewAccount>);

      const { getByLabelText, getByText } = renderImportAccount();

      const privateKeyInput = getByLabelText(
        'Enter your private key string here:',
      );
      const testPrivateKey = '0xabcdef1234567890';

      fireEvent.change(privateKeyInput, { target: { value: testPrivateKey } });

      const importButton = getByText('Import');
      fireEvent.click(importButton);

      await waitFor(() => {
        expect(mockedActions.importNewAccount).toHaveBeenCalledWith(
          'privateKey',
          [testPrivateKey],
          '',
        );
      });
    });

    it('calls onActionComplete on successful import', async () => {
      const mockSelectedAddress = '0x1234567890abcdef';
      mockedActions.importNewAccount.mockReturnValue((() =>
        Promise.resolve({
          selectedAddress: mockSelectedAddress,
        })) as unknown as ReturnType<typeof actions.importNewAccount>);

      const { getByLabelText, getByText } = renderImportAccount();

      const privateKeyInput = getByLabelText(
        'Enter your private key string here:',
      );
      fireEvent.change(privateKeyInput, {
        target: { value: '0xabcdef1234567890' },
      });

      const importButton = getByText('Import');
      fireEvent.click(importButton);

      await waitFor(() => {
        expect(mockOnActionComplete).toHaveBeenCalledWith(true);
      });
    });

    it('displays warning when import fails without selected address', async () => {
      mockedActions.importNewAccount.mockReturnValue((() =>
        Promise.resolve({
          selectedAddress: null,
        })) as unknown as ReturnType<typeof actions.importNewAccount>);

      const { getByLabelText, getByText, queryByText } = renderImportAccount();

      const privateKeyInput = getByLabelText(
        'Enter your private key string here:',
      );
      fireEvent.change(privateKeyInput, {
        target: { value: '0xabcdef1234567890' },
      });

      const importButton = getByText('Import');
      fireEvent.click(importButton);

      await waitFor(() => {
        expect(queryByText('Error importing account.')).toBeInTheDocument();
      });
    });

    it('displays warning when import throws an error', async () => {
      mockedActions.importNewAccount.mockReturnValue((() =>
        Promise.reject(
          new Error('Invalid private key'),
        )) as unknown as ReturnType<typeof actions.importNewAccount>);

      const { getByLabelText, getByText, queryByText } = renderImportAccount();

      const privateKeyInput = getByLabelText(
        'Enter your private key string here:',
      );
      fireEvent.change(privateKeyInput, {
        target: { value: 'invalid-key' },
      });

      const importButton = getByText('Import');
      fireEvent.click(importButton);

      await waitFor(() => {
        expect(queryByText('Invalid private key')).toBeInTheDocument();
      });
    });

    it('disables import button when private key input is empty', () => {
      const { getByText } = renderImportAccount();

      const importButton = getByText('Import');
      expect(importButton).toBeDisabled();
    });

    it('enables import button when private key is entered', () => {
      const { getByLabelText, getByText } = renderImportAccount();

      const privateKeyInput = getByLabelText(
        'Enter your private key string here:',
      );
      fireEvent.change(privateKeyInput, {
        target: { value: '0xabcdef1234567890' },
      });

      const importButton = getByText('Import');
      expect(importButton).not.toBeDisabled();
    });
  });

  describe('cancel action', () => {
    it('calls onActionComplete when cancel button is clicked', () => {
      const { getByText } = renderImportAccount();

      const cancelButton = getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnActionComplete).toHaveBeenCalled();
    });
  });

  describe('KeyringController error handling', () => {
    it('handles KeyringController errors by trimming the prefix and displaying warning', async () => {
      const keyringError = new Error(
        'KeyringController - The account you are trying to import is a duplicate',
      );
      mockedActions.importNewAccount.mockReturnValue((() =>
        Promise.reject(keyringError)) as unknown as ReturnType<
        typeof actions.importNewAccount
      >);

      const { getByLabelText, getByText, queryByText } = renderImportAccount();

      const privateKeyInput = getByLabelText(
        'Enter your private key string here:',
      );
      fireEvent.change(privateKeyInput, {
        target: { value: '0xabcdef1234567890' },
      });

      const importButton = getByText('Import');
      fireEvent.click(importButton);

      await waitFor(() => {
        expect(
          queryByText('The account you are trying to import is a duplicate'),
        ).toBeInTheDocument();
      });
    });

    it('handles non-KeyringController errors normally', async () => {
      const regularError = new Error('Some other error');
      mockedActions.importNewAccount.mockReturnValue((() =>
        Promise.reject(regularError)) as unknown as ReturnType<
        typeof actions.importNewAccount
      >);

      const { getByLabelText, getByText, queryByText } = renderImportAccount();

      const privateKeyInput = getByLabelText(
        'Enter your private key string here:',
      );
      fireEvent.change(privateKeyInput, {
        target: { value: '0xabcdef1234567890' },
      });

      const importButton = getByText('Import');
      fireEvent.click(importButton);

      await waitFor(() => {
        expect(queryByText('Some other error')).toBeInTheDocument();
      });
    });

    it('handles KeyringController errors with i18n message format', async () => {
      const keyringError = new Error(
        "KeyringController - t('importAccountErrorIsSRP')",
      );
      mockedActions.importNewAccount.mockReturnValue((() =>
        Promise.reject(keyringError)) as unknown as ReturnType<
        typeof actions.importNewAccount
      >);

      const { getByLabelText, getByText, queryByText } = renderImportAccount();

      const privateKeyInput = getByLabelText(
        'Enter your private key string here:',
      );
      fireEvent.change(privateKeyInput, {
        target: { value: '0xabcdef1234567890' },
      });

      const importButton = getByText('Import');
      fireEvent.click(importButton);

      await waitFor(() => {
        expect(
          // The translateWarning function should process the i18n key
          queryByText(importAccountErrorIsSRP.message),
        ).toBeInTheDocument();
      });
    });
  });
});
