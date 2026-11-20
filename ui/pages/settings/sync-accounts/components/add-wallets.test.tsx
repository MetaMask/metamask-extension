import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
// eslint-disable-next-line import-x/no-restricted-paths
import messages from '../../../../../app/_locales/en/messages.json';
import AddWallets from './add-wallets';

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

const mockMultiWalletAccountTree = (() => {
  const { AccountWalletType: WalletType, toAccountWalletId: toWalletId } =
    jest.requireActual('@metamask/account-api');
  const walletId = toWalletId(WalletType.Entropy, 'entropy2');
  const groupId = `${walletId}/0`;

  return {
    wallets: {
      ...mockStableAccountTree.wallets,
      [walletId]: {
        id: walletId,
        type: WalletType.Entropy,
        metadata: { name: 'Second Wallet', entropy: { id: 'entropy2' } },
        groups: {
          [groupId]: {
            id: groupId,
            metadata: { name: 'Account 2' },
          },
        },
      },
    },
  };
})();

let mockAccountTree = mockStableAccountTree;

jest.mock('../../../../selectors/multichain-accounts/account-tree', () => ({
  getAccountTree: jest.fn(() => mockAccountTree),
}));

jest.mock('./wallet-selection-list', () => ({
  WalletSelectionList: () => <div data-testid="wallet-selection-list" />,
}));

const render = (onAddWallets = jest.fn()) => {
  const store = configureStore({ metamask: {} });
  return renderWithProvider(<AddWallets onAddWallets={onAddWallets} />, store);
};

describe('AddWallets', () => {
  beforeEach(() => {
    mockAccountTree = mockStableAccountTree;
  });

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

  it('shows the selection summary and a count-specific sync action', () => {
    render();

    expect(screen.getByTestId('qr-sync-selection-summary')).toHaveTextContent(
      '2 wallets · 18 accounts selected',
    );
    expect(screen.getByTestId('qr-sync-selection-footer')).toHaveClass(
      'pt-3',
      'gap-3',
    );
    expect(screen.queryByText('Deselect all')).not.toBeInTheDocument();
    expect(screen.queryByText('Select all')).not.toBeInTheDocument();
    expect(screen.getByText('Import accounts')).toBeInTheDocument();
  });

  it('does not show a select-all control for multiple wallets', () => {
    mockAccountTree = mockMultiWalletAccountTree;

    render();

    expect(screen.getByTestId('qr-sync-selection-summary')).toHaveTextContent(
      '2 wallets · 18 accounts selected',
    );
    expect(screen.queryByText('Deselect all')).not.toBeInTheDocument();
    expect(screen.queryByText('Select all')).not.toBeInTheDocument();
  });

  it('keeps selections mapped to their source wallets', () => {
    mockAccountTree = mockMultiWalletAccountTree;
    const onAddWallets = jest.fn();

    render(onAddWallets);
    fireEvent.click(screen.getByText('Import accounts'));

    expect(onAddWallets.mock.calls[0][0].selectedAccountGroupIds).toHaveLength(
      2,
    );
    expect(
      Object.values(onAddWallets.mock.calls[0][0].selectedAccountGroupCounts),
    ).toStrictEqual([10, 8]);
  });

  it('calls onAddWallets with the selected sync summary when sync is clicked', () => {
    const onAddWallets = jest.fn();
    render(onAddWallets);

    fireEvent.click(screen.getByText('Import accounts'));

    expect(onAddWallets).toHaveBeenCalledWith(
      expect.objectContaining({
        selectedAccountGroupIds: expect.any(Array),
        selectedAccountGroupCounts: expect.any(Object),
        importSummary: expect.objectContaining({
          wallets: [
            expect.objectContaining({
              name: 'Wallet 1',
              accounts: expect.any(Array),
            }),
            expect.objectContaining({
              name: 'Wallet 2',
              accounts: expect.any(Array),
            }),
          ],
        }),
        syncedAccountCount: 18,
        syncedWalletCount: 2,
      }),
    );
    expect(onAddWallets.mock.calls[0][0].selectedAccountGroupIds).toHaveLength(
      1,
    );
    expect(
      Object.values(onAddWallets.mock.calls[0][0].selectedAccountGroupCounts),
    ).toStrictEqual([18]);
    expect(
      onAddWallets.mock.calls[0][0].importSummary.wallets.map(
        (wallet: { accounts: unknown[] }) => wallet.accounts.length,
      ),
    ).toStrictEqual([10, 8]);
  });
});
