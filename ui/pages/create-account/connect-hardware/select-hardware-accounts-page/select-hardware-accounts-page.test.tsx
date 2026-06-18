import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { tEn } from '../../../../../test/lib/i18n-helpers';
import {
  createMockHardwareAccounts,
  MOCK_HARDWARE_ACCOUNTS,
} from '../../../../../test/data/hardware-wallet-accounts';
import { SelectHardwareAccountsPage } from './select-hardware-accounts-page';
import type { SelectHardwareAccountsPageProps } from './select-hardware-accounts-page.types';

const defaultProps: SelectHardwareAccountsPageProps = {
  accounts: MOCK_HARDWARE_ACCOUNTS,
  selectedAccountIds: ['account-0'],
  onAccountSelectionChange: jest.fn(),
  onBack: jest.fn(),
  onShowMore: jest.fn(),
  onContinue: jest.fn(),
  onForgetDevice: jest.fn(),
  hasMoreAccounts: true,
  isLoadingMore: false,
  onSettingsClick: jest.fn(),
  showSettingsButton: true,
};

const renderPage = (props: Partial<SelectHardwareAccountsPageProps> = {}) => {
  const mergedProps: SelectHardwareAccountsPageProps = {
    ...defaultProps,
    ...props,
  };

  return {
    props: mergedProps,
    ...renderWithProvider(<SelectHardwareAccountsPage {...mergedProps} />),
  };
};

describe('SelectHardwareAccountsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the page title, account cards, footer actions, and show more button', () => {
      renderPage();

      expect(screen.getByText(tEn('selectAnAccount'))).toBeInTheDocument();
      expect(screen.getAllByTestId('hardware-account-card')).toHaveLength(5);
      expect(screen.getByText(tEn('forgetDevice'))).toBeInTheDocument();
      expect(screen.getByText(tEn('continue'))).toBeInTheDocument();
      expect(
        screen.getByTestId('select-hardware-accounts-page-show-more-button'),
      ).toBeInTheDocument();
    });

    it('renders no account cards when accounts is empty', () => {
      renderPage({ accounts: [] });

      expect(
        screen.queryByTestId('hardware-account-card'),
      ).not.toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    it('calls onBack when the back button is clicked', () => {
      const { props } = renderPage();

      fireEvent.click(
        screen.getByTestId('select-hardware-accounts-page-back-button'),
      );

      expect(props.onBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('settings', () => {
    it('calls onSettingsClick when the settings button is clicked', () => {
      const { props } = renderPage();

      fireEvent.click(
        screen.getByTestId('select-hardware-accounts-page-settings-button'),
      );

      expect(props.onSettingsClick).toHaveBeenCalledTimes(1);
    });

    it('hides the settings button when showSettingsButton is false', () => {
      renderPage({ showSettingsButton: false, onSettingsClick: undefined });

      expect(
        screen.queryByTestId('select-hardware-accounts-page-settings-button'),
      ).not.toBeInTheDocument();
    });

    it('hides the settings button when onSettingsClick is not provided', () => {
      renderPage({ onSettingsClick: undefined, showSettingsButton: undefined });

      expect(
        screen.queryByTestId('select-hardware-accounts-page-settings-button'),
      ).not.toBeInTheDocument();
    });
  });

  describe('account selection', () => {
    it('adds an account to the selection when toggled on', () => {
      const onAccountSelectionChange = jest.fn();
      renderPage({
        selectedAccountIds: ['account-0'],
        onAccountSelectionChange,
      });

      fireEvent.click(screen.getByRole('checkbox', { name: 'Account 2' }));

      expect(onAccountSelectionChange).toHaveBeenCalledTimes(1);
      expect(onAccountSelectionChange).toHaveBeenCalledWith([
        'account-0',
        'account-1',
      ]);
    });

    it('removes an account from the selection when toggled off', () => {
      const onAccountSelectionChange = jest.fn();
      renderPage({
        selectedAccountIds: ['account-0'],
        onAccountSelectionChange,
      });

      fireEvent.click(screen.getByRole('checkbox', { name: 'Account 1' }));

      expect(onAccountSelectionChange).toHaveBeenCalledTimes(1);
      expect(onAccountSelectionChange).toHaveBeenCalledWith([]);
    });

    it('updates selection when an account card header is clicked', () => {
      const onAccountSelectionChange = jest.fn();
      renderPage({ selectedAccountIds: [], onAccountSelectionChange });

      fireEvent.click(screen.getAllByTestId('hardware-account-card-header')[0]);

      expect(onAccountSelectionChange).toHaveBeenCalledTimes(1);
      expect(onAccountSelectionChange).toHaveBeenCalledWith(['account-0']);
    });

    it('disables the already connected account checkbox', () => {
      renderPage();

      expect(
        screen.getByRole('checkbox', { name: 'Account 3' }),
      ).toBeDisabled();
    });
  });

  describe('show more', () => {
    it('calls onShowMore when the show more button is clicked', () => {
      const { props } = renderPage({ hasMoreAccounts: true });

      fireEvent.click(
        screen.getByTestId('select-hardware-accounts-page-show-more-button'),
      );

      expect(props.onShowMore).toHaveBeenCalledTimes(1);
    });

    it('does not render the show more button when hasMoreAccounts is false', () => {
      renderPage({ hasMoreAccounts: false });

      expect(
        screen.queryByTestId('select-hardware-accounts-page-show-more-button'),
      ).not.toBeInTheDocument();
    });

    it('disables the show more button while loading more accounts', () => {
      renderPage({ hasMoreAccounts: true, isLoadingMore: true });

      expect(
        screen.getByTestId('select-hardware-accounts-page-show-more-button'),
      ).toBeDisabled();
    });
  });

  describe('footer actions', () => {
    it('disables continue when no accounts are selected', () => {
      renderPage({ selectedAccountIds: [] });

      expect(
        screen.getByTestId('select-hardware-accounts-page-continue-button'),
      ).toBeDisabled();
    });

    it('enables continue when at least one account is selected', () => {
      renderPage({ selectedAccountIds: ['account-0'] });

      expect(
        screen.getByTestId('select-hardware-accounts-page-continue-button'),
      ).toBeEnabled();
    });

    it('calls onContinue with selected account ids', () => {
      const { props } = renderPage({
        selectedAccountIds: ['account-0', 'account-1'],
      });

      fireEvent.click(
        screen.getByTestId('select-hardware-accounts-page-continue-button'),
      );

      expect(props.onContinue).toHaveBeenCalledTimes(1);
      expect(props.onContinue).toHaveBeenCalledWith(['account-0', 'account-1']);
    });

    it('calls onForgetDevice when the forget device button is clicked', () => {
      const { props } = renderPage();

      fireEvent.click(
        screen.getByTestId(
          'select-hardware-accounts-page-forget-device-button',
        ),
      );

      expect(props.onForgetDevice).toHaveBeenCalledTimes(1);
    });
  });

  describe('default props', () => {
    it('uses default optional props when they are omitted', () => {
      renderPage({
        accounts: createMockHardwareAccounts(1),
        hasMoreAccounts: undefined,
        isLoadingMore: undefined,
        showSettingsButton: undefined,
        onSettingsClick: jest.fn(),
      });

      expect(
        screen.queryByTestId('select-hardware-accounts-page-show-more-button'),
      ).not.toBeInTheDocument();
      expect(
        screen.getByTestId('select-hardware-accounts-page-settings-button'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId(
          'select-hardware-accounts-page-forget-device-button',
        ),
      ).toBeInTheDocument();
    });
  });
});
