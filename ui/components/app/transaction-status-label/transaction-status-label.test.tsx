import React from 'react';
import { render, screen } from '@testing-library/react';
import { TransactionStatus } from '@metamask/transaction-controller';
import { TransactionGroupStatus } from '../../../../shared/constants/transaction';
import TransactionStatusLabel, { STATUS_DISPLAY_MODE } from '.';

// Mock the useI18nContext hook
jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

// Mock the Tooltip component
jest.mock('../../ui/tooltip', () => {
  const MockTooltip = ({
    children,
    title,
  }: {
    children?: React.ReactNode;
    title?: string;
  }) => (
    <div data-testid="tooltip" data-tooltip-title={title ?? ''}>
      {children}
    </div>
  );

  return {
    // eslint-disable-next-line @typescript-eslint/naming-convention -- Jest ESM interop
    __esModule: true,
    default: MockTooltip,
  };
});

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

  it('should map signed status to pending when isEarliestNonce is true', () => {
    const props = {
      status: TransactionStatus.signed,
      isEarliestNonce: true,
    };

    render(<TransactionStatusLabel {...props} />);
    expect(
      screen.getByText(TransactionGroupStatus.pending),
    ).toBeInTheDocument();
  });

  it('should map signed status to queued when isEarliestNonce is false', () => {
    const props = {
      status: TransactionStatus.signed,
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

  describe('when statusDisplayMode is activityMinimal', () => {
    it('does not display pending status text (submitted, earliest nonce)', () => {
      render(
        <TransactionStatusLabel
          status={TransactionStatus.submitted}
          isEarliestNonce
          statusDisplayMode={STATUS_DISPLAY_MODE.activityMinimal}
        />,
      );
      expect(
        screen.queryByText(TransactionGroupStatus.pending),
      ).not.toBeInTheDocument();
    });

    it('shows signing status text when approved', () => {
      render(
        <TransactionStatusLabel
          status={TransactionStatus.approved}
          statusDisplayMode={STATUS_DISPLAY_MODE.activityMinimal}
        />,
      );
      expect(screen.getByText('signing')).toBeInTheDocument();
    });

    it('hides confirmed status text', () => {
      render(
        <TransactionStatusLabel
          status={TransactionStatus.confirmed}
          date="June 1"
          statusDisplayMode={STATUS_DISPLAY_MODE.activityMinimal}
        />,
      );
      expect(
        screen.queryByText(TransactionStatus.confirmed),
      ).not.toBeInTheDocument();
    });

    it('shows queued status textwhen submitted and not earliest nonce', () => {
      render(
        <TransactionStatusLabel
          status={TransactionStatus.submitted}
          isEarliestNonce={false}
          statusDisplayMode={STATUS_DISPLAY_MODE.activityMinimal}
        />,
      );
      expect(screen.getByText('queued')).toBeInTheDocument();
    });

    it('shows failed, rejected, and dropped status texts with tooltip unchanged', () => {
      const errorMessage = 'RPC blew up';
      const { rerender } = render(
        <TransactionStatusLabel
          status={TransactionStatus.failed}
          error={{ message: errorMessage }}
          statusDisplayMode={STATUS_DISPLAY_MODE.activityMinimal}
        />,
      );
      expect(screen.getByText(TransactionStatus.failed)).toBeInTheDocument();
      expect(screen.getByTestId('tooltip')).toHaveAttribute(
        'data-tooltip-title',
        errorMessage,
      );

      rerender(
        <TransactionStatusLabel
          status={TransactionStatus.rejected}
          error={{ rpc: { message: errorMessage } }}
          statusDisplayMode={STATUS_DISPLAY_MODE.activityMinimal}
        />,
      );
      expect(screen.getByText(TransactionStatus.rejected)).toBeInTheDocument();
      expect(screen.getByTestId('tooltip')).toHaveAttribute(
        'data-tooltip-title',
        errorMessage,
      );

      rerender(
        <TransactionStatusLabel
          status={TransactionStatus.dropped}
          error={{ message: errorMessage }}
          statusDisplayMode={STATUS_DISPLAY_MODE.activityMinimal}
        />,
      );
      expect(screen.getByText(TransactionStatus.dropped)).toBeInTheDocument();
      expect(screen.getByTestId('tooltip')).toHaveAttribute(
        'data-tooltip-title',
        errorMessage,
      );
    });

    it('shows cancelled status text', () => {
      render(
        <TransactionStatusLabel
          status={TransactionGroupStatus.cancelled}
          statusDisplayMode={STATUS_DISPLAY_MODE.activityMinimal}
        />,
      );
      expect(
        screen.getByText(TransactionGroupStatus.cancelled),
      ).toBeInTheDocument();
    });
  });
});
