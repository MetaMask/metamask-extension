import React from 'react';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { toast, ToastContent, Toaster, ERROR_TOAST_TEST_ID } from './toast';

jest.mock('../status-icon/status-icon', () => ({
  StatusIcon: () => null,
}));

jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
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
  afterEach(() => {
    act(() => {
      toast.remove();
    });
    cleanup();
  });

  it('sets error-toast test id on error toasts', async () => {
    render(<Toaster />);
    act(() => {
      toast.error('None of the cryptocurrencies are supported by price api');
    });

    await waitFor(() => {
      expect(screen.getByTestId(ERROR_TOAST_TEST_ID)).toHaveTextContent(
        'None of the cryptocurrencies are supported by price api',
      );
    });
  });

  it('does not set error-toast test id on success toasts', async () => {
    render(<Toaster />);
    act(() => {
      toast.success('Network added successfully');
    });

    await waitFor(() => {
      expect(
        screen.getByText('Network added successfully'),
      ).toBeInTheDocument();
    });
    expect(screen.queryByTestId(ERROR_TOAST_TEST_ID)).not.toBeInTheDocument();
  });
});
