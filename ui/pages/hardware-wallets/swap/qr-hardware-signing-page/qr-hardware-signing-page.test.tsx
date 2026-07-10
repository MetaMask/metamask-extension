import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import type { UR } from '@ngraveio/bc-ur';
import { ETHSignature } from '@keystonehq/bc-ur-registry-eth';
import * as uuid from 'uuid';
import { QrHardwareSigningPhase } from './qr-hardware-signing-page.types';
import { QrHardwareSigningPage } from './qr-hardware-signing-page';

// Render the real QrReader component but replace the camera-dependent
// BaseQrReader with clickable test buttons that drive its callback props.
// The named exports (CBOR_ENCODING, SIGNING_EXPECTED_UR_TYPES, etc.) are
// provided directly to avoid loading the real module's deep import chain.
let mockUr: UR | undefined;

jest.mock(
  '../../../../components/app/qr-hardware-popover/base-qr-reader',
  () => {
    const MockBaseQrReader = ({
      handleCancel,
      handleSuccess,
      setErrorTitle,
      setErrorActive,
    }: {
      handleCancel: () => void;
      handleSuccess: (ur: UR) => Promise<void>;
      setErrorTitle: (title: string) => void;
      setErrorActive: (active: boolean) => void;
    }) => (
      <div data-testid="mock-base-qr-reader">
        <button
          data-testid="base-qr-reader__success"
          onClick={() => {
            if (mockUr) {
              handleSuccess(mockUr);
            }
          }}
        />
        <button data-testid="base-qr-reader__cancel" onClick={handleCancel} />
        <button
          data-testid="base-qr-reader__set-error-title"
          onClick={() => setErrorTitle('error')}
        />
        <button
          data-testid="base-qr-reader__set-error-active"
          onClick={() => setErrorActive(true)}
        />
      </div>
    );
    MockBaseQrReader.displayName = 'MockBaseQrReader';
    return {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      __esModule: true,
      default: MockBaseQrReader,
      UrType: {
        CryptoHdkey: 'crypto-hdkey',
        CryptoAccount: 'crypto-account',
        EthSignature: 'eth-signature',
      },
      PAIRING_EXPECTED_UR_TYPES: ['crypto-hdkey', 'crypto-account'],
      SIGNING_EXPECTED_UR_TYPES: ['eth-signature'],
      CBOR_ENCODING: 'hex',
    };
  },
);

jest.mock('@keystonehq/bc-ur-registry-eth', () => ({
  ETHSignature: {
    fromCBOR: jest.fn(),
  },
}));

jest.mock('uuid', () => ({
  ...jest.requireActual('uuid'),
  stringify: jest.fn(),
}));

// Prevent the deep import chain (qr-utils → hardware-wallets context →
// store/actions → selectors → @metamask/eth-qr-keyring → bc-ur-registry)
// from loading @keystonehq/bc-ur-registry, which fails in jsdom.
jest.mock('@metamask/eth-qr-keyring', () => ({
  QrScanRequestType: {
    PAIR: 'pair',
    SIGN: 'sign',
  },
}));

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

const mockFromCBOR = jest.mocked(ETHSignature.fromCBOR);
const mockStringify = jest.mocked(uuid.stringify);

const PAYLOAD = {
  type: 'eth-sign-request',
  cbor: 'a201d825501f00a1b4c7e9a3f5d2e8b6a0c3d9f1e2a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f',
};

const BASE_PROPS = {
  title: 'Step 1 of 2: Scan this QR code with your wallet',
  phase: QrHardwareSigningPhase.DisplayQrCode,
  isFinalSignature: false,
  payload: PAYLOAD,
  requestId: 'test-request-id',
  onBack: jest.fn(),
  onCancel: jest.fn(),
  onContinueToScan: jest.fn(),
  onScanSuccess: jest.fn(() => Promise.resolve()),
};

