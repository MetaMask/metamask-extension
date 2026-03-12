import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import {
  DEFAULT_ROUTE,
  MULTICHAIN_WALLET_DETAILS_PAGE_ROUTE,
  PREVIOUS_ROUTE,
} from '../../../helpers/constants/routes';
import * as traceModule from '../../../../shared/lib/trace';
import { MultichainAccountDetailsPage } from './multichain-account-details-page';

const backButtonTestId = 'back-button';
const accountDetailsRowAccountNameTestId = 'account-details-row-account-name';
const accountDetailsRowNetworksTestId = 'account-details-row-networks';
const accountDetailsRowPrivateKeysTestId = 'account-details-row-private-keys';
const accountDetailsRowSmartAccountTestId = 'account-details-row-smart-account';
const accountDetailsRowWalletTestId = 'account-details-row-wallet';
const accountDetailsRowSecretRecoveryPhraseTestId = 'multichain-srp-backup';
const accountNameInputDataTestId = 'account-name-input';
const DEFAULT_ACCOUNT_GROUP_ID = 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0';
const LEDGER_ACCOUNT_GROUP_ID =
  'keyring:Ledger Hardware/0xc42edfcc21ed14dda456aa0756c153f7985d8813';

jest.mock('../../../../shared/lib/trace', () => ({
  ...jest.requireActual('../../../../shared/lib/trace'),
  trace: jest.fn(),
}));

const mockUseNavigate = jest.fn();
const mockUseSearchParams = jest.fn();

const setSearchParams = (
  accountGroupId: string | null = DEFAULT_ACCOUNT_GROUP_ID,
) => {
  const searchParams = new URLSearchParams();
  if (accountGroupId) {
    searchParams.set('accountGroupId', accountGroupId);
  }

  mockUseSearchParams.mockReturnValue([searchParams, jest.fn()]);
};

jest.mock('react-router-dom', () => {
  return {
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockUseNavigate,
    useSearchParams: () => mockUseSearchParams(),
  };
});

const mockDispatch = jest.fn();

jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');
  return {
    ...actual,
    useDispatch: () => mockDispatch,
  };
});

describe('MultichainAccountDetailsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setSearchParams();
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

  it('calls navigate when back button is clicked', () => {
    renderComponent();

    const backButton = screen.getByTestId(backButtonTestId);
    fireEvent.click(backButton);

    expect(mockUseNavigate).toHaveBeenCalledWith(PREVIOUS_ROUTE);
  });

  it('calls navigate with wallet route when wallet row is clicked', () => {
    renderComponent();

    const walletRow = screen.getByTestId(accountDetailsRowWalletTestId);
    fireEvent.click(walletRow);

    expect(mockUseNavigate).toHaveBeenCalledTimes(1);
    expect(mockUseNavigate).toHaveBeenCalledWith({
      pathname: MULTICHAIN_WALLET_DETAILS_PAGE_ROUTE,
      search: 'id=entropy%3A01JKAF3DSGM3AB87EM9N0K41AJ',
    });
  });

  it('navigates to default route when accountGroupId is missing', async () => {
    setSearchParams(null);

    expect(() => renderComponent()).not.toThrow();

    await waitFor(() => {
      expect(mockUseNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE);
    });
  });

  it('does not render remove account section for Entropy wallet type', () => {
    renderComponent();

    expect(screen.queryByText(/remove account/iu)).not.toBeInTheDocument();
  });

  it('renders remove account section for Keyring wallet type', () => {
    setSearchParams(LEDGER_ACCOUNT_GROUP_ID);

    renderComponent();

    expect(screen.getByText(/remove account/iu)).toBeInTheDocument();
  });

  it('does not render Setup Smart Account row for hardware wallet (Ledger) account', () => {
    setSearchParams(LEDGER_ACCOUNT_GROUP_ID);

    renderComponent();

    expect(
      screen.queryByTestId(accountDetailsRowSmartAccountTestId),
    ).not.toBeInTheDocument();
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

    const closeButton = screen.getByLabelText(messages.close.message);
    fireEvent.click(closeButton);

    expect(screen.queryByText(/rename/iu)).not.toBeInTheDocument();
  });

  it('opens account remove modal when remove account action button is clicked', () => {
    setSearchParams(LEDGER_ACCOUNT_GROUP_ID);
    renderComponent();

    const removeAccountActionButton = screen.getByTestId(
      'account-remove-action',
    );
    fireEvent.click(removeAccountActionButton);

    expect(screen.getByText(/will be removed/iu)).toBeInTheDocument();
  });

  it('closes account remove modal when close button is clicked', () => {
    setSearchParams(LEDGER_ACCOUNT_GROUP_ID);

    renderComponent();

    const removeAccountActionButton = screen.getByTestId(
      'account-remove-action',
    );
    fireEvent.click(removeAccountActionButton);

    expect(screen.getByText(/will be removed/iu)).toBeInTheDocument();

    const closeButton = screen.getByLabelText(messages.close.message);
    fireEvent.click(closeButton);

    expect(screen.queryByText(/will be removed/iu)).not.toBeInTheDocument();
  });

  it('calls removeAccount action when remove account button is clicked', () => {
    setSearchParams(LEDGER_ACCOUNT_GROUP_ID);
    renderComponent();

    const removeAccountActionButton = screen.getByTestId(
      'account-remove-action',
    );
    fireEvent.click(removeAccountActionButton);

    const removeButton = screen.getByText(messages.remove.message);
    fireEvent.click(removeButton);

    // Verify that dispatch was called with removeAccount action
    expect(mockDispatch).toHaveBeenCalledTimes(1);

    // First call should be the removeAccount thunk (AsyncFunction)
    expect(mockDispatch).toHaveBeenNthCalledWith(1, expect.any(Function));
  });

  describe('tracing', () => {
    it('calls ShowAccountAddressList trace when clicking network addresses link', () => {
      const store = configureStore(mockState);
      const groupId = mockState.metamask.accountTree.selectedAccountGroup;
      setSearchParams(groupId);
      renderWithProvider(
        <MultichainAccountDetailsPage />,
        store,
        `/test?accountGroupId=${encodeURIComponent(groupId)}`,
      );

      const addressesLink = document.querySelector(
        '[data-testid="network-addresses-link"]',
      );
      expect(addressesLink).toBeInTheDocument();
      if (addressesLink) {
        (addressesLink as HTMLElement).click();
      }

      const { TraceName } = jest.requireActual('../../../../shared/lib/trace');
      expect(traceModule.trace).toHaveBeenCalledWith(
        expect.objectContaining({
          name: TraceName.ShowAccountAddressList,
        }),
      );
    });
  });
});
