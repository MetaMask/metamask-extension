import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { KeyringTypes } from '@metamask/keyring-controller';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { getWalletsWithAccounts } from '../../../../selectors/multichain-accounts/account-tree';
import { AccountSelectModal } from './account-select-modal';

jest.mock('../../../../selectors/multichain-accounts/account-tree');

jest.mock('../../../../components/app/preferred-avatar', () => ({
  PreferredAvatar: () => <div data-testid="preferred-avatar" />,
}));

const ACCOUNT_1_ADDRESS = '0xabcdef1234567890abcdef1234567890abcdef12';
const ACCOUNT_2_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678';
const LEDGER_ADDRESS = '0xfedcba0987654321fedcba0987654321fedcba09';
const NON_EVM_ADDRESS = 'bc1qexampleexampleexampleexampleexampleex';

const mockStore = configureStore([thunk]);

const WALLETS_MOCK = {
  'wallet-1': {
    id: 'wallet-1',
    metadata: { name: 'Wallet 1' },
    groups: {
      'group-1': {
        id: 'group-1',
        metadata: { name: 'Account 1' },
        accounts: [{ address: ACCOUNT_1_ADDRESS, type: 'eip155:eoa' }],
      },
      'group-2': {
        id: 'group-2',
        metadata: { name: 'Account 2' },
        accounts: [{ address: ACCOUNT_2_ADDRESS, type: 'eip155:eoa' }],
      },
      'group-3': {
        id: 'group-3',
        metadata: { name: 'Bitcoin Account' },
        accounts: [{ address: NON_EVM_ADDRESS, type: 'bip122:p2wpkh' }],
      },
      'group-4': {
        id: 'group-4',
        metadata: { name: 'Ledger Account' },
        accounts: [
          {
            address: LEDGER_ADDRESS,
            type: 'eip155:eoa',
            metadata: { keyring: { type: KeyringTypes.ledger } },
          },
        ],
      },
    },
  },
};

describe('AccountSelectModal', () => {
  const getWalletsWithAccountsMock = jest.mocked(getWalletsWithAccounts);

  beforeEach(() => {
    jest.resetAllMocks();
    getWalletsWithAccountsMock.mockReturnValue(WALLETS_MOCK as never);
  });

  function renderModal(props = {}) {
    const store = mockStore({ metamask: {} });
    return renderWithProvider(
      <AccountSelectModal
        selectedAddress={ACCOUNT_1_ADDRESS}
        onSelect={jest.fn()}
        onClose={jest.fn()}
        {...props}
      />,
      store,
    );
  }

  it('renders the modal with the wallet group and its EVM accounts', () => {
    renderModal();

    expect(screen.getByTestId('account-select-modal')).toBeInTheDocument();
    expect(screen.getByText('Wallet 1')).toBeInTheDocument();
    expect(screen.getByText('Account 1')).toBeInTheDocument();
    expect(screen.getByText('Account 2')).toBeInTheDocument();
  });

  it('excludes non-EVM accounts', () => {
    renderModal();

    expect(screen.queryByText('Bitcoin Account')).not.toBeInTheDocument();
    expect(
      screen.queryByTestId(`account-select-item-${NON_EVM_ADDRESS}`),
    ).not.toBeInTheDocument();
  });

  it('calls onSelect with the chosen account address', () => {
    const onSelect = jest.fn();
    renderModal({ onSelect });

    fireEvent.click(
      screen.getByTestId(`account-select-item-${ACCOUNT_2_ADDRESS}`),
    );

    expect(onSelect).toHaveBeenCalledWith(ACCOUNT_2_ADDRESS);
  });

  it('calls onClose when the close button is clicked', () => {
    const onClose = jest.fn();
    renderModal({ onClose });

    fireEvent.click(screen.getByRole('button', { name: /close/iu }));

    expect(onClose).toHaveBeenCalled();
  });

  describe('excludeHardwareAccounts', () => {
    it('includes hardware accounts by default', () => {
      renderModal();

      expect(screen.getByText('Ledger Account')).toBeInTheDocument();
      expect(
        screen.getByTestId(`account-select-item-${LEDGER_ADDRESS}`),
      ).toBeInTheDocument();
    });

    it('excludes hardware accounts when enabled', () => {
      renderModal({ excludeHardwareAccounts: true });

      expect(screen.queryByText('Ledger Account')).not.toBeInTheDocument();
      expect(
        screen.queryByTestId(`account-select-item-${LEDGER_ADDRESS}`),
      ).not.toBeInTheDocument();
    });

    it('still renders non-hardware accounts when hardware accounts are excluded', () => {
      renderModal({ excludeHardwareAccounts: true });

      expect(screen.getByText('Account 1')).toBeInTheDocument();
      expect(screen.getByText('Account 2')).toBeInTheDocument();
    });
  });
});
