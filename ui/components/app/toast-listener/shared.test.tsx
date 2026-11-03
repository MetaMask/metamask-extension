import React from 'react';
import { render, screen } from '@testing-library/react';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import {
  showFailedToast,
  showPendingToast,
  showSuccessToast,
  showToast,
} from './shared';

const mockToastLoading = jest.fn();
const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();
const mockToastDismiss = jest.fn();
const mockUseToastLabel = jest.fn();

jest.mock('../../ui/toast/toast', () => ({
  toast: {
    loading: (...args: unknown[]) => mockToastLoading(...args),
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
    dismiss: (...args: unknown[]) => mockToastDismiss(...args),
  },
  ToastContent: ({
    title,
    description,
    dataTestId,
  }: {
    title: string;
    description?: string;
    dataTestId?: string;
  }) => (
    <div data-testid={dataTestId}>
      <p>{title}</p>
      {description ? <p>{description}</p> : null}
    </div>
  ),
}));

jest.mock('./useToastLabel', () => ({
  useToastLabel: (status: string, transactionId?: string) =>
    mockUseToastLabel(status, transactionId),
}));

jest.mock('react-router-dom', () => ({
  Link: ({
    to,
    'aria-label': ariaLabel,
    onClick,
  }: {
    to: string;
    'aria-label'?: string;
    onClick?: () => void;
  }) => (
    <a href={to} aria-label={ariaLabel} onClick={onClick}>
      link
    </a>
  ),
}));

describe('toast-listener/shared', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseToastLabel.mockReturnValue({
      title: messages.transactionConfirmed.message,
    });
  });

  it('shows pending, success, and failed toasts with the given id', () => {
    showPendingToast('pending-id');
    showSuccessToast('success-id');
    showFailedToast('failed-id');

    expect(mockToastLoading).toHaveBeenCalledWith(expect.any(Object), {
      id: 'pending-id',
    });
    expect(mockToastSuccess).toHaveBeenCalledWith(expect.any(Object), {
      id: 'success-id',
    });
    expect(mockToastError).toHaveBeenCalledWith(expect.any(Object), {
      id: 'failed-id',
    });
  });

  it('routes showToast to the matching toast helper', () => {
    showToast('toast-id', 'pending');
    showToast('toast-id', 'success');
    showToast('toast-id', 'failed');

    expect(mockToastLoading).toHaveBeenCalledTimes(1);
    expect(mockToastSuccess).toHaveBeenCalledTimes(1);
    expect(mockToastError).toHaveBeenCalledTimes(1);
  });

  it('renders a details link on success toasts when to is provided', () => {
    showSuccessToast('toast-id', {
      transactionId: 'tx-1',
      to: '/tx/eip155:1/0xabc',
    });

    render(mockToastSuccess.mock.calls[0][0]);

    const link = screen.getByRole('link', {
      name: messages.transactionConfirmed.message,
    });
    expect(link).toHaveAttribute('href', '/tx/eip155:1/0xabc');

    link.click();
    expect(mockToastDismiss).toHaveBeenCalledWith('toast-id');
  });

  it('does not render a details link when to is omitted', () => {
    showSuccessToast('toast-id', { transactionId: 'tx-1' });

    render(mockToastSuccess.mock.calls[0][0]);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('sets a data-testid on the pending toast content', () => {
    showPendingToast('pending-id');

    render(mockToastLoading.mock.calls[0][0]);

    expect(
      screen.getByTestId('transaction-submitted-toast'),
    ).toBeInTheDocument();
  });
});
