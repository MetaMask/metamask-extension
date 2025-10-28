import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { userEvent } from '@testing-library/user-event';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../test/data/mock-state.json';
import { importMnemonicToVault } from '../../../store/actions';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { setShowNewSrpAddedToast } from '../../../components/app/toast-master/utils';
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
});
