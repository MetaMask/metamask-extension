import React from 'react';
import { act, screen } from '@testing-library/react';
import { renderWithLocalization } from '../../../../../test/lib/render-helpers-navigate';
// eslint-disable-next-line import-x/no-restricted-paths
import messages from '../../../../../app/_locales/en/messages.json';
import QrCodeScan from './qr-code-scan';

jest.mock(
  '../../../../components/app/deeplink-qr-code/deeplink-qr-code',
  () => ({
    QRCodeImage: () => <div data-testid="qr-code-image" />,
  }),
);

describe('QrCodeScan', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the heading, description and QR code image', () => {
    renderWithLocalization(<QrCodeScan onScanSuccess={jest.fn()} />);

    expect(screen.getByText(messages.scanQrCode.message)).toBeInTheDocument();
    expect(
      screen.getByText(messages.scan_qr_code_desc.message),
    ).toBeInTheDocument();
    expect(screen.getByTestId('qr-code-image')).toBeInTheDocument();
  });

  it('shows the countdown while the QR code is valid', () => {
    renderWithLocalization(<QrCodeScan onScanSuccess={jest.fn()} />);

    expect(screen.getByText('Expires in 15s')).toBeInTheDocument();
  });

  it('shows the expired message and reset button after the timer runs out', () => {
    jest.useFakeTimers();
    renderWithLocalization(<QrCodeScan onScanSuccess={jest.fn()} />);

    act(() => {
      jest.advanceTimersByTime(15000);
    });

    expect(
      screen.getByText(messages.qrCodeExpired.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.generateNewQrCode.message),
    ).toBeInTheDocument();
  });
});
