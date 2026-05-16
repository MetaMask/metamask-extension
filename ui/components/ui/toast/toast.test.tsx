import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToastContent } from './toast';

jest.mock('../icon/status-icon', () => ({
  StatusIcon: () => null,
}));

describe('ToastContent', () => {
  it('renders the title', () => {
    render(<ToastContent title="Transaction pending" />);
    expect(screen.getByText('Transaction pending')).toHaveClass('font-bold');
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
