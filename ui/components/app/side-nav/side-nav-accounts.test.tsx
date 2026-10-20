import React from 'react';
import { act, fireEvent, screen } from '@testing-library/react';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import {
  ACCOUNT_LIST_PAGE_ROUTE,
  CHOOSE_NEW_WALLET_TYPE_PAGE_ROUTE,
} from '../../../helpers/constants/routes';
import { useAccountsOperationsLoadingStates } from '../../../hooks/accounts/useAccountsOperationsLoadingStates';
import { SideNavAccounts } from './side-nav-accounts';

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

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../../hooks/accounts/useAccountsOperationsLoadingStates', () => ({
  useAccountsOperationsLoadingStates: jest.fn(),
}));
const mockUseAccountsOperationsLoadingStates = jest.mocked(
  useAccountsOperationsLoadingStates,
);

jest.mock('../../../hooks/useAssetsUpdateAllAccountBalances', () => ({
  useAssetsUpdateAllAccountBalances: jest.fn(),
}));

const mockSetSelectedMultichainAccount = jest.fn();
jest.mock('../../../store/actions', () => ({
  ...jest.requireActual('../../../store/actions'),
  setSelectedMultichainAccount: (...args: unknown[]) => {
    mockSetSelectedMultichainAccount(...args);
    return async () => Promise.resolve();
  },
}));

const walletHeaderTestId = 'multichain-account-tree-wallet-header';

function renderSideNavAccounts() {
  const store = configureStore({
    activeTab: { origin: 'https://example.com' },
    metamask: { ...mockState.metamask },
  });
  return renderWithProvider(<SideNavAccounts />, store);
}

describe('SideNavAccounts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAccountsOperationsLoadingStates.mockReturnValue({
      isAccountTreeSyncingInProgress: false,
      areAnyOperationsLoading: false,
      loadingMessage: undefined,
    });
  });

  it('renders the title and the account list', () => {
    renderSideNavAccounts();

    expect(screen.getByText(messages.accounts.message)).toBeInTheDocument();
    expect(screen.getAllByTestId(walletHeaderTestId).length).toBeGreaterThan(0);
    expect(screen.getByText('Account 1')).toBeInTheDocument();
    expect(screen.getByText('Account 2')).toBeInTheDocument();
  });

  describe('manage button', () => {
    it('navigates to the accounts page', () => {
      renderSideNavAccounts();

      fireEvent.click(
        screen.getByRole('button', { name: messages.manageAccounts.message }),
      );

      expect(mockNavigate).toHaveBeenCalledWith(ACCOUNT_LIST_PAGE_ROUTE);
    });
  });

  it('navigates to the choose wallet type page when the add button is clicked', () => {
    renderSideNavAccounts();

    fireEvent.click(
      screen.getByRole('button', { name: messages.addWallet.message }),
    );

    expect(mockNavigate).toHaveBeenCalledWith(
      CHOOSE_NEW_WALLET_TYPE_PAGE_ROUTE,
    );
  });

  it('disables the add button while accounts are syncing', () => {
    mockUseAccountsOperationsLoadingStates.mockReturnValue({
      isAccountTreeSyncingInProgress: true,
      areAnyOperationsLoading: true,
      loadingMessage: 'Syncing',
    });

    renderSideNavAccounts();

    expect(
      screen.getByRole('button', { name: messages.addWallet.message }),
    ).toBeDisabled();
  });

  it('switches account without navigating when an account is clicked', async () => {
    renderSideNavAccounts();

    await act(async () => {
      fireEvent.click(screen.getByText('Account 2'));
    });

    expect(mockSetSelectedMultichainAccount).toHaveBeenCalledTimes(1);
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
