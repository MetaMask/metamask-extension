import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import type { UR } from '@ngraveio/bc-ur';
import { ETHSignature } from '@keystonehq/bc-ur-registry-eth';
import * as uuid from 'uuid';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import {
  UrType,
  SIGNING_EXPECTED_UR_TYPES,
  type BaseQrReaderProps,
} from '../../base-qr-reader';
import { QrMismatchedTransactionError } from '../../qr-utils/qr-utils';
import type { QrReaderProps } from './qr-reader.types';
import QrReader from './qr-reader';

let mockUr: UR | undefined;
let mockLastReaderError: Error | undefined;

jest.mock('../../base-qr-reader', () => {
  const MockBaseQrReader = (mockProps: BaseQrReaderProps) => (
    <div data-testid="mock-base-qr-reader">
      <span data-testid="base-qr-reader-is-reading-wallet">
        {String(mockProps.isReadingWallet)}
      </span>
      <span data-testid="base-qr-reader-expected-ur-types">
        {JSON.stringify(mockProps.expectedUrTypes)}
      </span>
      <button
        data-testid="base-qr-reader-cancel"
        onClick={mockProps.handleCancel}
      />
      <button
        data-testid="base-qr-reader-success"
        onClick={async () => {
          if (!mockUr) {
            return;
          }
          try {
            await mockProps.handleSuccess(mockUr);
          } catch (err) {
            mockLastReaderError = err as Error;
          }
        }}
      />
      <button
        data-testid="base-qr-reader-set-error"
        onClick={() => mockProps.setErrorTitle('test-error')}
      />
      <button
        data-testid="base-qr-reader-set-error-active"
        onClick={() => mockProps.setErrorActive(true)}
      />
    </div>
  );
  MockBaseQrReader.displayName = 'MockBaseQrReader';
  return Object.assign(
    MockBaseQrReader,
    jest.requireActual('../../base-qr-reader'),
  );
});

jest.mock('@keystonehq/bc-ur-registry-eth', () => ({
  ETHSignature: {
    fromCBOR: jest.fn(),
  },
}));

jest.mock('uuid', () => ({
  ...jest.requireActual('uuid'),
  stringify: jest.fn(),
}));

const mockFromCBOR = jest.mocked(ETHSignature.fromCBOR);
const mockStringify = jest.mocked(uuid.stringify);

/**
 * Creates a mock UR object matching the shape produced by `URDecoder.resultUR()`.
 * @param type
 * @param cborHex
 */
function buildMockUr(type = UrType.EthSignature, cborHex = 'aabbcc'): UR {
  const cborBuffer = Buffer.from(cborHex, 'hex');
  return { type, cbor: cborBuffer } as unknown as UR;
}

describe('QrReader', () => {
  const defaultProps: QrReaderProps = {
    submitQRHardwareSignature: jest.fn().mockResolvedValue(undefined),
    cancelQRHardwareSignRequest: jest.fn(),
    requestId: 'matching-request-id',
    setErrorTitle: jest.fn(),
    setErrorActive: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUr = undefined;
    mockLastReaderError = undefined;
  });

  it('renders BaseQrReader in signing mode (isReadingWallet=false)', () => {
    renderWithProvider(<QrReader {...defaultProps} />);

    expect(
      screen.getByTestId('base-qr-reader-is-reading-wallet'),
    ).toHaveTextContent('false');
  });

  it('passes signing UR types to BaseQrReader', () => {
    renderWithProvider(<QrReader {...defaultProps} />);

    expect(
      screen.getByTestId('base-qr-reader-expected-ur-types'),
    ).toHaveTextContent(JSON.stringify(SIGNING_EXPECTED_UR_TYPES));
  });

  describe('handleSuccess', () => {
    it('submits the serialized signature when requestId matches', async () => {
      mockUr = buildMockUr(UrType.EthSignature, 'deadbeef');

      const mockRequestIdBuffer = Buffer.from('0123456789abcdef', 'hex');
      mockFromCBOR.mockReturnValue({
        getRequestId: () => mockRequestIdBuffer,
      } as unknown as ETHSignature);
      mockStringify.mockReturnValue('matching-request-id');

      renderWithProvider(<QrReader {...defaultProps} />);

      await screen.getByTestId('base-qr-reader-success').click();

      await waitFor(() => {
        expect(mockFromCBOR).toHaveBeenCalledWith(mockUr?.cbor);
        expect(mockStringify).toHaveBeenCalledWith(mockRequestIdBuffer);
        expect(defaultProps.submitQRHardwareSignature).toHaveBeenCalledWith({
          type: UrType.EthSignature,
          cbor: 'deadbeef',
        });
      });
    });

    it('throws QrMismatchedTransactionError when requestId does not match', async () => {
      mockUr = buildMockUr();

      mockFromCBOR.mockReturnValue({
        getRequestId: () => Buffer.from('wrong', 'hex'),
      } as unknown as ETHSignature);
      mockStringify.mockReturnValue('non-matching-request-id');

      renderWithProvider(<QrReader {...defaultProps} />);

      await screen.getByTestId('base-qr-reader-success').click();

      await waitFor(() => {
        expect(defaultProps.setErrorTitle).not.toHaveBeenCalled();
        expect(defaultProps.submitQRHardwareSignature).not.toHaveBeenCalled();
      });

      expect(mockLastReaderError).toBeInstanceOf(QrMismatchedTransactionError);
    });
  });

  describe('cancel flow', () => {
    it('invokes cancelQRHardwareSignRequest when cancel is clicked', async () => {
      renderWithProvider(<QrReader {...defaultProps} />);

      await screen.getByTestId('base-qr-reader-cancel').click();

      expect(defaultProps.cancelQRHardwareSignRequest).toHaveBeenCalledTimes(1);
    });
  });

  describe('setErrorTitle propagation', () => {
    it('passes setErrorTitle through to BaseQrReader', async () => {
      renderWithProvider(<QrReader {...defaultProps} />);

      await screen.getByTestId('base-qr-reader-set-error').click();

      expect(defaultProps.setErrorTitle).toHaveBeenCalledWith('test-error');
    });
  });

  describe('setErrorActive propagation', () => {
    it('passes setErrorActive through to BaseQrReader', async () => {
      renderWithProvider(<QrReader {...defaultProps} />);

      await screen.getByTestId('base-qr-reader-set-error-active').click();

      expect(defaultProps.setErrorActive).toHaveBeenCalledWith(true);
    });
  });
});
