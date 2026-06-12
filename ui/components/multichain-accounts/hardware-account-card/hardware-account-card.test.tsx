import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { ETH_TOKEN_IMAGE_URL } from '../../../../shared/constants/network';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import type { HardwareWalletAccount } from './hardware-account-card.types';
import { HardwareAccountCard } from './hardware-account-card';

describe('HardwareAccountCard', () => {
  const account: HardwareWalletAccount = {
    id: 'account-0',
    name: 'Account 1',
    totalBalance: '$120.00',
    addresses: [
      {
        id: 'eth-0',
        networkName: 'Ethereum',
        address: '0x091234567890123456789012345678901234b272',
        balance: '$120.00',
        iconUrl: ETH_TOKEN_IMAGE_URL,
        iconType: 'network',
      },
    ],
  };

  it('renders account details and toggles selection from the checkbox', () => {
    const onToggleSelection = jest.fn();

    renderWithProvider(
      <HardwareAccountCard
        account={account}
        isSelected={false}
        onToggleSelection={onToggleSelection}
      />,
    );

    expect(screen.getByText('Account 1')).toBeInTheDocument();
    expect(
      screen.getByTestId('hardware-account-card-total-balance'),
    ).toHaveTextContent('$120.00');

    fireEvent.click(screen.getByRole('checkbox', { name: 'Account 1' }));

    expect(onToggleSelection).toHaveBeenCalledWith('account-0');
  });

  it('toggles selection when the account header is clicked', () => {
    const onToggleSelection = jest.fn();

    renderWithProvider(
      <HardwareAccountCard
        account={account}
        isSelected={false}
        onToggleSelection={onToggleSelection}
      />,
    );

    fireEvent.click(screen.getByTestId('hardware-account-card-header'));

    expect(onToggleSelection).toHaveBeenCalledWith('account-0');
  });

  it('toggles selection when the account name is clicked', () => {
    const onToggleSelection = jest.fn();

    renderWithProvider(
      <HardwareAccountCard
        account={account}
        isSelected={false}
        onToggleSelection={onToggleSelection}
      />,
    );

    fireEvent.click(screen.getByText('Account 1'));

    expect(onToggleSelection).toHaveBeenCalledWith('account-0');
  });

  it('applies selected styling when selected', () => {
    renderWithProvider(
      <HardwareAccountCard
        account={account}
        isSelected
        onToggleSelection={jest.fn()}
      />,
    );

    expect(screen.getByTestId('hardware-account-card')).toHaveAttribute(
      'data-selected',
      'true',
    );
  });

  it('disables selection for already connected accounts', () => {
    const onToggleSelection = jest.fn();

    renderWithProvider(
      <HardwareAccountCard
        account={{ ...account, isAlreadyConnected: true }}
        isSelected={false}
        onToggleSelection={onToggleSelection}
      />,
    );

    expect(screen.getByRole('checkbox', { name: 'Account 1' })).toBeDisabled();
    expect(
      screen.getByTitle(messages.selectAnAccountAlreadyConnected.message),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('checkbox', { name: 'Account 1' }));
    fireEvent.click(screen.getByTestId('hardware-account-card-header'));

    expect(onToggleSelection).not.toHaveBeenCalled();
  });

  it('does not apply selected styling when unselected', () => {
    renderWithProvider(
      <HardwareAccountCard
        account={account}
        isSelected={false}
        onToggleSelection={jest.fn()}
      />,
    );

    expect(screen.getByTestId('hardware-account-card')).toHaveAttribute(
      'data-selected',
      'false',
    );
  });

  it('does not set a title when the account is selectable', () => {
    renderWithProvider(
      <HardwareAccountCard
        account={account}
        isSelected={false}
        onToggleSelection={jest.fn()}
      />,
    );

    expect(screen.getByTestId('hardware-account-card')).not.toHaveAttribute(
      'title',
    );
  });
});
