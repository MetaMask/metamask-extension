import React from 'react';
import { render, screen } from '@testing-library/react';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import {
  showPendingToast,
  showSuccessToast,
  showToast,
  type ToastStatus,
} from './shared';

const mockToastLoading = jest.fn();
const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();
const mockUseToastLabel = jest.fn();

jest.mock('../../ui/toast/toast', () => ({
  toast: {
    loading: (...args: unknown[]) => mockToastLoading(...args),
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
  ToastContent: ({
    title,
    description,
  }: {
    title: string;
    description?: string;
  }) => (
    <div>
      <p>{title}</p>
      {description ? <p>{description}</p> : null}
    </div>
  ),
}));

jest.mock('./useToastLabel', () => ({
  useToastLabel: (status: string, transactionId?: string) =>
    mockUseToastLabel(status, transactionId),
}));

describe('toast-listener/shared', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseToastLabel.mockReturnValue({
      title: messages.transactionSubmitted.message,
    });
  });

  it('shows a pending toast with the derived title', () => {
    showPendingToast('toast-id');

    expect(mockToastLoading).toHaveBeenCalledWith(expect.any(Object), {
      id: 'toast-id',
    });

    render(mockToastLoading.mock.calls[0][0]);
    expect(mockUseToastLabel).toHaveBeenCalledWith('pending', undefined);
    expect(
      screen.getByText(messages.transactionSubmitted.message),
    ).toBeInTheDocument();
  });

  it('shows a custom success toast', () => {
    showSuccessToast('toast-id', {
      title: messages.perpsWithdrawPostQuoteToastSuccessTitle.message,
      description: '$20.73 BNB moved to your wallet',
    });

    expect(mockToastSuccess).toHaveBeenCalledWith(expect.any(Object), {
      id: 'toast-id',
    });

    render(mockToastSuccess.mock.calls[0][0]);
    expect(
      screen.getByText(
        messages.perpsWithdrawPostQuoteToastSuccessTitle.message,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText('$20.73 BNB moved to your wallet'),
    ).toBeInTheDocument();
  });

  it('shows a pending toast via showToast', () => {
    showToast('toast-id', 'pending' as ToastStatus);

    expect(mockToastLoading).toHaveBeenCalledWith(expect.any(Object), {
      id: 'toast-id',
    });
  });

  it('shows a success toast via showToast', () => {
    showToast('toast-id', 'success' as ToastStatus);

    expect(mockToastSuccess).toHaveBeenCalledWith(expect.any(Object), {
      id: 'toast-id',
    });
  });

  it('shows a failed toast via showToast', () => {
    showToast('toast-id', 'failed' as ToastStatus);

    expect(mockToastError).toHaveBeenCalledWith(expect.any(Object), {
      id: 'toast-id',
    });
  });

  it('passes to as a toast option for success toasts only', () => {
    showSuccessToast('toast-id', {
      transactionId: 'tx-1',
      to: '/tx/eip155:1/0xabc',
    });
    showPendingToast('pending-id', {
      transactionId: 'tx-1',
      to: '/tx/eip155:1/0xabc',
    });

    expect(mockToastSuccess).toHaveBeenCalledWith(expect.any(Object), {
      id: 'toast-id',
      to: '/tx/eip155:1/0xabc',
    });
    expect(mockToastLoading).toHaveBeenCalledWith(expect.any(Object), {
      id: 'pending-id',
    });
  });

  it('passes to as a toast option for success toasts only', () => {
    showSuccessToast('toast-id', {
      transactionId: 'tx-1',
      to: '/tx/eip155:1/0xabc',
    });
    showPendingToast('pending-id', {
      transactionId: 'tx-1',
      to: '/tx/eip155:1/0xabc',
    });

    expect(mockToastSuccess).toHaveBeenCalledWith(expect.any(Object), {
      id: 'toast-id',
      to: '/tx/eip155:1/0xabc',
    });
    expect(mockToastLoading).toHaveBeenCalledWith(expect.any(Object), {
      id: 'pending-id',
    });
  });
});
