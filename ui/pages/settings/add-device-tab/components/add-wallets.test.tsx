import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
// eslint-disable-next-line import-x/no-restricted-paths
import messages from '../../../../../app/_locales/en/messages.json';
import AddWallets from './add-wallets';

jest.mock('../../../../selectors/multichain-accounts/account-tree', () => {
  const { AccountWalletType: WalletType, toAccountWalletId: toWalletId } =
    jest.requireActual('@metamask/account-api');
  const mockWalletId = toWalletId(WalletType.Keyring, 'wallet1');
  const mockGroupId = `${mockWalletId}/0`;
  return {
    getAccountTree: jest.fn(() => ({
      wallets: {
        [mockWalletId]: {
          id: mockWalletId,
          type: WalletType.Keyring,
          metadata: { name: 'My Wallet' },
          groups: {
            [mockGroupId]: {
              id: mockGroupId,
              metadata: { name: 'Account 1' },
            },
          },
        },
      },
    })),
  };
});

jest.mock('./wallet-selection-list', () => ({
  WalletSelectionList: () => <div data-testid="wallet-selection-list" />,
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

  it('calls onAddWallets with the selected sync summary when continue is clicked', () => {
    const onAddWallets = jest.fn();
    render(onAddWallets);

    fireEvent.click(screen.getByText(messages.continue.message));

    expect(onAddWallets).toHaveBeenCalledWith({
      entropyIds: ['wallet1'],
      syncedAccountCount: 1,
      syncedWalletCount: 1,
    });
  });
});
