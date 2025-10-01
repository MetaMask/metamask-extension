import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import mockState from '../../../../test/data/mock-state.json';
import { MULTICHAIN_WALLET_DETAILS_PAGE_ROUTE } from '../../../helpers/constants/routes';
import { MultichainAccountDetailsPage } from './multichain-account-details-page';

const backButtonTestId = 'back-button';
const accountDetailsRowAccountNameTestId = 'account-details-row-account-name';
const accountDetailsRowNetworksTestId = 'account-details-row-networks';
const accountDetailsRowPrivateKeysTestId = 'account-details-row-private-keys';
const accountDetailsRowSmartAccountTestId = 'account-details-row-smart-account';
const accountDetailsRowWalletTestId = 'account-details-row-wallet';
const accountDetailsRowSecretRecoveryPhraseTestId = 'multichain-srp-backup';
const accountNameInputDataTestId = 'account-name-input';

const mockHistoryPush = jest.fn();
const mockHistoryGoBack = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({
    push: mockHistoryPush,
    goBack: mockHistoryGoBack,
  }),
  useParams: () => ({
    id: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0',
  }),
}));

const mockDispatch = jest.fn();

jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');
  return {
    ...actual,
    useDispatch: () => mockDispatch,
  };
});

const reactRouterDom = jest.requireMock('react-router-dom');

describe('MultichainAccountDetailsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    reactRouterDom.useParams = () => ({
      id: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0',
    });
  });

  const mockStore = configureMockStore([thunk])(mockState);

  const renderComponent = () => {
    return renderWithProvider(<MultichainAccountDetailsPage />, mockStore);
  };

  it('renders the page with account details sections', () => {
    renderComponent();

    expect(
      screen.getByTestId(accountDetailsRowAccountNameTestId),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(accountDetailsRowNetworksTestId),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(accountDetailsRowPrivateKeysTestId),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(accountDetailsRowSmartAccountTestId),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(accountDetailsRowWalletTestId),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(accountDetailsRowSecretRecoveryPhraseTestId),
    ).toBeInTheDocument();
  });

  it('displays the address count from the selector', () => {
    renderComponent();

    expect(screen.getByText(/10 addresses/iu)).toBeInTheDocument();
  });

  it('calls history.goBack when back button is clicked', () => {
    renderComponent();

    const backButton = screen.getByTestId(backButtonTestId);
    fireEvent.click(backButton);

    expect(mockHistoryGoBack).toHaveBeenCalledTimes(1);
  });

  it('calls history.push with wallet route when wallet row is clicked', () => {
    renderComponent();

    const walletRow = screen.getByTestId(accountDetailsRowWalletTestId);
    fireEvent.click(walletRow);

    expect(mockHistoryPush).toHaveBeenCalledTimes(1);
    expect(mockHistoryPush).toHaveBeenCalledWith(
      `${MULTICHAIN_WALLET_DETAILS_PAGE_ROUTE}/entropy%3A01JKAF3DSGM3AB87EM9N0K41AJ`,
    );
  });

  it('does not render remove account section for Entropy wallet type', () => {
    renderComponent();

    expect(screen.queryByText(/remove account/iu)).not.toBeInTheDocument();
  });

  it('does not render remove account section for Snap wallet type', () => {
    reactRouterDom.useParams = () => ({
      id: 'snap:local:snap-id/0xb552685e3d2790efd64a175b00d51f02cdafee5d',
    });

    renderComponent();

    expect(screen.queryByText(/remove account/iu)).not.toBeInTheDocument();
  });

  it('renders remove account section for Keyring wallet type', () => {
    reactRouterDom.useParams = () => ({
      id: 'keyring:Ledger Hardware/0xc42edfcc21ed14dda456aa0756c153f7985d8813',
    });

    renderComponent();

    expect(screen.getByText(/remove account/iu)).toBeInTheDocument();
  });

  it('opens account rename modal when account name action button is clicked', () => {
    renderComponent();

    const accountNameActionButton = screen.getByTestId('account-name-action');
    fireEvent.click(accountNameActionButton);

    expect(screen.getByText(/rename/iu)).toBeInTheDocument();
    expect(screen.getByTestId(accountNameInputDataTestId)).toBeInTheDocument();
  });

  it('closes account rename modal when close button is clicked', () => {
    renderComponent();

    const accountNameActionButton = screen.getByTestId('account-name-action');
    fireEvent.click(accountNameActionButton);

    expect(screen.getByText(/rename/iu)).toBeInTheDocument();

    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);

    expect(screen.queryByText(/rename/iu)).not.toBeInTheDocument();
  });

  it('opens account remove modal when remove account action button is clicked', () => {
    reactRouterDom.useParams = () => ({
      id: 'keyring:Ledger Hardware/0xc42edfcc21ed14dda456aa0756c153f7985d8813',
    });

    renderComponent();

    const removeAccountActionButton = screen.getByTestId(
      'account-remove-action',
    );
    fireEvent.click(removeAccountActionButton);

    expect(screen.getByText(/will be removed/iu)).toBeInTheDocument();
  });

  it('closes account remove modal when close button is clicked', () => {
    reactRouterDom.useParams = () => ({
      id: 'keyring:Ledger Hardware/0xc42edfcc21ed14dda456aa0756c153f7985d8813',
    });

    renderComponent();

    const removeAccountActionButton = screen.getByTestId(
      'account-remove-action',
    );
    fireEvent.click(removeAccountActionButton);

    expect(screen.getByText(/will be removed/iu)).toBeInTheDocument();

    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);

    expect(screen.queryByText(/will be removed/iu)).not.toBeInTheDocument();
  });

  it('calls removeAccount action when remove account button is clicked', () => {
    reactRouterDom.useParams = () => ({
      id: 'keyring:Ledger Hardware/0xc42edfcc21ed14dda456aa0756c153f7985d8813',
    });

    renderComponent();

    const removeAccountActionButton = screen.getByTestId(
      'account-remove-action',
    );
    fireEvent.click(removeAccountActionButton);

    const removeButton = screen.getByText('Remove');
    fireEvent.click(removeButton);

    // Verify that dispatch was called with removeAccount action
    expect(mockDispatch).toHaveBeenCalledTimes(2);

    // First call should be the removeAccount thunk (AsyncFunction)
    expect(mockDispatch).toHaveBeenNthCalledWith(1, expect.any(Function));

    // Second call should be setAccountDetailsAddress action
    expect(mockDispatch).toHaveBeenNthCalledWith(2, {
      type: 'SET_ACCOUNT_DETAILS_ADDRESS',
      payload: '',
    });
  });
});
