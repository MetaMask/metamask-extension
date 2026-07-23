import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { createHardwareWalletAccount } from '../../../../test/data/hardware-wallet-accounts';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import type { HardwareAccountCardProps } from './hardware-account-card.types';
import { HardwareAccountCard } from './hardware-account-card';

const defaultAccount = createHardwareWalletAccount();

const renderCard = (props: Partial<HardwareAccountCardProps> = {}) => {
  const onToggleSelection = props.onToggleSelection ?? jest.fn();

  return {
    onToggleSelection,
    ...renderWithProvider(
      <HardwareAccountCard
        account={defaultAccount}
        isSelected={false}
        onToggleSelection={onToggleSelection}
        {...props}
      />,
    ),
  };
};

describe('HardwareAccountCard', () => {
  describe('rendering', () => {
    it('renders account name, total balance, and address rows', () => {
      renderCard();

      expect(screen.getByText('Account 1')).toBeInTheDocument();
      expect(
        screen.getByTestId('hardware-account-card-total-balance'),
      ).toHaveTextContent('$120.00');
      expect(
        screen.getAllByTestId('hardware-account-address-row'),
      ).toHaveLength(1);
    });

    it('marks the card as selected when isSelected is true', () => {
      renderCard({ isSelected: true });

      expect(screen.getByTestId('hardware-account-card')).toHaveAttribute(
        'data-selected',
        'true',
      );
    });

    it('marks the card as unselected when isSelected is false', () => {
      renderCard({ isSelected: false });

      expect(screen.getByTestId('hardware-account-card')).toHaveAttribute(
        'data-selected',
        'false',
      );
    });

    it('does not set a tooltip title when the account is selectable', () => {
      renderCard();

      expect(screen.getByTestId('hardware-account-card')).not.toHaveAttribute(
        'title',
      );
    });
  });

  describe('selection', () => {
    it('calls onToggleSelection when the checkbox is clicked', () => {
      const { onToggleSelection } = renderCard();

      fireEvent.click(screen.getByRole('checkbox', { name: 'Account 1' }));

      expect(onToggleSelection).toHaveBeenCalledTimes(1);
      expect(onToggleSelection).toHaveBeenCalledWith('account-0');
    });

    it('calls onToggleSelection when the header is clicked', () => {
      const { onToggleSelection } = renderCard();

      fireEvent.click(screen.getByTestId('hardware-account-card-header'));

      expect(onToggleSelection).toHaveBeenCalledTimes(1);
      expect(onToggleSelection).toHaveBeenCalledWith('account-0');
    });

    it('calls onToggleSelection when Enter is pressed on the header', () => {
      const { onToggleSelection } = renderCard();

      fireEvent.keyDown(screen.getByTestId('hardware-account-card-header'), {
        key: 'Enter',
      });

      expect(onToggleSelection).toHaveBeenCalledTimes(1);
      expect(onToggleSelection).toHaveBeenCalledWith('account-0');
    });

    it('calls onToggleSelection when Space is pressed on the header', () => {
      const { onToggleSelection } = renderCard();

      fireEvent.keyDown(screen.getByTestId('hardware-account-card-header'), {
        key: ' ',
      });

      expect(onToggleSelection).toHaveBeenCalledTimes(1);
      expect(onToggleSelection).toHaveBeenCalledWith('account-0');
    });
  });

  describe('already connected accounts', () => {
    const connectedAccount = createHardwareWalletAccount({
      isAlreadyConnected: true,
    });

    it('disables selection and shows an already connected tooltip', () => {
      const onToggleSelection = jest.fn();

      renderCard({
        account: connectedAccount,
        onToggleSelection,
      });

      expect(
        screen.getByRole('checkbox', { name: 'Account 1' }),
      ).toBeDisabled();
      expect(
        screen.getByTitle(messages.selectAnAccountAlreadyConnected.message),
      ).toBeInTheDocument();

      fireEvent.click(screen.getByRole('checkbox', { name: 'Account 1' }));
      fireEvent.click(screen.getByTestId('hardware-account-card-header'));

      expect(onToggleSelection).not.toHaveBeenCalled();
    });

    it('does not toggle selection when Enter is pressed on a disabled header', () => {
      const onToggleSelection = jest.fn();

      renderCard({
        account: connectedAccount,
        onToggleSelection,
      });

      fireEvent.keyDown(screen.getByTestId('hardware-account-card-header'), {
        key: 'Enter',
      });

      expect(onToggleSelection).not.toHaveBeenCalled();
    });

    it('renders the checkbox as checked even when isSelected is false', () => {
      renderCard({
        account: connectedAccount,
        isSelected: false,
      });

      expect(screen.getByRole('checkbox', { name: 'Account 1' })).toBeChecked();
    });
  });
});
