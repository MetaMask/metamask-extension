import React from 'react';
import { act } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
import { toast } from '../../../../components/ui/toast/toast';
import { CancelSpeedupErrorToast } from './cancel-speedup-error-toast';

jest.mock('../../../../components/ui/toast/toast', () => {
  const actual = jest.requireActual<
    typeof import('../../../../components/ui/toast/toast')
  >('../../../../components/ui/toast/toast');
  return {
    ...actual,
    toast: {
      ...actual.toast,
      error: jest.fn(),
      dismiss: jest.fn(),
    },
    ToastContent: actual.ToastContent,
  };
});

describe('CancelSpeedupErrorToast', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows cancel error toast with friendly description', () => {
    renderWithProvider(
      <CancelSpeedupErrorToast
        isCancel
        errorMessage="Previous transaction is already confirmed"
        onClose={mockOnClose}
      />,
    );

    expect(jest.mocked(toast.error)).toHaveBeenCalledWith(
        expect.objectContaining({
          title: messages.cancelTransactionFailed.message,
          description:
            messages.cancelSpeedupAlreadyConfirmedDescription.message,
          dataTestId: 'cancel-speedup-error-toast',
          id: 'cancel-speedup-error-toast',
        }),
        expect.objectContaining({
          duration: 5000,
        }),
      );
  });

  it('shows speed-up error toast with generic description', () => {
    renderWithProvider(
      <CancelSpeedupErrorToast
        isCancel={false}
        errorMessage="gas estimation failed"
        onClose={mockOnClose}
      />,
    );

    expect(jest.mocked(toast.error)).toHaveBeenCalledWith(
        expect.objectContaining({
          title: messages.speedUpTransactionFailed.message,
          description: messages.cancelSpeedupFailedDescription.message,
          dataTestId: 'cancel-speedup-error-toast',
          id: 'cancel-speedup-error-toast',
        }),
        expect.objectContaining({
          duration: 5000,
        }),
      );
  });

  it('dismisses toast on unmount', () => {
    const { unmount } = renderWithProvider(
      <CancelSpeedupErrorToast
        isCancel
        errorMessage="some error"
        onClose={mockOnClose}
      />,
    );

    unmount();

    expect(jest.mocked(toast.dismiss)).toHaveBeenCalledWith(
      'cancel-speedup-error-toast',
    );
  });

  it('calls onClose after 5 seconds', () => {
    renderWithProvider(
      <CancelSpeedupErrorToast
        isCancel
        errorMessage="some error"
        onClose={mockOnClose}
      />,
    );

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
