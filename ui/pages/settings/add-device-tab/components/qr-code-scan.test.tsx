import React from 'react';
import { act, fireEvent, screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
// eslint-disable-next-line import-x/no-restricted-paths
import messages from '../../../../../app/_locales/en/messages.json';
import {
  MWP_SESSION_REQUEST_EXPIRY_SECONDS,
  QrSyncErrorCodes,
} from '../../../../../shared/constants/qr-sync';
import { submitRequestToBackground } from '../../../../store/background-connection';
import QrCodeScan from './qr-code-scan';

jest.mock(
  '../../../../components/app/deeplink-qr-code/deeplink-qr-code',
  () => ({
    QRCodeImage: () => <div data-testid="qr-code-image" />,
  }),
);

jest.mock('../../../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn().mockResolvedValue(undefined),
}));

const mockSubmitRequestToBackground = jest.mocked(submitRequestToBackground);

const createMockStore = (metamaskOverrides = {}) =>
  configureMockStore([thunk])({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      qrSyncQrPayload: 'metamask://connect/mwp?p=test',
      qrSyncError: null,
      ...metamaskOverrides,
    },
  });

describe('QrCodeScan', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the heading, description and QR code image', () => {
    const mockStore = createMockStore();
    renderWithProvider(<QrCodeScan />, mockStore);

    expect(screen.getByText(messages.scanQrCode.message)).toBeInTheDocument();
    expect(
      screen.getByText(messages.scan_qr_code_desc.message),
    ).toBeInTheDocument();
    expect(screen.getByTestId('qr-code-image')).toBeInTheDocument();
  });

  it('shows the countdown while the QR code is valid', () => {
    const mockStore = createMockStore();
    renderWithProvider(<QrCodeScan />, mockStore);

    expect(
      screen.getByText(`Expires in ${MWP_SESSION_REQUEST_EXPIRY_SECONDS}s`),
    ).toBeInTheDocument();
  });

  it('shows the expired message and reset button after the timer runs out', () => {
    jest.useFakeTimers();
    const mockStore = createMockStore();
    renderWithProvider(<QrCodeScan />, mockStore);

    act(() => {
      jest.advanceTimersByTime(MWP_SESSION_REQUEST_EXPIRY_SECONDS * 1000);
    });

    expect(
      screen.getByText(messages.qrCodeExpired.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.generateNewQrCode.message),
    ).toBeInTheDocument();
  });

  it('shows the scan error message when the controller reports an error', () => {
    const mockStore = createMockStore({
      qrSyncError: {
        code: QrSyncErrorCodes.CHANNEL_DISCONNECTED,
        message: 'The sync channel disconnected.',
      },
    });
    renderWithProvider(<QrCodeScan />, mockStore);

    expect(
      screen.getByText(messages.qrCodeScanError.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.generateNewQrCode.message),
    ).toBeInTheDocument();
  });

  it('requests a new session when the reset button is clicked', async () => {
    jest.useFakeTimers();
    const mockStore = createMockStore();
    renderWithProvider(<QrCodeScan />, mockStore);

    act(() => {
      jest.advanceTimersByTime(MWP_SESSION_REQUEST_EXPIRY_SECONDS * 1000);
    });

    fireEvent.click(screen.getByText(messages.generateNewQrCode.message));

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'messengerCall',
      ['QrSyncController:createSession', []],
    );
  });
});
