import React from 'react';
import { render } from '@testing-library/react';
import { TransactionDetailsModal } from './transaction-details-modal';

jest.mock('./transaction-details', () => ({
  TransactionDetails: () => <div data-testid="transaction-details" />,
}));

describe('TransactionDetailsModal', () => {
  it('renders nothing when closed', () => {
    const { queryByTestId } = render(
      <TransactionDetailsModal
        isOpen={false}
        chainId="eip155:1"
        txIdentifier="0x1"
        onClose={jest.fn()}
      />,
    );
    expect(queryByTestId('transaction-details')).not.toBeInTheDocument();
  });

  // Regression test for #43926: the modal previously rendered at z-index 9999
  // (a body portal), tying with react-hot-toast's default toast container and
  // overlaying transaction toasts. It must stay on the design-system modal
  // layer (1050) so toasts render above it.
  it('renders on the design-system modal layer, below toasts', () => {
    const { getByTestId } = render(
      <TransactionDetailsModal
        isOpen
        chainId="eip155:1"
        txIdentifier="0x1"
        onClose={jest.fn()}
      />,
    );

    const container = getByTestId('transaction-details').parentElement;
    expect(container).toHaveClass('z-[1050]');
    expect(container).not.toHaveClass('z-[9999]');
  });
});
