import React from 'react';
import { act, fireEvent, screen } from '@testing-library/react';
import { AccountWalletType, toAccountWalletId } from '@metamask/account-api';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
// eslint-disable-next-line import-x/no-restricted-paths
import messages from '../../../../../app/_locales/en/messages.json';
import AddWallets from './add-wallets';

const mockWalletId = toAccountWalletId(AccountWalletType.Entropy, 'entropy1');
const mockGroupId = `${mockWalletId}/0`;

const mockStableAccountTree = (() => {
  const { AccountWalletType: WalletType, toAccountWalletId: toWalletId } =
    jest.requireActual('@metamask/account-api');
  const walletId = toWalletId(WalletType.Entropy, 'entropy1');
  const groupId = `${walletId}/0`;
  return {
    wallets: {
      [walletId]: {
        id: walletId,
        type: WalletType.Entropy,
        metadata: { name: 'My Wallet', entropy: { id: 'entropy1' } },
        groups: {
          [groupId]: {
            id: groupId,
            metadata: { name: 'Account 1' },
          },
        },
      },
    },
  };
})();

jest.mock('../../../../selectors/multichain-accounts/account-tree', () => ({
  getAccountTree: jest.fn(() => mockStableAccountTree),
}));

const mockSelectionList: {
  onSelectionChange?: (selected: string[]) => void;
} = {};

jest.mock('./wallet-selection-list', () => ({
  WalletSelectionList: ({
    onSelectionChange,
  }: {
    onSelectionChange: (selected: string[]) => void;
  }) => {
    mockSelectionList.onSelectionChange = onSelectionChange;
    return <div data-testid="wallet-selection-list" />;
  },
}));

const render = (onAddWallets = jest.fn()) => {
  const store = configureStore({ metamask: {} });
  return renderWithProvider(<AddWallets onAddWallets={onAddWallets} />, store);
};

describe('AddWallets', () => {
  it('renders the heading and description', () => {
    render();

    expect(screen.getByText(messages.add_wallets.message)).toBeInTheDocument();
    expect(
      screen.getByText(messages.add_wallets_desc.message),
    ).toBeInTheDocument();
  });

  it('renders the wallet selection list', () => {
    render();

    expect(screen.getByTestId('wallet-selection-list')).toBeInTheDocument();
  });

  it('shows the selection summary for the preselected accounts', () => {
    render();

    expect(screen.getByTestId('qr-sync-selection-summary')).toHaveTextContent(
      '1 wallet · 1 account selected',
    );
  });

  it('disables the import button when nothing is selected', () => {
    render();
    const { onSelectionChange } = mockSelectionList;

    act(() => {
      onSelectionChange?.([]);
    });

    expect(screen.getByTestId('qr-sync-sync-button')).toBeDisabled();
    expect(screen.getByTestId('qr-sync-selection-summary')).toHaveTextContent(
      '0 wallets · 0 accounts selected',
    );
  });

  it('calls onAddWallets with the selected sync summary when import is clicked', () => {
    const onAddWallets = jest.fn();
    render(onAddWallets);

    fireEvent.click(screen.getByText(messages.qrSyncImportAccountsCta.message));

    expect(onAddWallets).toHaveBeenCalledWith({
      selectedAccountGroupIds: [mockGroupId],
      syncedAccountCount: 0,
      syncedWalletCount: 1,
    });
  });
});
