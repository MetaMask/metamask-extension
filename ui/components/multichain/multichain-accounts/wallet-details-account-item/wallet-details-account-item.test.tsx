import React from 'react';
import { fireEvent } from '@testing-library/react';
import { InternalAccount } from '@metamask/keyring-internal-api';
import configureStore from '../../../../store/store';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import mockState from '../../../../../test/data/mock-state.json';
import WalletDetailsAccountItem from './wallet-details-account-item';

jest.mock(
  '../../../app/user-preferenced-currency-display/user-preferenced-currency-display.component',
  () => () => <div data-testid="mock-currency-display">Currency</div>,
);

describe('WalletDetailsAccountItem', () => {
  const mockAccount: InternalAccount = {
    id: 'test-id',
    address: '0x123',
    metadata: {
      name: 'Test Account',
    },
  } as InternalAccount;

  const mockOnClick = jest.fn();
  const mockOnBalanceUpdate = jest.fn();

  it('renders correctly', () => {
    const store = configureStore(mockState);
    const { getByTestId, getByText } = renderWithProvider(
      <WalletDetailsAccountItem
        account={mockAccount}
        onClick={mockOnClick}
        onBalanceUpdate={mockOnBalanceUpdate}
      />,
      store,
    );

    expect(getByText('Test Account')).toBeInTheDocument();
    expect(getByTestId('mock-currency-display')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const store = configureStore(mockState);
    const { getByText } = renderWithProvider(
      <WalletDetailsAccountItem
        account={mockAccount}
        onClick={mockOnClick}
        onBalanceUpdate={mockOnBalanceUpdate}
      />,
      store,
    );

    fireEvent.click(getByText('Test Account'));
    expect(mockOnClick).toHaveBeenCalledWith(mockAccount);
  });

  it('calls onBalanceUpdate when balance changes', () => {
    const store = configureStore(mockState);
    const { rerender } = renderWithProvider(
      <WalletDetailsAccountItem
        account={mockAccount}
        onClick={mockOnClick}
        onBalanceUpdate={mockOnBalanceUpdate}
      />,
      store,
    );

    // Force a re-render to trigger useEffect
    rerender(
      <WalletDetailsAccountItem
        account={mockAccount}
        onClick={mockOnClick}
        onBalanceUpdate={mockOnBalanceUpdate}
      />,
    );

    expect(mockOnBalanceUpdate).toHaveBeenCalled();
  });
});
