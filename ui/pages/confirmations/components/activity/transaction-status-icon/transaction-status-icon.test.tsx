import React from 'react';
import { render } from '@testing-library/react';
import { TransactionStatus } from '@metamask/transaction-controller';
import { TransactionStatusIcon } from './transaction-status-icon';

describe('TransactionStatusIcon', () => {
  it('renders confirmation icon for confirmed status', () => {
    const { getByTestId } = render(
      <TransactionStatusIcon status={TransactionStatus.confirmed} />,
    );

    expect(
      getByTestId('transaction-status-icon-confirmed'),
    ).toBeInTheDocument();
  });

  it('renders close icon for failed status', () => {
    const { getByTestId } = render(
      <TransactionStatusIcon status={TransactionStatus.failed} />,
    );

    expect(getByTestId('transaction-status-icon-failed')).toBeInTheDocument();
  });

  it('renders close icon for dropped status', () => {
    const { getByTestId } = render(
      <TransactionStatusIcon status={TransactionStatus.dropped} />,
    );

    expect(getByTestId('transaction-status-icon-dropped')).toBeInTheDocument();
  });

  it('renders clock icon for pending status', () => {
    const { getByTestId } = render(
      <TransactionStatusIcon status={TransactionStatus.submitted} />,
    );

    expect(
      getByTestId('transaction-status-icon-submitted'),
    ).toBeInTheDocument();
  });
});
