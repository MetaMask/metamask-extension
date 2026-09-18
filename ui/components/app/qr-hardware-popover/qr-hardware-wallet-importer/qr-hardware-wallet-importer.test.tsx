import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import type { UR } from '@ngraveio/bc-ur';
import configureStore from '../../../../store/store';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { tEn } from '../../../../../test/lib/i18n-helpers';
import mockState from '../../../../../test/data/mock-state.json';
import * as Actions from '../../../../store/actions';
import {
  UrType,
  PAIRING_EXPECTED_UR_TYPES,
  type BaseQrReaderProps,
} from '../base-qr-reader';
import type { QRHardwareWalletImporterProps } from './qr-hardware-wallet-importer.types';
import QRHardwareWalletImporter from './qr-hardware-wallet-importer';

let mockUr: UR | undefined;
let mockLastReaderError: Error | undefined;

jest.mock('../base-qr-reader', () => {
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
    jest.requireActual('../base-qr-reader'),
  );
});

jest.mock('../../../../store/actions', () => ({
  ...jest.requireActual('../../../../store/actions'),
  completeQrCodeScan: jest.fn(() => () => Promise.resolve()),
}));

const mockCompleteQrCodeScan = jest.mocked(Actions.completeQrCodeScan);

function buildMockUr(type = UrType.CryptoHdkey, cborHex = 'aabbcc'): UR {
  const cborBuffer = Buffer.from(cborHex, 'hex');
  return { type, cbor: cborBuffer } as unknown as UR;
}

function buildStore() {
  return configureStore(mockState);
}

describe('QRHardwareWalletImporter', () => {
  const defaultProps: QRHardwareWalletImporterProps = {
    handleCancel: jest.fn(),
    setErrorTitle: jest.fn(),
    setErrorActive: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUr = undefined;
    mockLastReaderError = undefined;
  });

  it('renders BaseQrReader in wallet-reading mode (isReadingWallet=true)', () => {
    renderWithProvider(
      <QRHardwareWalletImporter {...defaultProps} />,
      buildStore(),
    );

    expect(
      screen.getByTestId('base-qr-reader-is-reading-wallet'),
    ).toHaveTextContent('true');
  });

  it('passes pairing UR types to BaseQrReader', () => {
    renderWithProvider(
      <QRHardwareWalletImporter {...defaultProps} />,
      buildStore(),
    );

    expect(
      screen.getByTestId('base-qr-reader-expected-ur-types'),
    ).toHaveTextContent(JSON.stringify(PAIRING_EXPECTED_UR_TYPES));
  });

  describe('handleSuccess', () => {
    it('dispatches completeQrCodeScan with serialized UR data', async () => {
      mockUr = buildMockUr(UrType.CryptoHdkey, 'deadbeef');

      renderWithProvider(
        <QRHardwareWalletImporter {...defaultProps} />,
        buildStore(),
      );

      await screen.getByTestId('base-qr-reader-success').click();

      await waitFor(() => {
        expect(mockCompleteQrCodeScan).toHaveBeenCalledWith({
          type: UrType.CryptoHdkey,
          cbor: 'deadbeef',
        });
      });
    });

    it('sets error title and rethrows when dispatch fails', async () => {
      const dispatchError = new Error('dispatch-failure');
      mockCompleteQrCodeScan.mockImplementation(
        () => () => Promise.reject(dispatchError),
      );
      mockUr = buildMockUr();

      renderWithProvider(
        <QRHardwareWalletImporter {...defaultProps} />,
        buildStore(),
      );

      await screen.getByTestId('base-qr-reader-success').click();

      await waitFor(() => {
        expect(defaultProps.setErrorTitle).toHaveBeenCalledWith(
          tEn('QRHardwareUnknownQRCodeTitle'),
        );
      });

      expect(mockLastReaderError).toBe(dispatchError);
    });
  });

  describe('cancel flow', () => {
    it('invokes handleCancel when cancel is clicked', async () => {
      renderWithProvider(
        <QRHardwareWalletImporter {...defaultProps} />,
        buildStore(),
      );

      await screen.getByTestId('base-qr-reader-cancel').click();

      expect(defaultProps.handleCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('setErrorTitle propagation', () => {
    it('passes setErrorTitle through to BaseQrReader', async () => {
      renderWithProvider(
        <QRHardwareWalletImporter {...defaultProps} />,
        buildStore(),
      );

      await screen.getByTestId('base-qr-reader-set-error').click();

      expect(defaultProps.setErrorTitle).toHaveBeenCalledWith('test-error');
    });
  });

  describe('setErrorActive propagation', () => {
    it('passes setErrorActive through to BaseQrReader', async () => {
      renderWithProvider(
        <QRHardwareWalletImporter {...defaultProps} />,
        buildStore(),
      );

      await screen.getByTestId('base-qr-reader-set-error-active').click();

      expect(defaultProps.setErrorActive).toHaveBeenCalledWith(true);
    });
  });
});
