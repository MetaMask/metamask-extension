import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/jest/rendering';
import TransactionShield from './transaction-shield';

describe('Transaction Shield Page', () => {
  it('should render', () => {
    const { getByTestId } = renderWithProvider(<TransactionShield />);

    const transactionShieldPage = getByTestId('transaction-shield-page');
    expect(transactionShieldPage).toBeInTheDocument();
  });

  it('should call onCancelMembership when the cancel membership button is clicked', async () => {
    const { getByTestId } = renderWithProvider(<TransactionShield />);

    const cancelMembershipButton = getByTestId(
      'shield-tx-membership-cancel-button',
    );
    fireEvent.click(cancelMembershipButton);

    const cancelMembershipModal = await screen.findByTestId(
      'cancel-membership-modal',
    );

    expect(cancelMembershipModal).toBeInTheDocument();
  });
});
