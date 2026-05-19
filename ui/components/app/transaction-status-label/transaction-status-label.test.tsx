import React from 'react';
import { render, screen } from '@testing-library/react';
import { TransactionStatus } from '@metamask/transaction-controller';
import { TransactionGroupStatus } from '../../../../shared/constants/transaction';
import {
  getTransactionDisplayStatusKey,
  shouldShowActivityListStatusSubtitle,
} from '../../../../shared/lib/activity/transaction-display-status';
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
    wrapperClassName,
  }: {
    children?: React.ReactNode;
    title?: string;
    wrapperClassName?: string;
  }) => (
    <div
      data-testid="tooltip"
      data-tooltip-title={title ?? ''}
      className={wrapperClassName}
    >
      {children}
    </div>
  );

  return {
    // eslint-disable-next-line @typescript-eslint/naming-convention -- Jest ESM interop
    __esModule: true,
    default: MockTooltip,
  };
});

describe('getTransactionDisplayStatusKey', () => {
  it('maps approved to signing', () => {
    expect(getTransactionDisplayStatusKey(TransactionStatus.approved)).toBe(
      'signing',
    );
  });

  it('maps submitted to pending when earliest nonce', () => {
    expect(
      getTransactionDisplayStatusKey(TransactionStatus.submitted, true),
    ).toBe(TransactionGroupStatus.pending);
  });

  it('maps submitted to queued when not earliest nonce', () => {
    expect(
      getTransactionDisplayStatusKey(TransactionStatus.submitted, false),
    ).toBe('queued');
  });
});

describe('shouldShowActivityListStatusSubtitle', () => {
  it('returns false for undefined, empty string, and confirmed', () => {
    expect(shouldShowActivityListStatusSubtitle(undefined)).toBe(false);
    expect(shouldShowActivityListStatusSubtitle('')).toBe(false);
    expect(
      shouldShowActivityListStatusSubtitle(TransactionStatus.confirmed),
    ).toBe(false);
  });

  it('returns true for keys that render a status subtitle', () => {
    expect(shouldShowActivityListStatusSubtitle('queued')).toBe(true);
    expect(shouldShowActivityListStatusSubtitle('signing')).toBe(true);
    expect(shouldShowActivityListStatusSubtitle(TransactionStatus.failed)).toBe(
      true,
    );
    expect(
      shouldShowActivityListStatusSubtitle(TransactionGroupStatus.cancelled),
    ).toBe(true);
  });

  it('returns false for pending (earliest nonce) key', () => {
    expect(
      shouldShowActivityListStatusSubtitle(TransactionGroupStatus.pending),
    ).toBe(false);
  });
});

describe('TransactionStatusLabel Component', () => {
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

  it('displays confirmed status text', () => {
    render(
      <TransactionStatusLabel status={TransactionStatus.confirmed} />,
    );
    expect(screen.getByText(TransactionStatus.confirmed)).toBeInTheDocument();
  });

  it('label overrides the displayed text', () => {
    render(
      <TransactionStatusLabel
        status={TransactionStatus.confirmed}
        label="cancelled"
      />,
    );
    expect(screen.getByText('cancelled')).toBeInTheDocument();
  });

  it('label applies confirmed class regardless of status', () => {
    render(
      <TransactionStatusLabel
        status={TransactionStatus.failed}
        label="cancelled"
      />,
    );
    expect(screen.getByTestId('tooltip').className).toContain(
      'transaction-status-label--confirmed',
    );
    expect(screen.getByTestId('tooltip').className).not.toContain(
      'transaction-status-label--failed',
    );
  });

  it('tooltip prop overrides the tooltip text', () => {
    render(
      <TransactionStatusLabel
        status={TransactionStatus.failed}
        error={{ message: 'original error' }}
        tooltip="custom tooltip"
      />,
    );
    expect(screen.getByTestId('tooltip')).toHaveAttribute(
      'data-tooltip-title',
      'custom tooltip',
    );
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

    it('displays signing status text when approved', () => {
      render(
        <TransactionStatusLabel
          status={TransactionStatus.approved}
          statusDisplayMode={STATUS_DISPLAY_MODE.activityMinimal}
        />,
      );
      expect(screen.getByText('signing')).toBeInTheDocument();
    });

    it('does not display confirmed status text', () => {
      render(
        <TransactionStatusLabel
          status={TransactionStatus.confirmed}
          statusDisplayMode={STATUS_DISPLAY_MODE.activityMinimal}
        />,
      );
      expect(
        screen.queryByText(TransactionStatus.confirmed),
      ).not.toBeInTheDocument();
    });

    it('displays queued status text when submitted and not earliest nonce', () => {
      render(
        <TransactionStatusLabel
          status={TransactionStatus.submitted}
          isEarliestNonce={false}
          statusDisplayMode={STATUS_DISPLAY_MODE.activityMinimal}
        />,
      );
      expect(screen.getByText('queued')).toBeInTheDocument();
    });

    it('displays failed, rejected, and dropped status texts with tooltip unchanged', () => {
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

    it('displays cancelled status text', () => {
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
