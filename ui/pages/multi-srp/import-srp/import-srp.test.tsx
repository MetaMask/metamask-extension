import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
// eslint-disable-next-line import/no-restricted-paths
import messages from '../../../../app/_locales/en/messages.json';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { setShowNewSrpAddedToast } from '../../../components/app/toast-master/utils';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { importMnemonicToVault } from '../../../store/actions';
import { ImportSrp } from './import-srp';

jest.mock('../../../store/actions', () => ({
  importMnemonicToVault: jest.fn().mockReturnValue(
    jest.fn().mockResolvedValue({
      newAccountAddress: '0x123',
      discoveredAccounts: { Bitcoin: 0, Solana: 0 },
    }),
  ),
  showAlert: jest.fn().mockReturnValue({ type: 'ALERT_OPEN' }),
  hideAlert: jest.fn().mockReturnValue({ type: 'ALERT_CLOSE' }),
  hideWarning: jest.fn().mockReturnValue({ type: 'HIDE_WARNING' }),
}));

jest.mock('../../../components/app/toast-master/utils', () => ({
  setShowNewSrpAddedToast: jest.fn().mockImplementation((value: boolean) => ({
    type: 'SET_SHOW_NEW_SRP_ADDED_TOAST',
    payload: value,
  })),
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useNavigate: () => mockNavigate,
}));

const TEST_SEED =
  'debris dizzy just program just float decrease vacant alarm reduce speak stadium';

describe('ImportSrp', () => {
  const store = configureMockStore([thunk])(mockState);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('render matches snapshot', () => {
    const { asFragment } = renderWithProvider(<ImportSrp />, store);
    expect(asFragment()).toMatchSnapshot();
  });

  it('render header with correct title', () => {
    const { getByText } = renderWithProvider(<ImportSrp />, store);
    expect(getByText('Import Secret Recovery Phrase')).toBeInTheDocument();
  });

  it('should render import srp and disable confirm srp button', () => {
    const mockStore = configureMockStore()(mockState);
    const { queryByTestId } = renderWithProvider(<ImportSrp />, mockStore);

    const confirmSrpButton = queryByTestId('import-srp-confirm');

    expect(confirmSrpButton).toBeInTheDocument();
    expect(confirmSrpButton).toBeDisabled();
  });

  it('on correct srp is entered, import srp and navigate to default route', async () => {
    const mockStore = configureMockStore([thunk])(mockState);
    const { queryByTestId } = renderWithProvider(<ImportSrp />, mockStore);

    const srpNote = queryByTestId('srp-input-import__srp-note');
    expect(srpNote).toBeInTheDocument();

    srpNote?.focus();

    if (srpNote) {
      await userEvent.type(srpNote, TEST_SEED);
    }

    const confirmSrpButton = queryByTestId('import-srp-confirm');

    expect(confirmSrpButton).not.toBeDisabled();

    if (confirmSrpButton) {
      fireEvent.click(confirmSrpButton);
    }

    // Wait for async operations to complete
    await waitFor(() => {
      // Verify that importMnemonicToVault was called with the correct SRP
      expect(importMnemonicToVault).toHaveBeenCalledWith(TEST_SEED);
      // Verify that navigation happened after import
      expect(mockNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE);
      expect(setShowNewSrpAddedToast).toHaveBeenCalledWith(true);
    });
  });

  describe('error handling', () => {
    const testImportError = async (
      errorMessage: string,
      expectedErrorMessage: string,
    ) => {
      const mockStore = configureMockStore([thunk])(mockState);

      // Mock importMnemonicToVault to reject with the specified error
      (importMnemonicToVault as jest.Mock).mockReturnValueOnce(
        jest.fn().mockRejectedValue(new Error(errorMessage)),
      );

      const { queryByTestId, getByText } = renderWithProvider(
        <ImportSrp />,
        mockStore,
      );

      const srpNote = queryByTestId('srp-input-import__srp-note');
      expect(srpNote).toBeInTheDocument();

      srpNote?.focus();

      if (srpNote) {
        await userEvent.type(srpNote, TEST_SEED);
      }

      const confirmSrpButton = queryByTestId('import-srp-confirm');
      expect(confirmSrpButton).not.toBeDisabled();

      if (confirmSrpButton) {
        fireEvent.click(confirmSrpButton);
      }

      // Wait for error to be displayed
      await waitFor(() => {
        expect(getByText(expectedErrorMessage)).toBeInTheDocument();
      });

      // Verify the button is now disabled due to error
      expect(confirmSrpButton).toBeDisabled();

      // Verify navigation did not happen
      expect(mockNavigate).not.toHaveBeenCalledWith(DEFAULT_ROUTE);
      expect(setShowNewSrpAddedToast).not.toHaveBeenCalled();
    };

    it('should display duplicate account error when trying to import a duplicate account', async () => {
      await testImportError(
        'KeyringController - The account you are trying to import is a duplicate',
        messages.srpImportDuplicateAccountError.message,
      );
    });

    it('should display already imported error for any other import error', async () => {
      await testImportError(
        'Some other error',
        messages.srpAlreadyImportedError.message,
      );
    });
  });
});
