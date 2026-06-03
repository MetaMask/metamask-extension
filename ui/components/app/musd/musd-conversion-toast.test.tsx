/**
 * @jest-environment jsdom
 */
import { act, render, waitFor } from '@testing-library/react';
import React from 'react';
import { toast } from '@metamask/design-system-react';
import { MusdConversionToast } from './musd-conversion-toast';

const mockDismissToast = jest.fn();
const mockUseMusdConversionToastStatus = jest.fn();

jest.mock('@metamask/design-system-react', () => {
  const actual = jest.requireActual('@metamask/design-system-react');
  const mockToast = jest.fn();
  mockToast.dismiss = jest.fn();
  return {
    ...actual,
    toast: mockToast,
  };
});

jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string, values?: string[]) => {
    const translations: Record<string, string> = {
      musdConversionToastInProgress: `Converting ${values?.[0] ?? 'Token'}...`,
      musdConversionToastSuccess: 'mUSD conversion successful',
      musdConversionToastSuccessDescription:
        'Bonus will be claimable within a day.',
      musdConversionToastFailed: 'Conversion failed.',
    };
    return translations[key] ?? key;
  },
}));

jest.mock('../../../hooks/musd/useMusdConversionToastStatus', () => ({
  useMusdConversionToastStatus: () => mockUseMusdConversionToastStatus(),
}));

jest.mock('../../../hooks/musd/useMusdConversionConfirmTrace', () => ({
  useMusdConversionConfirmTrace: jest.fn(),
}));

const mockToast = toast as jest.MockedFunction<typeof toast> & {
  dismiss: jest.Mock;
};

describe('MusdConversionToast', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('dismisses when toastState is null', async () => {
    mockUseMusdConversionToastStatus.mockReturnValue({
      toastState: null,
      sourceTokenSymbol: null,
      activeTransactionId: undefined,
      dismissToast: mockDismissToast,
    });

    render(<MusdConversionToast />);

    await waitFor(() => expect(mockToast).not.toHaveBeenCalled());
  });

  it('renders in-progress toast without timeout', async () => {
    mockUseMusdConversionToastStatus.mockReturnValue({
      toastState: 'in-progress',
      sourceTokenSymbol: 'USDC',
      activeTransactionId: 'tx-1',
      dismissToast: mockDismissToast,
    });

    render(<MusdConversionToast />);

    await waitFor(() => expect(mockToast).toHaveBeenCalled());

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'default',
        title: 'Converting USDC...',
        hasNoTimeout: true,
        'data-testid': 'musd-conversion-toast',
      }),
    );
  });

  it('renders success toast with timeout', async () => {
    jest.useFakeTimers();

    mockUseMusdConversionToastStatus.mockReturnValue({
      toastState: 'success',
      sourceTokenSymbol: 'USDC',
      activeTransactionId: undefined,
      dismissToast: mockDismissToast,
    });

    render(<MusdConversionToast />);

    await waitFor(() => expect(mockToast).toHaveBeenCalled());

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'success',
        title: 'mUSD conversion successful',
        description: 'Bonus will be claimable within a day.',
        hasNoTimeout: false,
      }),
    );

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(mockDismissToast).toHaveBeenCalled();
  });

  it('renders failed toast with timeout', async () => {
    mockUseMusdConversionToastStatus.mockReturnValue({
      toastState: 'failed',
      sourceTokenSymbol: 'USDC',
      activeTransactionId: undefined,
      dismissToast: mockDismissToast,
    });

    render(<MusdConversionToast />);

    await waitFor(() => expect(mockToast).toHaveBeenCalled());

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'danger',
        title: 'Conversion failed.',
        hasNoTimeout: false,
      }),
    );
  });
});
