import React from 'react';
import { screen, act } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { tEn } from '../../../../../test/lib/i18n-helpers';
import { CancelSpeedupErrorToast } from './cancel-speedup-error-toast';

describe('CancelSpeedupErrorToast', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders cancel title for cancel errors', () => {
    renderWithProvider(
      <CancelSpeedupErrorToast
        isCancel
        errorMessage="some error"
        onClose={mockOnClose}
      />,
    );

    expect(
      screen.getByText(tEn('cancelTransactionFailed') as string),
    ).toBeInTheDocument();
  });

  it('renders speed-up title for speed-up errors', () => {
    renderWithProvider(
      <CancelSpeedupErrorToast
        isCancel={false}
        errorMessage="some error"
        onClose={mockOnClose}
      />,
    );

    expect(
      screen.getByText(tEn('speedUpTransactionFailed') as string),
    ).toBeInTheDocument();
  });

  it('renders friendly description for "already confirmed" errors', () => {
    renderWithProvider(
      <CancelSpeedupErrorToast
        isCancel
        errorMessage="Previous transaction is already confirmed"
        onClose={mockOnClose}
      />,
    );

    expect(
      screen.getByText(
        tEn('cancelSpeedupAlreadyConfirmedDescription') as string,
      ),
    ).toBeInTheDocument();
  });

  it('renders generic description for unknown errors', () => {
    renderWithProvider(
      <CancelSpeedupErrorToast
        isCancel
        errorMessage="gas estimation failed"
        onClose={mockOnClose}
      />,
    );

    expect(
      screen.getByText(tEn('cancelSpeedupFailedDescription') as string),
    ).toBeInTheDocument();
  });

  it('calls onClose when the toast close button is clicked', () => {
    renderWithProvider(
      <CancelSpeedupErrorToast
        isCancel
        errorMessage="some error"
        onClose={mockOnClose}
      />,
    );

    const banner = screen.getByTestId('cancel-speedup-error-toast-banner-base');
    const closeButton = banner.querySelector('[aria-label="Close"]');
    expect(closeButton).toBeTruthy();
    (closeButton as HTMLElement).click();

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('auto-hides after 5 seconds', () => {
    renderWithProvider(
      <CancelSpeedupErrorToast
        isCancel
        errorMessage="some error"
        onClose={mockOnClose}
      />,
    );

    expect(
      screen.getByText(tEn('cancelTransactionFailed') as string),
    ).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
