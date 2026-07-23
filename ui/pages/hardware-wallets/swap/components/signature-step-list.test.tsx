import React from 'react';
import { render } from '@testing-library/react';
import { QrScanRequestType } from '@metamask/eth-qr-keyring';
import { HardwareWalletSignatureStatus } from '../hardware-wallet-signatures-state-machine';
import { SignatureStepStatus } from '../types';
import SignatureStepList from './signature-step-list';

// The test only needs the QrScanRequestType enum from this package; mocking
// it avoids loading its deep transitive dependency chain (@keystonehq/bc-ur-registry
// → @ngraveio/bc-ur → URDecoder) which fails under jsdom.
jest.mock('@metamask/eth-qr-keyring', () => ({
  QrScanRequestType: {
    PAIR: 'pair',
    SIGN: 'sign',
  },
}));

// External dependencies of the real QrSignatureCode component — these
// libraries require browser/canvas APIs not available in jsdom.
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

    constructor(ur: { mockBuffer: Buffer; mockType: string }) {
      this.mockPayloadId = `${ur.mockType}-${ur.mockBuffer.toString('hex')}`;
    }

    nextPart() {
      this.mockCount += 1;
      return `${this.mockPayloadId}-qr-part-${this.mockCount}`;
    }
  },
}));

const TEST_QR_SIGN_REQUEST = {
  type: QrScanRequestType.SIGN,
  request: {
    requestId: 'test-request-id',
    payload: {
      type: 'eth-sign-request',
      cbor: 'a201d825501f00a1b4c7e9a3f5d2e8b6a0c3d9f1e2a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f',
    },
  },
} as const;

const BASE_PROPS = {
  hasSigningRequest: true,
  needsTwoConfirmations: false,
  firstStepStatus: SignatureStepStatus.Pending,
  firstStepLabel: 'Approve 1.5 USDC',
  finalStepStatus: SignatureStepStatus.Active,
  finalStepLabel: 'Send 1.5 USDC',
  showInlineQrCode: false,
  activeQrStep: null,
  qrSignRequest: null,
};

describe('SignatureStepList', () => {
  it('returns null when hasSigningRequest is false', () => {
    const { container } = render(
      <SignatureStepList {...BASE_PROPS} hasSigningRequest={false} />,
    );

    expect(container.firstElementChild).toBeNull();
  });

  it('renders one list item when needsTwoConfirmations is false', () => {
    const { container } = render(
      <SignatureStepList {...BASE_PROPS} needsTwoConfirmations={false} />,
    );

    expect(container.querySelectorAll('li')).toHaveLength(1);
  });

  it('renders two list items when needsTwoConfirmations is true', () => {
    const { container } = render(
      <SignatureStepList {...BASE_PROPS} needsTwoConfirmations />,
    );

    expect(container.querySelectorAll('li')).toHaveLength(2);
  });

  it('renders inline QR code on first step when showInlineQrCode is true and activeQrStep is AwaitingFirstSignature', () => {
    const { getByTestId } = render(
      <SignatureStepList
        {...BASE_PROPS}
        needsTwoConfirmations
        showInlineQrCode
        activeQrStep={HardwareWalletSignatureStatus.AwaitingFirstSignature}
        qrSignRequest={TEST_QR_SIGN_REQUEST}
      />,
    );

    expect(getByTestId('qr-code-svg')).toBeDefined();
  });

  it('renders inline QR code on final step when showInlineQrCode is true and activeQrStep is AwaitingFinalSignature', () => {
    const { getByTestId } = render(
      <SignatureStepList
        {...BASE_PROPS}
        needsTwoConfirmations
        showInlineQrCode
        activeQrStep={HardwareWalletSignatureStatus.AwaitingFinalSignature}
        qrSignRequest={TEST_QR_SIGN_REQUEST}
      />,
    );

    expect(getByTestId('qr-code-svg')).toBeDefined();
  });

  it('does not render QR code when showInlineQrCode is false', () => {
    const { queryByTestId } = render(
      <SignatureStepList
        {...BASE_PROPS}
        needsTwoConfirmations
        showInlineQrCode={false}
        activeQrStep={HardwareWalletSignatureStatus.AwaitingFirstSignature}
        qrSignRequest={TEST_QR_SIGN_REQUEST}
      />,
    );

    expect(queryByTestId('qr-code-svg')).toBeNull();
  });

  it('renders firstStepDescription when provided', () => {
    const { getByText } = render(
      <SignatureStepList
        {...BASE_PROPS}
        needsTwoConfirmations
        firstStepDescription="Spender: 0xabcde...12345"
      />,
    );

    expect(getByText('Spender: 0xabcde...12345')).toBeDefined();
  });

  it('renders finalStepDescription when provided', () => {
    const { getByText } = render(
      <SignatureStepList
        {...BASE_PROPS}
        finalStepDescription="To: 0xfedcb...98765"
      />,
    );

    expect(getByText('To: 0xfedcb...98765')).toBeDefined();
  });
});