describe('QrHardwareSigningPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUr = undefined;
  });

  it('renders title from props', () => {
    const { getByTestId } = render(
      <QrHardwareSigningPage {...BASE_PROPS} title="Custom Title" />,
    );

    expect(getByTestId('qr-hardware-signing-page__title').textContent).toBe(
      'Custom Title',
    );
  });

  it('calls onBack when back button is clicked', () => {
    const onBack = jest.fn();
    const { getByTestId } = render(
      <QrHardwareSigningPage {...BASE_PROPS} onBack={onBack} />,
    );

    fireEvent.click(getByTestId('qr-hardware-signing-page__back-button'));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button is clicked', () => {
    const onCancel = jest.fn();
    const { getByTestId } = render(
      <QrHardwareSigningPage {...BASE_PROPS} onCancel={onCancel} />,
    );

    fireEvent.click(getByTestId('qr-hardware-signing-page__cancel-button'));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('renders QrSignatureCode and continue button in DisplayQrCode phase', () => {
    const { getByTestId } = render(
      <QrHardwareSigningPage
        {...BASE_PROPS}
        phase={QrHardwareSigningPhase.DisplayQrCode}
      />,
    );

    expect(getByTestId('qr-code-svg')).toBeDefined();
    expect(
      getByTestId('qr-hardware-signing-page__continue-button'),
    ).toBeDefined();
  });

  it('calls onContinueToScan when continue button is clicked', () => {
    const onContinueToScan = jest.fn();
    const { getByTestId } = render(
      <QrHardwareSigningPage
        {...BASE_PROPS}
        phase={QrHardwareSigningPhase.DisplayQrCode}
        onContinueToScan={onContinueToScan}
      />,
    );

    fireEvent.click(getByTestId('qr-hardware-signing-page__continue-button'));

    expect(onContinueToScan).toHaveBeenCalledTimes(1);
  });

  it('renders Reader and does not render continue button in ScanSignature phase', () => {
    const { getByTestId, queryByTestId } = render(
      <QrHardwareSigningPage
        {...BASE_PROPS}
        phase={QrHardwareSigningPhase.ScanSignature}
      />,
    );

    expect(getByTestId('mock-base-qr-reader')).toBeDefined();
    expect(
      queryByTestId('qr-hardware-signing-page__continue-button'),
    ).toBeNull();
  });

  it('calls onScanSuccess when Reader submits a matching signature', async () => {
    mockUr = {
      type: 'ur:crypto-signature',
      cbor: Buffer.from('aabbccdd', 'hex'),
    } as unknown as UR;

    mockFromCBOR.mockReturnValue({
      getRequestId: () => Buffer.from('test', 'hex'),
    } as unknown as ETHSignature);
    mockStringify.mockReturnValue('test-request-id');

    const onScanSuccess = jest.fn(() => Promise.resolve());
    const { getByTestId } = render(
      <QrHardwareSigningPage
        {...BASE_PROPS}
        phase={QrHardwareSigningPhase.ScanSignature}
        onScanSuccess={onScanSuccess}
      />,
    );

    await act(async () => {
      fireEvent.click(getByTestId('base-qr-reader__success'));
    });

    expect(onScanSuccess).toHaveBeenCalledWith({
      type: 'ur:crypto-signature',
      cbor: 'aabbccdd',
    });
  });

  it('calls onCancel when Reader cancels the scan', () => {
    const onCancel = jest.fn();
    const { getByTestId } = render(
      <QrHardwareSigningPage
        {...BASE_PROPS}
        phase={QrHardwareSigningPhase.ScanSignature}
        onCancel={onCancel}
      />,
    );

    fireEvent.click(getByTestId('base-qr-reader__cancel'));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('accepts Reader error callbacks without throwing', () => {
    const { getByTestId } = render(
      <QrHardwareSigningPage
        {...BASE_PROPS}
        phase={QrHardwareSigningPhase.ScanSignature}
      />,
    );

    expect(() => {
      fireEvent.click(getByTestId('base-qr-reader__set-error-title'));
      fireEvent.click(getByTestId('base-qr-reader__set-error-active'));
    }).not.toThrow();
  });

  it('uses qrHardwareScanSignatureFinal label when isFinalSignature is true', () => {
    const { getByTestId } = render(
      <QrHardwareSigningPage
        {...BASE_PROPS}
        phase={QrHardwareSigningPhase.DisplayQrCode}
        isFinalSignature
      />,
    );

    expect(
      getByTestId('qr-hardware-signing-page__continue-button').textContent,
    ).toBe('[qrHardwareScanSignatureFinal]');
  });

  it('uses qrHardwareScanSignatureNext label when isFinalSignature is false', () => {
    const { getByTestId } = render(
      <QrHardwareSigningPage
        {...BASE_PROPS}
        phase={QrHardwareSigningPhase.DisplayQrCode}
        isFinalSignature={false}
      />,
    );

    expect(
      getByTestId('qr-hardware-signing-page__continue-button').textContent,
    ).toBe('[qrHardwareScanSignatureNext]');
  });

  it('defaults to next-scan label when isFinalSignature is omitted', () => {
    const { getByTestId } = render(
      <QrHardwareSigningPage
        title="Scan"
        phase={QrHardwareSigningPhase.DisplayQrCode}
        payload={PAYLOAD}
        requestId="test-request-id"
        onBack={jest.fn()}
        onCancel={jest.fn()}
        onContinueToScan={jest.fn()}
        onScanSuccess={jest.fn(() => Promise.resolve())}
      />,
    );

    expect(
      getByTestId('qr-hardware-signing-page__continue-button').textContent,
    ).toBe('[qrHardwareScanSignatureNext]');
  });
});
