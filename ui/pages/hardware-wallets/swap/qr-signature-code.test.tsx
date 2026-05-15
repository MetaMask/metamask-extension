import React from 'react';
import { render } from '@testing-library/react';
import QrSignatureCode from './qr-signature-code';

jest.mock('qrcode.react', () => ({
  QRCodeSVG: ({ value }: { value: string }) => (
    <svg data-testid="qr-code-svg" data-value={value} />
  ),
}));

jest.mock('@ngraveio/bc-ur', () => ({
  UR: class MockUR {
    mockBuf: Buffer;
    mockStr: string;
    constructor(mockBuffer: Buffer, mockString: string) {
      this.mockBuf = mockBuffer;
      this.mockStr = mockString;
    }
  },
  UREncoder: class MockUREncoder {
    private mockCount = 0;
    constructor() {}
    nextPart() {
      this.mockCount += 1;
      return `qr-part-${this.mockCount}`;
    }
  },
}));

describe('QrSignatureCode', () => {
  it('renders a QR code SVG', () => {
    const payload = {
      type: 'eth-sign-request',
      cbor: 'a201010203',
    };

    const { getByTestId } = render(<QrSignatureCode payload={payload} />);

    expect(getByTestId('qr-code-svg')).toBeDefined();
  });

  it('renders with the correct QR code container class', () => {
    const payload = {
      type: 'eth-sign-request',
      cbor: 'a201010203',
    };

    const { container } = render(<QrSignatureCode payload={payload} />);

    expect(
      container.querySelector('.hardware-wallet-signatures__qr-code'),
    ).not.toBeNull();
  });

  it('renders the QR code value uppercase', () => {
    const payload = {
      type: 'eth-sign-request',
      cbor: 'a201010203',
    };

    const { getByTestId } = render(<QrSignatureCode payload={payload} />);

    expect(getByTestId('qr-code-svg').dataset.value).toBe('QR-PART-2');
  });
});
