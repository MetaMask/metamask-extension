import React from 'react';
import { act, render } from '@testing-library/react';
import ReactDOM from 'react-dom';
import QrSignatureCode from './qr-signature-code';

const QR_REFRESH_RATE = 200;

jest.mock('qrcode.react', () => ({
  QRCodeSVG: ({ value }: { value: string }) => (
    <svg data-testid="qr-code-svg" data-value={value} />
  ),
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

describe('QrSignatureCode', () => {
  afterEach(() => {
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

  it('does not render a stale QR code when the payload changes before effects run', () => {
    const firstPayload = {
      type: 'eth-sign-request',
      cbor: 'a201010203',
    };
    const secondPayload = {
      type: 'eth-sign-request',
      cbor: 'b401010203',
    };
    const container = document.createElement('div');

    ReactDOM.render(<QrSignatureCode payload={firstPayload} />, container);
    ReactDOM.render(<QrSignatureCode payload={secondPayload} />, container);

    expect(
      container
        .querySelector('[data-testid="qr-code-svg"]')
        ?.getAttribute('data-value'),
    ).toBe('ETH-SIGN-REQUEST-B401010203-QR-PART-1');

    ReactDOM.unmountComponentAtNode(container);
  });
});
