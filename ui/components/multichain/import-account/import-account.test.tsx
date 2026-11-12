import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../test/data/mock-state.json';
import * as actions from '../../../store/actions';
import {
  MetaMetricsEventAccountImportType,
  MetaMetricsEventAccountType,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { ImportAccount } from './import-account';

jest.mock('../../../store/actions', () => ({
  importNewAccount: jest.fn(),
  checkIsSeedlessPasswordOutdated: jest.fn(),
}));

const mockTrackEvent = jest.fn();

jest.mock('../../../hooks/useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../../../shared/lib/analytics/create-event-builder',
  );

  return {
    useAnalytics: () => ({
      trackEvent: mockTrackEvent,
      createEventBuilder,
    }),
  };
});

const mockedActions = jest.mocked(actions);

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

const mockOnActionComplete = jest.fn();

const getImportButton = () =>
  screen.getByRole('button', { name: messages.import.message });

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
      const { getByLabelText, getByRole, queryByText } = renderImportAccount();

      expect(
        queryByText(messages.ethereumAndEvms.message),
      ).not.toBeInTheDocument();
      expect(
        getByRole('button', { name: messages.privateKey.message }),
      ).toHaveAttribute('aria-pressed', 'true');
      expect(
        getByLabelText(messages.enterYourPrivateKey.message),
      ).toBeInTheDocument();
    });

    it('renders import account message with help link', () => {
      const { getByRole } = renderImportAccount();

      // Check that the help link is present
      const helpLink = getByRole('link', {
        name: messages.learnMoreUpperCase.message,
      });
      expect(helpLink).toBeInTheDocument();
      expect(helpLink).toHaveAttribute(
        'href',
        expect.stringContaining('support.metamask.io'),
      );
    });

    it('renders private key view when "Private key" is selected', () => {
      const { getByLabelText } = renderImportAccount();

      expect(
        getByLabelText(messages.enterYourPrivateKey.message),
      ).toBeInTheDocument();
    });
  });

  describe('import type toggle', () => {
    it('switches to JSON import view when JSON file is selected', async () => {
      const { getByRole, queryByLabelText, getByTestId } =
        renderImportAccount();

      fireEvent.click(getByRole('button', { name: messages.jsonFile.message }));

      await waitFor(() => {
        expect(
          queryByLabelText(messages.enterYourPrivateKey.message),
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
        messages.enterYourPrivateKey.message,
      );
      fireEvent.change(privateKeyInput, {
        target: { value: '0xabcdef1234567890' },
      });
      const importButton = getImportButton();
      fireEvent.click(importButton);
      // Ensure error is shown
      await waitFor(() => {
        expect(queryByText('Test error')).toBeInTheDocument();
      });

      fireEvent.click(getByRole('button', { name: messages.jsonFile.message }));

      await waitFor(() => {
        expect(queryByText('Test error')).not.toBeInTheDocument();
      });
    });
  });

  describe('private key import', () => {
    it('calls importNewAccount with private key strategy', async () => {
      mockedActions.importNewAccount.mockReturnValue((() =>
        Promise.resolve({
          internalAccounts: { selectedAccount: 'mock-account-id' },
        })) as unknown as ReturnType<typeof actions.importNewAccount>);

      const { getByLabelText, getByText } = renderImportAccount();

      const privateKeyInput = getByLabelText(
        messages.enterYourPrivateKey.message,
      );
      const testPrivateKey = '0xabcdef1234567890';

      fireEvent.change(privateKeyInput, { target: { value: testPrivateKey } });

      const importButton = getImportButton();
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
      mockedActions.importNewAccount.mockReturnValue((() =>
        Promise.resolve({
          internalAccounts: { selectedAccount: 'mock-account-id' },
        })) as unknown as ReturnType<typeof actions.importNewAccount>);

      const { getByLabelText, getByText } = renderImportAccount();

      const privateKeyInput = getByLabelText(
        messages.enterYourPrivateKey.message,
      );
      fireEvent.change(privateKeyInput, {
        target: { value: '0xabcdef1234567890' },
      });

      const importButton = getImportButton();
      fireEvent.click(importButton);

      await waitFor(() => {
        expect(mockOnActionComplete).toHaveBeenCalledWith(true);
      });
    });

    it('displays warning when import fails without selected account', async () => {
      mockedActions.importNewAccount.mockReturnValue((() =>
        Promise.resolve({
          internalAccounts: { selectedAccount: null },
        })) as unknown as ReturnType<typeof actions.importNewAccount>);

      const { getByLabelText, getByText, queryByText } = renderImportAccount();

      const privateKeyInput = getByLabelText(
        messages.enterYourPrivateKey.message,
      );
      fireEvent.change(privateKeyInput, {
        target: { value: '0xabcdef1234567890' },
      });

      const importButton = getImportButton();
      fireEvent.click(importButton);

      await waitFor(() => {
        expect(
          queryByText(messages.importAccountError.message),
        ).toBeInTheDocument();
      });
    });

    it('displays warning when import throws an error', async () => {
      mockedActions.importNewAccount.mockReturnValue((() =>
        Promise.reject(
          new Error('Invalid private key'),
        )) as unknown as ReturnType<typeof actions.importNewAccount>);

      const { getByLabelText, getByText, queryByText } = renderImportAccount();

      const privateKeyInput = getByLabelText(
        messages.enterYourPrivateKey.message,
      );
      fireEvent.change(privateKeyInput, {
        target: { value: 'invalid-key' },
      });

      const importButton = getImportButton();
      fireEvent.click(importButton);

      await waitFor(() => {
        expect(queryByText('Invalid private key')).toBeInTheDocument();
      });
    });

    it('tracks a failed private key import with the private key import type', async () => {
      mockedActions.importNewAccount.mockReturnValue(() =>
        Promise.reject(new Error('Invalid private key')),
      );

      const { getByLabelText, getByText } = renderImportAccount();

      const privateKeyInput = getByLabelText(
        messages.enterYourPrivateKey.message,
      );
      fireEvent.change(privateKeyInput, {
        target: { value: 'invalid-key' },
      });

      fireEvent.click(getImportButton());

      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledTimes(1);
      });

      expect(mockTrackEvent).toHaveBeenCalledWith({
        name: MetaMetricsEventName.AccountAddFailed,
        properties: {
          category: MetaMetricsEventCategory.Accounts,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          account_type: MetaMetricsEventAccountType.Imported,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          account_import_type: MetaMetricsEventAccountImportType.PrivateKey,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          hd_entropy_index: 0,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          is_suggested_name: true,
        },
        sensitiveProperties: {},
      });
    });

    it('tracks a failed json import with the json import type', async () => {
      mockedActions.importNewAccount.mockReturnValue(() =>
        Promise.reject(new Error('Invalid JSON file')),
      );

      const { getByRole, getByTestId, getByText } = renderImportAccount();

      fireEvent.click(getByRole('button', { name: messages.jsonFile.message }));

      const fileInput = getByTestId('file-input');
      const mockFile = new File(['0'], 'test.json');

      fireEvent.change(fileInput, {
        target: { files: [mockFile] },
      });

      await waitFor(() => {
        expect(getImportButton()).not.toBeDisabled();
      });

      fireEvent.click(getImportButton());

      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledTimes(1);
      });

      expect(mockTrackEvent).toHaveBeenCalledWith({
        name: MetaMetricsEventName.AccountAddFailed,
        properties: {
          category: MetaMetricsEventCategory.Accounts,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          account_type: MetaMetricsEventAccountType.Imported,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          account_import_type: MetaMetricsEventAccountImportType.Json,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          hd_entropy_index: 0,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          is_suggested_name: true,
        },
        sensitiveProperties: {},
      });
    });

    it('disables import button when private key input is empty', () => {
      const { getByText } = renderImportAccount();

      const importButton = getImportButton();
      expect(importButton).toBeDisabled();
    });

    it('enables import button when private key is entered', () => {
      const { getByLabelText, getByText } = renderImportAccount();

      const privateKeyInput = getByLabelText(
        messages.enterYourPrivateKey.message,
      );
      fireEvent.change(privateKeyInput, {
        target: { value: '0xabcdef1234567890' },
      });

      const importButton = getImportButton();
      expect(importButton).not.toBeDisabled();
    });
  });

  describe('JSON import password errors', () => {
    const rejectWithPassphraseError = () => {
      mockedActions.importNewAccount.mockReturnValue((() =>
        Promise.reject(
          new Error('Key derivation failed - possibly wrong passphrase'),
        )) as unknown as ReturnType<typeof actions.importNewAccount>);
    };

    const selectJsonFile = async () => {
      fireEvent.click(
        screen.getByRole('button', { name: messages.jsonFile.message }),
      );
      fireEvent.change(screen.getByTestId('file-input'), {
        target: { files: [new File(['{}'], 'test.json')] },
      });
      await waitFor(() => {
        expect(getImportButton()).not.toBeDisabled();
      });
    };

    it('tells the user a blank attempt needs a password', async () => {
      rejectWithPassphraseError();
      const { getByLabelText, queryByText } = renderImportAccount();

      await selectJsonFile();
      fireEvent.click(getImportButton());

      await waitFor(() => {
        expect(
          queryByText(messages.jsonImportPasswordRequired.message),
        ).toBeInTheDocument();
      });
      expect(
        getByLabelText(messages.enterOptionalPassword.message),
      ).toHaveAttribute('aria-describedby', 'json-password-error');

      fireEvent.change(getByLabelText(messages.enterOptionalPassword.message), {
        target: { value: 'a' },
      });

      expect(
        queryByText(messages.jsonImportPasswordRequired.message),
      ).not.toBeInTheDocument();
    });

    it('says a typed password did not work after a blank attempt failed', async () => {
      rejectWithPassphraseError();
      const { getByLabelText, queryByText } = renderImportAccount();

      await selectJsonFile();
      fireEvent.click(getImportButton());

      await waitFor(() => {
        expect(
          queryByText(messages.jsonImportPasswordRequired.message),
        ).toBeInTheDocument();
      });

      fireEvent.change(getByLabelText(messages.enterOptionalPassword.message), {
        target: { value: 'wrong-password' },
      });
      fireEvent.click(getImportButton());

      await waitFor(() => {
        expect(
          queryByText(messages.jsonImportPasswordIncorrect.message),
        ).toBeInTheDocument();
      });
      expect(
        queryByText(messages.jsonImportPasswordIncorrectOrOptional.message),
      ).not.toBeInTheDocument();
    });

    it('mentions a blank password when the first attempt already had one', async () => {
      rejectWithPassphraseError();
      const { getByLabelText, queryByText } = renderImportAccount();

      await selectJsonFile();
      fireEvent.change(getByLabelText(messages.enterOptionalPassword.message), {
        target: { value: 'wrong-password' },
      });
      fireEvent.click(getImportButton());

      await waitFor(() => {
        expect(
          queryByText(messages.jsonImportPasswordIncorrectOrOptional.message),
        ).toBeInTheDocument();
      });
    });

    it('does not show a passphrase failure from a private key import under the password field', async () => {
      rejectWithPassphraseError();
      const { getByLabelText, queryByText } = renderImportAccount();

      fireEvent.change(getByLabelText(messages.enterYourPrivateKey.message), {
        target: { value: '0xabcdef1234567890' },
      });
      fireEvent.click(getImportButton());

      await waitFor(() => {
        expect(
          queryByText('Key derivation failed - possibly wrong passphrase'),
        ).toBeInTheDocument();
      });
      expect(
        queryByText(messages.jsonImportPasswordRequired.message),
      ).not.toBeInTheDocument();
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
        messages.enterYourPrivateKey.message,
      );
      fireEvent.change(privateKeyInput, {
        target: { value: '0xabcdef1234567890' },
      });

      const importButton = getImportButton();
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
        messages.enterYourPrivateKey.message,
      );
      fireEvent.change(privateKeyInput, {
        target: { value: '0xabcdef1234567890' },
      });

      const importButton = getImportButton();
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
        messages.enterYourPrivateKey.message,
      );
      fireEvent.change(privateKeyInput, {
        target: { value: '0xabcdef1234567890' },
      });

      const importButton = getImportButton();
      fireEvent.click(importButton);

      await waitFor(() => {
        expect(
          // The translateWarning function should process the i18n key
          queryByText(messages.importAccountErrorIsSRP.message),
        ).toBeInTheDocument();
      });
    });
  });
});
