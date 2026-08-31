import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import {
  AccountGroupType,
  AccountWalletType,
  toAccountGroupId,
  toAccountWalletId,
  toMultichainAccountGroupId,
  toMultichainAccountWalletId,
} from '@metamask/account-api';
import { KeyringTypes } from '@metamask/keyring-controller';
import configureStore from '../../../store/store';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../test/data/mock-state.json';
import { setBackgroundConnection } from '../../../store/background-connection';
import { AccountTreeWallets } from '../../../selectors/multichain-accounts/account-tree.types';
import { AccountManagementList } from './account-management-list';

const backgroundConnectionMock = new Proxy(
  {},
  {
    get: () => jest.fn().mockResolvedValue(undefined),
  },
);

const mockSetAccountGroupHidden = jest
  .fn()
  .mockImplementation(() => () => Promise.resolve());
jest.mock('../../../store/actions', () => ({
  ...jest.requireActual('../../../store/actions'),
  setAccountGroupHidden: (...args: unknown[]) =>
    mockSetAccountGroupHidden(...args),
}));

describe('AccountManagementList', () => {
  const createMockWallets = (): AccountTreeWallets => {
    const srp1WalletId = toMultichainAccountWalletId('srp-1');
    const srp1Group0Id = toMultichainAccountGroupId(srp1WalletId, 0);
    const srp1Group1Id = toMultichainAccountGroupId(srp1WalletId, 1);

    const srp2WalletId = toMultichainAccountWalletId('srp-2');
    const srp2Group0Id = toMultichainAccountGroupId(srp2WalletId, 0);

    const simpleWalletId = toAccountWalletId(
      AccountWalletType.Keyring,
      KeyringTypes.simple,
    );
    const simpleGroup0Id = toAccountGroupId(simpleWalletId, '0');

    return {
      [srp1WalletId]: {
        id: srp1WalletId,
        type: AccountWalletType.Entropy,
        status: 'ready',
        metadata: {
          name: 'Main Wallet',
          entropy: { id: 'srp-1' },
        },
        groups: {
          [srp1Group0Id]: {
            id: srp1Group0Id,
            type: AccountGroupType.MultichainAccount,
            metadata: {
              name: 'Account 1',
              pinned: true,
              hidden: false,
              lastSelected: 0,
              entropy: { groupIndex: 0 },
            },
            accounts: ['0x1'],
          },
          [srp1Group1Id]: {
            id: srp1Group1Id,
            type: AccountGroupType.MultichainAccount,
            metadata: {
              name: 'Account 2',
              pinned: false,
              hidden: false,
              lastSelected: 0,
              entropy: { groupIndex: 1 },
            },
            accounts: ['0x2'],
          },
        },
      },
      [srp2WalletId]: {
        id: srp2WalletId,
        type: AccountWalletType.Entropy,
        status: 'ready',
        metadata: {
          name: 'Secondary Wallet',
          entropy: { id: 'srp-2' },
        },
        groups: {
          [srp2Group0Id]: {
            id: srp2Group0Id,
            type: AccountGroupType.MultichainAccount,
            metadata: {
              name: 'Account 3',
              pinned: false,
              hidden: false,
              lastSelected: 0,
              entropy: { groupIndex: 0 },
            },
            accounts: ['0x3'],
          },
        },
      },
      [simpleWalletId]: {
        id: simpleWalletId,
        type: AccountWalletType.Keyring,
        status: 'ready',
        metadata: {
          name: 'Simple Key Pair',
          keyring: { type: KeyringTypes.simple },
        },
        groups: {
          [simpleGroup0Id]: {
            id: simpleGroup0Id,
            type: AccountGroupType.SingleAccount,
            metadata: {
              name: 'Imported 1',
              pinned: false,
              hidden: false,
              lastSelected: 0,
            },
            accounts: ['0x4'],
          },
        },
      },
    };
  };

  const renderComponent = (
    props: Partial<React.ComponentProps<typeof AccountManagementList>> = {},
  ) => {
    const store = configureStore(mockState);
    const defaultProps = {
      wallets: createMockWallets(),
      primaryEntropySourceId: 'srp-1',
      ...props,
    };

    return renderWithProvider(
      <AccountManagementList {...defaultProps} />,
      store,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    setBackgroundConnection(backgroundConnectionMock as never);
  });

  it('renders all sections including Pinned and wallet sections', () => {
    renderComponent();
    expect(screen.getByTestId('account-management-list')).toBeInTheDocument();
    expect(screen.getByText('Pinned')).toBeInTheDocument();
    expect(screen.getByText('Main Wallet')).toBeInTheDocument();
    expect(screen.getByText('Secondary Wallet')).toBeInTheDocument();
    expect(screen.getByText('Imported')).toBeInTheDocument();
  });

  it('toggles section collapse when clicking header', () => {
    renderComponent();
    const pinnedHeader = screen.getByTestId('wallet-section-header-pinned');
    expect(pinnedHeader).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(pinnedHeader);
    expect(pinnedHeader).toHaveAttribute('aria-expanded', 'false');
  });

  it('dispatches setAccountGroupHidden when clicking visibility toggle button', () => {
    renderComponent();
    const visibilityToggle = screen.getByTestId(
      'account-management-row-visibility-toggle-entropy:srp-1/0',
    );
    fireEvent.click(visibilityToggle);
    expect(mockSetAccountGroupHidden).toHaveBeenCalledWith(
      'entropy:srp-1/0',
      true,
    );
  });

  it('triggers onAccountClick when clicking a visible account row', () => {
    const handleAccountClick = jest.fn();
    renderComponent({ onAccountClick: handleAccountClick });
    const row = screen.getByTestId('account-management-row-entropy:srp-1/1');
    const cell = row.querySelector('.multichain-account-cell');
    if (cell) {
      fireEvent.click(cell);
    }
    expect(handleAccountClick).toHaveBeenCalledWith('entropy:srp-1/1');
  });

  it('triggers onRemoveWallet when clicking remove on a removable wallet section header', () => {
    const handleRemoveWallet = jest.fn();
    renderComponent({ onRemoveWallet: handleRemoveWallet });

    const removeButton = screen.getByTestId(
      'wallet-section-header-wallet-entropy:srp-2-remove-button',
    );
    expect(removeButton).toBeInTheDocument();
    fireEvent.click(removeButton);

    expect(handleRemoveWallet).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'wallet-entropy:srp-2',
        title: 'Secondary Wallet',
      }),
    );
  });

  it('triggers onRenameWallet when editing a wallet header', async () => {
    const handleRenameWallet = jest.fn();
    renderComponent({ onRenameWallet: handleRenameWallet });

    fireEvent.click(screen.getByText('Main Wallet'));
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Renamed Main Wallet' } });
    fireEvent.click(screen.getByTestId('wallet-section-header-title-save'));

    await waitFor(() => {
      expect(handleRenameWallet).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'wallet-entropy:srp-1',
        }),
        'Renamed Main Wallet',
      );
    });
  });

  it('triggers onRemoveAccount when clicking remove on an imported account row', () => {
    const handleRemoveAccount = jest.fn();
    renderComponent({ onRemoveAccount: handleRemoveAccount });

    const removeButton = screen.getByTestId(
      'account-management-row-remove-keyring:Simple Key Pair/0',
    );
    expect(removeButton).toBeInTheDocument();
    fireEvent.click(removeButton);

    expect(handleRemoveAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        groupId: 'keyring:Simple Key Pair/0',
      }),
    );
  });

  it('triggers onRenameAccount when editing an account row', async () => {
    const handleRenameAccount = jest.fn();
    renderComponent({ onRenameAccount: handleRenameAccount });

    fireEvent.click(screen.getByText('Account 2'));
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'New Account 2' } });
    fireEvent.click(
      screen.getByTestId('account-management-row-name-entropy:srp-1/1-save'),
    );

    await waitFor(() => {
      expect(handleRenameAccount).toHaveBeenCalledWith(
        'entropy:srp-1/1',
        'New Account 2',
      );
    });
  });
});
