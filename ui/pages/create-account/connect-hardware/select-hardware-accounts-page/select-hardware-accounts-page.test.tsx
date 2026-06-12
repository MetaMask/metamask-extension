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

const render = (props: Partial<SelectHardwareAccountsPageProps> = {}) => {
  const mergedProps = {
    ...defaultProps,
    ...props,
  };

  return {
    ...renderWithProvider(<SelectHardwareAccountsPage {...mergedProps} />),
    props: mergedProps,
  };
};

describe('SelectHardwareAccountsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the page title and account cards', () => {
    render();

    expect(screen.getByText(tEn('selectAnAccount'))).toBeInTheDocument();
    expect(screen.getAllByTestId('hardware-account-card')).toHaveLength(5);
  });

  it('calls onBack when the back button is clicked', () => {
    const { props } = render();

    fireEvent.click(
      screen.getByTestId('select-hardware-accounts-page-back-button'),
    );

    expect(props.onBack).toHaveBeenCalledTimes(1);
  });

  it('calls onSettingsClick when the settings button is clicked', () => {
    const { props } = render();

    fireEvent.click(
      screen.getByTestId('select-hardware-accounts-page-settings-button'),
    );

    expect(props.onSettingsClick).toHaveBeenCalledTimes(1);
  });

  it('hides the settings button when showSettingsButton is false', () => {
    render({ showSettingsButton: false, onSettingsClick: undefined });

    expect(
      screen.queryByTestId('select-hardware-accounts-page-settings-button'),
    ).not.toBeInTheDocument();
  });

  it('updates account selection through onAccountSelectionChange', () => {
    const onAccountSelectionChange = jest.fn();
    render({ selectedAccountIds: ['account-0'], onAccountSelectionChange });

    fireEvent.click(screen.getByRole('checkbox', { name: 'Account 2' }));

    expect(onAccountSelectionChange).toHaveBeenCalledWith([
      'account-0',
      'account-1',
    ]);
  });

  it('removes account from selection when toggled off', () => {
    const onAccountSelectionChange = jest.fn();
    render({ selectedAccountIds: ['account-0'], onAccountSelectionChange });

    fireEvent.click(screen.getByRole('checkbox', { name: 'Account 1' }));

    expect(onAccountSelectionChange).toHaveBeenCalledWith([]);
  });

  it('calls onShowMore when the show more button is clicked', () => {
    const { props } = render({ hasMoreAccounts: true });

    fireEvent.click(
      screen.getByTestId('select-hardware-accounts-page-show-more-button'),
    );

    expect(props.onShowMore).toHaveBeenCalledTimes(1);
  });

  it('does not render the show more button when hasMoreAccounts is false', () => {
    render({ hasMoreAccounts: false });

    expect(
      screen.queryByTestId('select-hardware-accounts-page-show-more-button'),
    ).not.toBeInTheDocument();
  });

  it('disables continue when no accounts are selected', () => {
    render({ selectedAccountIds: [] });

    expect(
      screen.getByTestId('select-hardware-accounts-page-continue-button'),
    ).toBeDisabled();
  });

  it('calls onContinue with selected account ids', () => {
    const { props } = render({
      selectedAccountIds: ['account-0', 'account-1'],
    });

    fireEvent.click(
      screen.getByTestId('select-hardware-accounts-page-continue-button'),
    );

    expect(props.onContinue).toHaveBeenCalledWith(['account-0', 'account-1']);
  });

  it('calls onForgetDevice when the forget device button is clicked', () => {
    const { props } = render();

    fireEvent.click(
      screen.getByTestId('select-hardware-accounts-page-forget-device-button'),
    );

    expect(props.onForgetDevice).toHaveBeenCalledTimes(1);
  });

  it('renders footer action labels from translations', () => {
    render();

    expect(screen.getByText(tEn('forgetDevice'))).toBeInTheDocument();
    expect(screen.getByText(tEn('continue'))).toBeInTheDocument();
  });

  it('renders multichain address rows including address type badges', () => {
    render({
      accounts: createMockHardwareAccounts(1, {
        includeMultichainAddresses: true,
      }),
    });

    expect(screen.getByText(tEn('networkNameEthereum'))).toBeInTheDocument();
    expect(screen.getByText(tEn('networkNameSolana'))).toBeInTheDocument();
    expect(screen.getByText(tEn('networkNameBitcoin'))).toBeInTheDocument();
    expect(screen.getByText('Taproot')).toBeInTheDocument();
  });

  it('shows loading state on the show more button', () => {
    render({ hasMoreAccounts: true, isLoadingMore: true });

    expect(
      screen.getByTestId('select-hardware-accounts-page-show-more-button'),
    ).toBeInTheDocument();
  });

  it('uses default optional props when they are omitted', () => {
    render({
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
      screen.getByTestId('select-hardware-accounts-page-forget-device-button'),
    ).toBeInTheDocument();
  });
});
