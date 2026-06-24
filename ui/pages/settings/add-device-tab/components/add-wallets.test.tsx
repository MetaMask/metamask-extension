import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import { AddDeviceSettingsStep } from '../constant';
import AddWallets from './add-wallets';

jest.mock('../../../../selectors/multichain-accounts/account-tree', () => ({
  getAccountTree: jest.fn(() => ({ wallets: {} })),
}));

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

    expect(screen.getByText('Choose what to sync')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Pick the wallets and accounts to import to your phone. You can change this later.',
      ),
    ).toBeInTheDocument();
  });

  it('renders the wallet selection list', () => {
    render();

    expect(screen.getByTestId('wallet-selection-list')).toBeInTheDocument();
  });

  it('calls onAddWallets with the SyncingWallets step when continue is clicked', () => {
    const onAddWallets = jest.fn();
    render(onAddWallets);

    fireEvent.click(screen.getByText('Continue'));

    expect(onAddWallets).toHaveBeenCalledWith(
      AddDeviceSettingsStep.SyncingWallets,
    );
  });
});
