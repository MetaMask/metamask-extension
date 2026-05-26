import React from 'react';
import { render, screen } from '@testing-library/react';
import { enLocale as messages } from '../../../test/lib/i18n-helpers';
import { ToastContent, showToast, type ToastStatus } from './shared';

const mockToastLoading = jest.fn();
const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();
const mockUseTransactionDisplay = jest.fn();

jest.mock('react-hot-toast', () => ({
  toast: {
    loading: (...args: unknown[]) => mockToastLoading(...args),
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}));

jest.mock('../../helpers/utils/transaction-display', () => ({
  useTransactionDisplay: (status: string) => mockUseTransactionDisplay(status),
}));

jest.mock('../../components/ui/toast/toast', () => ({
  ToastContent: ({ title }: { title: string }) => <div>{title}</div>,
}));

describe('toast-listener/shared', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTransactionDisplay.mockReturnValue({
      title: messages.transactionSubmitted.message,
    });
  });

  it('renders the transaction title in ToastContent', () => {
    render(<ToastContent status="pending" />);

    expect(mockUseTransactionDisplay).toHaveBeenCalledWith('pending');
    expect(
      screen.getByText(messages.transactionSubmitted.message),
    ).toBeInTheDocument();
  });

  it('shows a pending toast', () => {
    showToast('toast-id', 'pending' as ToastStatus);

    expect(mockToastLoading).toHaveBeenCalledWith(expect.any(Object), {
      id: 'toast-id',
    });
  });

  it('shows a success toast', () => {
    showToast('toast-id', 'success' as ToastStatus);

    expect(mockToastSuccess).toHaveBeenCalledWith(expect.any(Object), {
      id: 'toast-id',
    });
  });

  it('shows a failed toast', () => {
    showToast('toast-id', 'failed' as ToastStatus);

    expect(mockToastError).toHaveBeenCalledWith(expect.any(Object), {
      id: 'toast-id',
    });
  });
});
