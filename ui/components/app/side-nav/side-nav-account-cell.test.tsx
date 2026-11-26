import React from 'react';
import { fireEvent, screen, within } from '@testing-library/react';
import { AccountGroupId } from '@metamask/account-api';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import configureStore from '../../../store/store';
import mockDefaultState from '../../../../test/data/mock-state.json';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { shortenAddress } from '../../../helpers/utils/util';
import { normalizeSafeAddress } from '../../../../shared/lib/multichain/address';
import type { MultichainAccountCellProps } from '../../multichain-accounts/multichain-account-cell/multichain-account-cell';
import { SideNavAccountCell } from './side-nav-account-cell';

jest.mock('../../../hooks/useCopyToClipboard', () => ({
  useCopyToClipboard: jest.fn(),
}));

jest.mock('@metamask/chain-agnostic-permission', () => ({
  ...jest.requireActual('@metamask/chain-agnostic-permission'),
  isInternalAccountInPermittedAccountIds: jest.fn(),
}));

const mockHandleCopy = jest.fn();
const mockUseCopyToClipboard = useCopyToClipboard as jest.MockedFunction<
  typeof useCopyToClipboard
>;

const accountId = 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0' as AccountGroupId;
const defaultAddress = '0x0DCD5D886577d5081B0c52e242Ef29E70Be3E7bc';

const createStore = () => configureStore(mockDefaultState);

const renderCell = (props: Partial<MultichainAccountCellProps> = {}) =>
  renderWithProvider(
    <SideNavAccountCell
      accountId={accountId}
      accountName="Account 1"
      balance="$245.50"
      {...props}
    />,
    createStore(),
  );

describe('SideNavAccountCell', () => {
  beforeEach(() => {
    mockHandleCopy.mockClear();
    mockUseCopyToClipboard.mockReturnValue([false, mockHandleCopy, jest.fn()]);
  });

  it('shows the balance and shortened address when the default address preference is on', () => {
    renderCell({ showDefaultAddress: true, walletName: 'Wallet 1' });

    expect(
      screen.getByTestId('side-nav-account-cell-balance'),
    ).toHaveTextContent('$245.50');
    expect(
      screen.getByTestId('side-nav-account-cell-address'),
    ).toHaveTextContent(shortenAddress(normalizeSafeAddress(defaultAddress)));
    expect(
      screen.queryByTestId('default-address-menu-button'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('side-nav-account-cell-wallet-name'),
    ).not.toBeInTheDocument();
  });

  it('shows the wallet name instead of the address when the preference is off', () => {
    renderCell({ showDefaultAddress: false, walletName: 'Wallet 1' });

    expect(
      screen.getByTestId('side-nav-account-cell-wallet-name'),
    ).toHaveTextContent('Wallet 1');
    expect(
      screen.queryByTestId('side-nav-account-cell-address'),
    ).not.toBeInTheDocument();
    expect(
      screen.getByTestId('side-nav-account-cell-balance'),
    ).toHaveTextContent('$245.50');
  });

  it('shows the no-address fallback when the group has no default address', () => {
    renderCell({
      accountId: 'entropy:missing/0' as AccountGroupId,
      showDefaultAddress: true,
    });

    expect(
      screen.getByTestId('side-nav-account-cell-address'),
    ).toHaveTextContent(
      messages.noDefaultAddress.message.replace(
        '$1',
        messages.networkNameEthereum.message,
      ),
    );
  });

  it('keeps the no-address fallback under the select button so clicks select the account', () => {
    renderCell({
      accountId: 'entropy:missing/0' as AccountGroupId,
      showDefaultAddress: true,
    });

    const fallback = screen.getByTestId('side-nav-account-cell-address');
    expect(fallback.closest('.z-10')).toBeNull();
  });

  it('masks the balance in privacy mode', () => {
    renderCell({ showDefaultAddress: true, privacyMode: true });

    const balance = screen.getByTestId('side-nav-account-cell-balance');
    expect(balance).not.toHaveTextContent('$245.50');
    expect(balance.textContent).toMatch(/^[•]+$/u);
  });

  it('renders no balance when none is known', () => {
    renderCell({ showDefaultAddress: true, balance: undefined });

    expect(
      screen.queryByTestId('side-nav-account-cell-balance'),
    ).not.toBeInTheDocument();
    expect(
      screen.getByTestId('side-nav-account-cell-address'),
    ).toBeInTheDocument();
  });

  it('copies the address without selecting the account when the copy icon is clicked', () => {
    const handleClick = jest.fn();
    renderCell({ showDefaultAddress: true, onClick: handleClick });

    fireEvent.click(
      within(screen.getByTestId('side-nav-account-cell-address')).getByRole(
        'button',
      ),
    );

    expect(mockHandleCopy).toHaveBeenCalledWith(defaultAddress);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('shows the copied state', () => {
    mockUseCopyToClipboard.mockReturnValue([true, mockHandleCopy, jest.fn()]);
    renderCell({ showDefaultAddress: true });

    expect(
      screen.getByTestId('side-nav-account-cell-address'),
    ).toHaveTextContent(
      `${messages.networkNameEthereum.message} ${messages.addressCopied.message.toLowerCase()}`,
    );
  });

  it('selects the account when the row is clicked', () => {
    const handleClick = jest.fn();
    renderCell({ onClick: handleClick });

    const select = screen.getByRole('button', { name: 'Account 1' });
    expect(select).toHaveClass('cursor-pointer');
    fireEvent.click(select);

    expect(handleClick).toHaveBeenCalledWith(accountId);
  });

  it('disables the select button and shows pending styling while a switch is in progress', () => {
    const handleClick = jest.fn();
    renderCell({ onClick: handleClick, pending: true });

    const cell = screen.getByTestId(`side-nav-account-cell-${accountId}`);
    expect(cell).toHaveClass('opacity-60');
    expect(cell).toHaveAttribute('aria-busy', 'true');
    const select = screen.getByRole('button', { name: 'Account 1' });
    expect(select).toHaveClass('cursor-wait');
    expect(select).toBeDisabled();
    fireEvent.click(select);

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('disables the select button when the row has no click handler', () => {
    renderCell();

    expect(screen.getByRole('button', { name: 'Account 1' })).toBeDisabled();
  });

  it('marks the selected account', () => {
    renderCell({ selected: true });

    expect(
      screen.getByTestId(`side-nav-account-cell-${accountId}`),
    ).toHaveClass('bg-background-muted');
  });

  it('hides the menu until hover and keeps the reveal class while the menu is open', () => {
    renderCell({
      endAccessory: (
        <span data-testid="menu-trigger" aria-expanded="true">
          More
        </span>
      ),
    });

    const menu = screen.getByTestId('side-nav-account-cell-menu');
    expect(menu).toHaveClass(
      'opacity-0',
      'pointer-events-none',
      'group-hover/account-cell:opacity-100',
      'has-[[aria-expanded=true]]:opacity-100',
    );
    expect(screen.getByTestId('menu-trigger')).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });
});
