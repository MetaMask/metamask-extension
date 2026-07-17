import React from 'react';
import { act, render } from '@testing-library/react';
import QrSignatureCode from '.';

const QR_REFRESH_RATE = 200;

jest.mock('qrcode.react', () => ({
  QRCodeSVG: jest.fn(({ value }: { value: string }) => (
    <svg data-testid="qr-code-svg" data-value={value} />
  )),
}));

jest.mock('@ngraveio/bc-ur', () => ({
  UR: class MockUR {
    mockBuffer: Buffer;

    mockType: string;

    constructor(mockBuffer: Buffer, mockType: string) {
      this.mockBuffer = mockBuffer;
      this.mockType = mockType;
    }
  },
  UREncoder: class MockUREncoder {
    private mockCount = 0;

    private readonly mockPayloadId: string;

    constructor(mockUr: { mockBuffer: Buffer; mockType: string }) {
      this.mockPayloadId = `${mockUr.mockType}-${mockUr.mockBuffer.toString(
        'hex',
      )}`;
    }

    nextPart() {
      this.mockCount += 1;
      return `${this.mockPayloadId}-qr-part-${this.mockCount}`;
    }
  },
}));

const mockQRCodeSVG = jest.requireMock('qrcode.react').QRCodeSVG as jest.Mock;

describe('QrSignatureCode', () => {
  afterEach(() => {
    mockQRCodeSVG.mockClear();
    jest.useRealTimers();
  });

  it('renders a QR code SVG', () => {
    const payload = {
      type: 'eth-sign-request',
      cbor: 'a201010203',
    };

    const { getByTestId } = render(<QrSignatureCode payload={payload} />);

    expect(getByTestId('qr-code-svg')).toBeDefined();
  });

  it('renders the QR code with a padded white background for scanning', () => {
    const payload = {
      type: 'eth-sign-request',
      cbor: 'a201010203',
    };

    const { container } = render(<QrSignatureCode payload={payload} />);

    expect(container.firstElementChild).toHaveStyle({
      width: '280px',
      height: '280px',
      padding: '20px',
      boxSizing: 'border-box',
      backgroundColor: 'var(--qr-code-white-background)',
    });
  });

  it('renders the QR code value uppercase', () => {
    const payload = {
      type: 'eth-sign-request',
      cbor: 'a201010203',
    };

    const { getByTestId } = render(<QrSignatureCode payload={payload} />);

    expect(getByTestId('qr-code-svg').dataset.value).toBe(
      'ETH-SIGN-REQUEST-A201010203-QR-PART-1',
    );
  });

  it('rotates to the next QR fragment after the refresh delay', () => {
    jest.useFakeTimers();
    const payload = {
      type: 'eth-sign-request',
      cbor: 'a201010203',
    };

    const { getByTestId, unmount } = render(
      <QrSignatureCode payload={payload} />,
    );

    expect(getByTestId('qr-code-svg').dataset.value).toBe(
      'ETH-SIGN-REQUEST-A201010203-QR-PART-1',
    );

    act(() => {
      jest.advanceTimersByTime(QR_REFRESH_RATE);
    });

    expect(getByTestId('qr-code-svg').dataset.value).toBe(
      'ETH-SIGN-REQUEST-A201010203-QR-PART-2',
    );

    unmount();
  });

  it('does not pass a stale QR code to the QR renderer when the payload changes', () => {
    const firstPayload = {
      type: 'eth-sign-request',
      cbor: 'a201010203',
    };
    const secondPayload = {
      type: 'eth-sign-request',
      cbor: 'b401010203',
    };

    const { getByTestId, rerender } = render(
      <QrSignatureCode payload={firstPayload} />,
    );
    mockQRCodeSVG.mockClear();

    rerender(<QrSignatureCode payload={secondPayload} />);

    expect(getByTestId('qr-code-svg').dataset.value).toBe(
      'ETH-SIGN-REQUEST-B401010203-QR-PART-1',
    );
    expect(mockQRCodeSVG).not.toHaveBeenCalledWith(
      expect.objectContaining({
        value: 'ETH-SIGN-REQUEST-A201010203-QR-PART-1',
      }),
      undefined,
    );
  });
});
