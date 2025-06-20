import React from 'react';
import { render, screen } from '@testing-library/react';
import { TransactionStatus } from '@metamask/transaction-controller';
import { TransactionGroupStatus } from '../../../../shared/constants/transaction';
import TransactionStatusLabel from '.';

// Mock the useI18nContext hook
jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key) => key,
}));

// Mock the Tooltip component
jest.mock('../../ui/tooltip', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="tooltip">{children}</div>,
}));

describe('TransactionStatusLabel Component', () => {
  it('should render CONFIRMED status and date', () => {
    const props = {
      status: 'confirmed',
      date: 'June 1',
      statusOnly: false,
    };

    render(<TransactionStatusLabel {...props} />);
    expect(screen.getByText('June 1')).toBeInTheDocument();
  });

  it('should render PENDING status when submitted and isEarliestNonce is true', () => {
    const props = {
      status: TransactionStatus.submitted,
      isEarliestNonce: true,
    };

    render(<TransactionStatusLabel {...props} />);
    expect(
      screen.getByText(TransactionGroupStatus.pending),
    ).toBeInTheDocument();
  });

  it('should render QUEUED status when submitted and isEarliestNonce is false', () => {
    const props = {
      status: TransactionStatus.submitted,
      isEarliestNonce: false,
    };

    render(<TransactionStatusLabel {...props} />);
    expect(screen.getByText('queued')).toBeInTheDocument();
  });

  it('should render UNAPPROVED status', () => {
    const props = {
      status: TransactionStatus.unapproved,
    };

    render(<TransactionStatusLabel {...props} />);
    expect(screen.getByText(TransactionStatus.unapproved)).toBeInTheDocument();
  });

  it('should render SIGNING status when approved', () => {
    const props = {
      status: TransactionStatus.approved,
    };

    render(<TransactionStatusLabel {...props} />);
    expect(screen.getByText('signing')).toBeInTheDocument();
  });

  it('should handle error prop for tooltip', () => {
    const errorMessage = 'An error occurred';
    const props = {
      status: TransactionStatus.failed,
      error: { message: errorMessage },
    };

    render(<TransactionStatusLabel {...props} />);
    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    expect(screen.getByText(TransactionStatus.failed)).toBeInTheDocument();
  });

  it('should map approved status to signing status', () => {
    const props = {
      status: TransactionStatus.approved,
    };

    render(<TransactionStatusLabel {...props} />);
    expect(screen.getByText('signing')).toBeInTheDocument();
  });

  it('should map submitted status to pending when isEarliestNonce is true', () => {
    const props = {
      status: TransactionStatus.submitted,
      isEarliestNonce: true,
    };

    render(<TransactionStatusLabel {...props} />);
    expect(
      screen.getByText(TransactionGroupStatus.pending),
    ).toBeInTheDocument();
  });

  it('should map submitted status to queued when isEarliestNonce is false', () => {
    const props = {
      status: TransactionStatus.submitted,
      isEarliestNonce: false,
    };

    render(<TransactionStatusLabel {...props} />);
    expect(screen.getByText('queued')).toBeInTheDocument();
  });

  it('should display date for confirmed transactions when not statusOnly', () => {
    const props = {
      status: TransactionStatus.confirmed,
      date: 'June 1',
      statusOnly: false,
    };

    render(<TransactionStatusLabel {...props} />);
    expect(screen.getByText('June 1')).toBeInTheDocument();
  });

  it('should display status text for confirmed transactions when statusOnly is true', () => {
    const props = {
      status: TransactionStatus.confirmed,
      date: 'June 1',
      statusOnly: true,
    };

    render(<TransactionStatusLabel {...props} />);
    expect(screen.getByText(TransactionStatus.confirmed)).toBeInTheDocument();
  });
});
