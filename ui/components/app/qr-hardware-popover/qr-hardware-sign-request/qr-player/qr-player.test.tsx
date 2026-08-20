import React from 'react';
import { act, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { tEn } from '../../../../../../test/lib/i18n-helpers';
import type { QrPlayerProps } from './qr-player.types';
import { QR_PLAYER_CONFIG } from './qr-player.types';
import QrPlayer from './qr-player';

jest.mock('qrcode.react', () => ({
  QRCodeSVG: ({ value, size }: { value: string; size: number }) => (
    <div data-testid="qr-code-svg" data-value={value} data-size={size} />
  ),
}));

describe('QrPlayer', () => {
  const defaultProps: QrPlayerProps = {
    type: 'eth-sign-request',
    cbor: 'a501d825509b1deb4d3b7d4bad9bdd2b0d7b3dcb68',
    cancelQRHardwareSignRequest: jest.fn(),
    toRead: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the initial QR code', () => {
    renderWithProvider(<QrPlayer {...defaultProps} />);

    const qrCode = screen.getByTestId('qr-code-svg');
    expect(qrCode).toBeInTheDocument();
    expect(qrCode.dataset.value).toBeTruthy();
    expect(qrCode.dataset.size).toBe(String(QR_PLAYER_CONFIG.CODE_SIZE));
  });

  it('renders the QR code value in uppercase', () => {
    renderWithProvider(<QrPlayer {...defaultProps} />);

    const qrCode = screen.getByTestId('qr-code-svg');
    const value = qrCode.dataset.value ?? '';
    expect(value).toBe(value.toUpperCase());
  });

  it('renders instruction and description text', () => {
    renderWithProvider(<QrPlayer {...defaultProps} />);

    expect(
      screen.getByText(tEn('QRHardwareSignRequestSubtitle')),
    ).toBeInTheDocument();
    expect(
      screen.getByText(tEn('QRHardwareSignRequestDescription')),
    ).toBeInTheDocument();
  });

  it('renders cancel and submit buttons with correct labels', () => {
    renderWithProvider(<QrPlayer {...defaultProps} />);

    expect(
      screen.getByText(tEn('QRHardwareSignRequestCancel')),
    ).toBeInTheDocument();
    expect(
      screen.getByText(tEn('QRHardwareSignRequestGetSignature')),
    ).toBeInTheDocument();
  });

  it('invokes cancelQRHardwareSignRequest when cancel is clicked', async () => {
    jest.useRealTimers();
    renderWithProvider(<QrPlayer {...defaultProps} />);

    await userEvent.click(screen.getByText(tEn('QRHardwareSignRequestCancel')));

    expect(defaultProps.cancelQRHardwareSignRequest).toHaveBeenCalledTimes(1);
  });

  it('invokes toRead when Get Signature is clicked', async () => {
    jest.useRealTimers();
    renderWithProvider(<QrPlayer {...defaultProps} />);

    await userEvent.click(
      screen.getByText(tEn('QRHardwareSignRequestGetSignature')),
    );

    expect(defaultProps.toRead).toHaveBeenCalledTimes(1);
  });

  it('cycles the QR code at the configured refresh rate', () => {
    const largeCbor = 'aa'.repeat(250);
    renderWithProvider(<QrPlayer {...defaultProps} cbor={largeCbor} />);

    const initialValue = screen.getByTestId('qr-code-svg').dataset.value;

    act(() => {
      jest.advanceTimersByTime(QR_PLAYER_CONFIG.REFRESH_RATE);
    });

    const updatedValue = screen.getByTestId('qr-code-svg').dataset.value;
    expect(updatedValue).not.toBe(initialValue);
  });

  it('cleans up the interval on unmount to prevent memory leaks', () => {
    const clearIntervalSpy = jest.spyOn(globalThis, 'clearInterval');
    const { unmount } = renderWithProvider(<QrPlayer {...defaultProps} />);

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });

  it('produces new QR output when cbor changes', () => {
    const { rerender } = renderWithProvider(<QrPlayer {...defaultProps} />);

    const firstValue = screen.getByTestId('qr-code-svg').dataset.value;

    rerender(
      <QrPlayer
        {...defaultProps}
        cbor="bb01d825509b1deb4d3b7d4bad9bdd2b0d7b3dcb68"
      />,
    );

    act(() => {
      jest.advanceTimersByTime(QR_PLAYER_CONFIG.REFRESH_RATE);
    });

    const secondValue = screen.getByTestId('qr-code-svg').dataset.value;
    expect(secondValue).not.toBe(firstValue);
  });
});
