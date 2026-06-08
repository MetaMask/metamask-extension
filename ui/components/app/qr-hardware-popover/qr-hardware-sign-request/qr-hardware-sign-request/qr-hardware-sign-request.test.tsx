import React from 'react';
import { screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import type { QrSignatureRequest } from '@metamask/eth-qr-keyring';
import configureStore from '../../../../../store/store';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../../../test/data/mock-state.json';
import * as Actions from '../../../../../store/actions';
import type { QrPlayerProps } from '../qr-player';
import type { QrReaderProps } from '../qr-reader';
import { UrType } from '../../base-qr-reader';
import type { QRHardwareSignRequestProps } from './qr-hardware-sign-request.types';
import QRHardwareSignRequest from './qr-hardware-sign-request';

jest.mock('../../../../../store/actions', () => ({
  ...jest.requireActual('../../../../../store/actions'),
  completeQrCodeScan: jest.fn(() => () => Promise.resolve()),
}));

jest.mock('../qr-reader', () => {
  const { UrType: MockUrType } = jest.requireActual('../../base-qr-reader');
  const MockQrReader = (props: QrReaderProps) => (
    <div data-testid="mock-qr-reader">
      <span data-testid="qr-reader-request-id">{props.requestId}</span>
      <button
        data-testid="qr-reader-cancel"
        onClick={props.cancelQRHardwareSignRequest}
      />
      <button
        data-testid="qr-reader-submit"
        onClick={() =>
          props.submitQRHardwareSignature({
            type: MockUrType.EthSignature,
            cbor: 'aa',
          })
        }
      />
      <button
        data-testid="qr-reader-set-error"
        onClick={() => props.setErrorTitle('test-error')}
      />
      <button
        data-testid="qr-reader-set-error-active"
        onClick={() => props.setErrorActive(true)}
      />
    </div>
  );
  MockQrReader.displayName = 'MockQrReader';
  return MockQrReader;
});

jest.mock('../qr-player', () => {
  const MockQrPlayer = (props: QrPlayerProps) => (
    <div data-testid="mock-qr-player">
      <span data-testid="qr-player-type">{props.type}</span>
      <span data-testid="qr-player-cbor">{props.cbor}</span>
      <button
        data-testid="qr-player-cancel"
        onClick={props.cancelQRHardwareSignRequest}
      />
      <button data-testid="qr-player-to-read" onClick={props.toRead} />
    </div>
  );
  MockQrPlayer.displayName = 'MockQrPlayer';
  return MockQrPlayer;
});

const mockCompleteQrCodeScan = jest.mocked(Actions.completeQrCodeScan);

function buildRequest(
  overrides?: Partial<QrSignatureRequest>,
): QrSignatureRequest {
  return {
    requestId: 'test-request-id-1',
    payload: {
      type: 'eth-sign-request',
      cbor: 'a501d825509b1deb4d3b7d4bad9bdd2b0d7b3dcb68',
    },
    ...overrides,
  };
}

function buildStore() {
  return configureStore(mockState);
}

describe('QRHardwareSignRequest', () => {
  const defaultProps: QRHardwareSignRequestProps = {
    request: buildRequest(),
    handleCancel: jest.fn(),
    setErrorTitle: jest.fn(),
    setErrorActive: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initial rendering', () => {
    it('renders the QrPlayer component in play phase', () => {
      renderWithProvider(
        <QRHardwareSignRequest {...defaultProps} />,
        buildStore(),
      );

      expect(screen.getByTestId('mock-qr-player')).toBeInTheDocument();
      expect(screen.queryByTestId('mock-qr-reader')).not.toBeInTheDocument();
    });

    it('passes payload type and cbor to QrPlayer', () => {
      renderWithProvider(
        <QRHardwareSignRequest {...defaultProps} />,
        buildStore(),
      );

      expect(screen.getByTestId('qr-player-type')).toHaveTextContent(
        'eth-sign-request',
      );
      expect(screen.getByTestId('qr-player-cbor')).toHaveTextContent(
        'a501d825509b1deb4d3b7d4bad9bdd2b0d7b3dcb68',
      );
    });
  });

  describe('play to read transition', () => {
    it('switches to QrReader when toRead is invoked', async () => {
      renderWithProvider(
        <QRHardwareSignRequest {...defaultProps} />,
        buildStore(),
      );

      await userEvent.click(screen.getByTestId('qr-player-to-read'));

      expect(screen.getByTestId('mock-qr-reader')).toBeInTheDocument();
      expect(screen.queryByTestId('mock-qr-player')).not.toBeInTheDocument();
    });

    it('passes the correct requestId to QrReader', async () => {
      renderWithProvider(
        <QRHardwareSignRequest {...defaultProps} />,
        buildStore(),
      );

      await userEvent.click(screen.getByTestId('qr-player-to-read'));

      expect(screen.getByTestId('qr-reader-request-id')).toHaveTextContent(
        'test-request-id-1',
      );
    });
  });

  describe('request ID change resets to play phase', () => {
    it('resets to QrPlayer when request.requestId changes', async () => {
      const { rerender } = renderWithProvider(
        <QRHardwareSignRequest {...defaultProps} />,
        buildStore(),
      );

      await userEvent.click(screen.getByTestId('qr-player-to-read'));
      expect(screen.getByTestId('mock-qr-reader')).toBeInTheDocument();

      rerender(
        <QRHardwareSignRequest
          {...defaultProps}
          request={buildRequest({ requestId: 'new-request-id-2' })}
        />,
      );

      expect(screen.getByTestId('mock-qr-player')).toBeInTheDocument();
      expect(screen.queryByTestId('mock-qr-reader')).not.toBeInTheDocument();
    });

    it('does not reset when the same requestId is provided', async () => {
      const { rerender } = renderWithProvider(
        <QRHardwareSignRequest {...defaultProps} />,
        buildStore(),
      );

      await userEvent.click(screen.getByTestId('qr-player-to-read'));
      expect(screen.getByTestId('mock-qr-reader')).toBeInTheDocument();

      rerender(<QRHardwareSignRequest {...defaultProps} />);

      expect(screen.getByTestId('mock-qr-reader')).toBeInTheDocument();
    });
  });

  describe('cancel flow', () => {
    it('invokes handleCancel when cancel is clicked in QrPlayer', async () => {
      renderWithProvider(
        <QRHardwareSignRequest {...defaultProps} />,
        buildStore(),
      );

      await userEvent.click(screen.getByTestId('qr-player-cancel'));

      expect(defaultProps.handleCancel).toHaveBeenCalledTimes(1);
    });

    it('invokes handleCancel when cancel is clicked in QrReader', async () => {
      renderWithProvider(
        <QRHardwareSignRequest {...defaultProps} />,
        buildStore(),
      );

      await userEvent.click(screen.getByTestId('qr-player-to-read'));
      await userEvent.click(screen.getByTestId('qr-reader-cancel'));

      expect(defaultProps.handleCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('signature submission', () => {
    it('dispatches completeQrCodeScan when QrReader submits', async () => {
      renderWithProvider(
        <QRHardwareSignRequest {...defaultProps} />,
        buildStore(),
      );

      await userEvent.click(screen.getByTestId('qr-player-to-read'));
      await userEvent.click(screen.getByTestId('qr-reader-submit'));

      expect(mockCompleteQrCodeScan).toHaveBeenCalledWith({
        type: UrType.EthSignature,
        cbor: 'aa',
      });
    });
  });

  describe('setErrorTitle propagation', () => {
    it('passes setErrorTitle through to QrReader', async () => {
      renderWithProvider(
        <QRHardwareSignRequest {...defaultProps} />,
        buildStore(),
      );

      await userEvent.click(screen.getByTestId('qr-player-to-read'));
      await userEvent.click(screen.getByTestId('qr-reader-set-error'));

      expect(defaultProps.setErrorTitle).toHaveBeenCalledWith('test-error');
    });
  });

  describe('setErrorActive propagation', () => {
    it('passes setErrorActive through to QrReader', async () => {
      renderWithProvider(
        <QRHardwareSignRequest {...defaultProps} />,
        buildStore(),
      );

      await userEvent.click(screen.getByTestId('qr-player-to-read'));
      await userEvent.click(screen.getByTestId('qr-reader-set-error-active'));

      expect(defaultProps.setErrorActive).toHaveBeenCalledWith(true);
    });
  });
});
