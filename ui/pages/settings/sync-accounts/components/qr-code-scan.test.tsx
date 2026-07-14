import React from 'react';
import { act, fireEvent, screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
// eslint-disable-next-line import-x/no-restricted-paths
import messages from '../../../../../app/_locales/en/messages.json';
import { QR_SYNC_TIMEOUT_MS } from '../../../../../shared/constants/qr-sync';
import { submitRequestToBackground } from '../../../../store/background-connection';
import { selectQrSyncQrPayload } from '../../../../selectors/qr-sync/qr-sync';
import QrCodeScan from './qr-code-scan';

jest.mock('qrcode-generator', () => () => ({
  addData: jest.fn(),
  make: jest.fn(),
  createDataURL: jest.fn(() => 'data:image/gif;base64,mock-qr'),
}));

jest.mock('../../../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../../../selectors/qr-sync/qr-sync', () => ({
  ...jest.requireActual('../../../../selectors/qr-sync/qr-sync'),
  selectQrSyncQrPayload: jest.fn(),
}));

const mockSubmitRequestToBackground = jest.mocked(submitRequestToBackground);
const mockSelectQrSyncQrPayload = jest.mocked(selectQrSyncQrPayload);

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
    mockSelectQrSyncQrPayload.mockImplementation(
      (state) => state.metamask.qrSyncQrPayload,
    );
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
      screen.getByText(
        `Expires in ${QR_SYNC_TIMEOUT_MS.MWP_SESSION_TIMEOUT / 1000}s`,
      ),
    ).toBeInTheDocument();
  });

  it('shows the expired message and reset button after the timer runs out', () => {
    jest.useFakeTimers();
    const mockStore = createMockStore();
    renderWithProvider(<QrCodeScan />, mockStore);

    act(() => {
      jest.advanceTimersByTime(QR_SYNC_TIMEOUT_MS.MWP_SESSION_TIMEOUT);
    });

    expect(
      screen.getByText(messages.qrCodeExpired.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.generateNewQrCode.message),
    ).toBeInTheDocument();
  });

  it('keeps the previous QR image when the payload becomes null', () => {
    const mockStore = createMockStore();
    const { rerender } = renderWithProvider(<QrCodeScan />, mockStore);

    expect(screen.getByTestId('qr-code-image')).toBeInTheDocument();

    mockSelectQrSyncQrPayload.mockReturnValue(null);
    rerender(<QrCodeScan />);

    expect(screen.getByTestId('qr-code-image')).toBeInTheDocument();
  });

  it('requests a new session when the reset button is clicked', async () => {
    jest.useFakeTimers();
    const mockStore = createMockStore();
    renderWithProvider(<QrCodeScan />, mockStore);

    act(() => {
      jest.advanceTimersByTime(QR_SYNC_TIMEOUT_MS.MWP_SESSION_TIMEOUT);
    });

    fireEvent.click(screen.getByText(messages.generateNewQrCode.message));

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'messengerCall',
      ['QrSyncController:createSession', []],
    );
  });
});
