/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MusdConversionToast } from './musd-conversion-toast';

const mockDismissToast = jest.fn();
const mockUseMusdConversionToastStatus = jest.fn();

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

let capturedToastProps: Record<string, unknown> | null = null;
jest.mock('../../multichain/toast', () => ({
  Toast: (props: Record<string, unknown>) => {
    capturedToastProps = props;
    return (
      <div data-testid={props.dataTestId as string}>{props.text as string}</div>
    );
  },
}));

describe('MusdConversionToast', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedToastProps = null;
  });

  it('renders nothing when toastState is null', () => {
    mockUseMusdConversionToastStatus.mockReturnValue({
      toastState: null,
      sourceTokenSymbol: null,
      activeTransactionId: undefined,
      dismissToast: mockDismissToast,
    });

    const { container } = render(<MusdConversionToast />);

    expect(container.innerHTML).toBe('');
  });

  it('renders in-progress toast without autoHide', () => {
    mockUseMusdConversionToastStatus.mockReturnValue({
      toastState: 'in-progress',
      sourceTokenSymbol: 'USDC',
      activeTransactionId: 'tx-1',
      dismissToast: mockDismissToast,
    });

    render(<MusdConversionToast />);

    expect(screen.getByTestId('musd-conversion-toast')).toHaveTextContent(
      'Converting USDC...',
    );
    expect(capturedToastProps).not.toHaveProperty('autoHideTime');
    expect(capturedToastProps).not.toHaveProperty('onAutoHideToast');
  });

  it('renders in-progress toast with fallback symbol when sourceTokenSymbol is null', () => {
    mockUseMusdConversionToastStatus.mockReturnValue({
      toastState: 'in-progress',
      sourceTokenSymbol: null,
      activeTransactionId: 'tx-1',
      dismissToast: mockDismissToast,
    });

    render(<MusdConversionToast />);

    expect(screen.getByTestId('musd-conversion-toast')).toHaveTextContent(
      'Converting Token...',
    );
  });

  it('renders success toast with autoHide', () => {
    mockUseMusdConversionToastStatus.mockReturnValue({
      toastState: 'success',
      sourceTokenSymbol: 'USDC',
      activeTransactionId: undefined,
      dismissToast: mockDismissToast,
    });

    render(<MusdConversionToast />);

    expect(screen.getByTestId('musd-conversion-toast')).toHaveTextContent(
      'mUSD conversion successful',
    );
    expect(capturedToastProps).toHaveProperty(
      'description',
      'Bonus will be claimable within a day.',
    );
    expect(capturedToastProps).toHaveProperty('autoHideTime', 5000);
    expect(capturedToastProps).toHaveProperty(
      'onAutoHideToast',
      mockDismissToast,
    );
  });

  it('renders failed toast with autoHide', () => {
    mockUseMusdConversionToastStatus.mockReturnValue({
      toastState: 'failed',
      sourceTokenSymbol: 'USDC',
      activeTransactionId: undefined,
      dismissToast: mockDismissToast,
    });

    render(<MusdConversionToast />);

    expect(screen.getByTestId('musd-conversion-toast')).toHaveTextContent(
      'Conversion failed.',
    );
    expect(capturedToastProps).toHaveProperty('autoHideTime', 5000);
    expect(capturedToastProps).toHaveProperty(
      'onAutoHideToast',
      mockDismissToast,
    );
  });

  it('passes dismissToast as onClose', () => {
    mockUseMusdConversionToastStatus.mockReturnValue({
      toastState: 'success',
      sourceTokenSymbol: 'USDC',
      activeTransactionId: undefined,
      dismissToast: mockDismissToast,
    });

    render(<MusdConversionToast />);

    expect(capturedToastProps).toHaveProperty('onClose', mockDismissToast);
  });
});
