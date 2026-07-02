import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToastContent, Toaster } from './toast';

jest.mock('../icon/status-icon', () => ({
  StatusIcon: () => null,
}));

const mockToasterBase = jest.fn(() => null);
jest.mock('react-hot-toast', () => ({
  toast: { dismiss: jest.fn() },
  ToastBar: () => null,
  Toaster: (props: Record<string, unknown>) => mockToasterBase(props),
}));

jest.mock('../../../../shared/lib/environment-type', () => ({
  isInteractiveUI: () => true,
}));

describe('ToastContent', () => {
  it('renders the title', () => {
    render(<ToastContent title="Transaction pending" />);
    expect(screen.getByText('Transaction pending')).toBeInTheDocument();
  });

  it('renders the description when provided', () => {
    render(
      <ToastContent
        title="Withdrawal complete"
        description="$20.73 BNB moved to your wallet"
      />,
    );

    expect(screen.getByText('$20.73 BNB moved to your wallet')).toHaveClass(
      'mt-1',
    );
  });

  it('renders an action button when onActionClick is provided', () => {
    const onActionClick = jest.fn();
    render(
      <ToastContent
        title="Transaction confirmed"
        actionText="test-action"
        onActionClick={onActionClick}
      />,
    );
    fireEvent.click(screen.getByText('test-action'));
    expect(onActionClick).toHaveBeenCalledTimes(1);
  });

  it('does not render an action button when onActionClick is not provided', () => {
    render(
      <ToastContent title="Transaction confirmed" actionText="test-action" />,
    );
    expect(screen.queryByText('test-action')).not.toBeInTheDocument();
  });
});

describe('Toaster', () => {
  beforeEach(() => {
    mockToasterBase.mockClear();
  });

  // Regression test for #43926: the transaction details modal renders at
  // z-index 9999 via a body portal and was overlaying the toast on a z-index
  // tie. The toast must stay above full-screen modals.
  it('renders above full-screen modals (z-index > 9999)', () => {
    render(<Toaster />);

    const { containerStyle } = mockToasterBase.mock.calls[0][0] as {
      containerStyle: { zIndex: number };
    };
    expect(containerStyle.zIndex).toBeGreaterThan(9999);
  });
});
