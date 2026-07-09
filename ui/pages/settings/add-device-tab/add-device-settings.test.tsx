import React from 'react';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { QR_SYNC_PHASES } from '../../../../shared/constants/qr-sync';
import { submitRequestToBackground } from '../../../store/background-connection';
import AddDeviceSettings from './add-device-settings';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('./components', () => ({
  QrCodeScan: () => <div data-testid="qr-code-scan" />,
  EnterVerificationCode: () => <div data-testid="enter-verification-code" />,
  EnterPassword: ({
    onPasswordChange,
  }: {
    onPasswordChange: (password: string) => void;
  }) => (
    <button
      data-testid="enter-password"
      type="button"
      onClick={() => onPasswordChange('test-password')}
    >
      password
    </button>
  ),
  AddWallets: () => <div data-testid="add-wallets" />,
  LoadingStep: () => <div data-testid="loading-step" />,
  Success: () => <div data-testid="success" />,
}));

const mockSubmitRequestToBackground = jest.mocked(submitRequestToBackground);

const qrSyncState = {
  ...mockState,
  metamask: {
    ...mockState.metamask,
    qrSyncPhase: QR_SYNC_PHASES.IDLE,
    qrSyncQrPayload: 'metamask://connect/mwp?p=test',
    qrSyncError: null,
  },
};

describe('AddDeviceSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSubmitRequestToBackground.mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
  });

  it('renders QrCodeScan when the phase is idle', () => {
    const store = configureMockStore([thunk])(qrSyncState);
    renderWithProvider(<AddDeviceSettings />, store);
    expect(screen.getByTestId('qr-code-scan')).toBeInTheDocument();
  });

  it('renders QrCodeScan when the phase is displaying QR', () => {
    const store = configureMockStore([thunk])({
      ...qrSyncState,
      metamask: {
        ...qrSyncState.metamask,
        qrSyncPhase: QR_SYNC_PHASES.DISPLAYING_QR,
      },
    });
    renderWithProvider(<AddDeviceSettings />, store);
    expect(screen.getByTestId('qr-code-scan')).toBeInTheDocument();
  });

  it('renders EnterVerificationCode when the phase is awaiting OTP input', () => {
    const store = configureMockStore([thunk])({
      ...qrSyncState,
      metamask: {
        ...qrSyncState.metamask,
        qrSyncPhase: QR_SYNC_PHASES.AWAITING_OTP_INPUT,
      },
    });
    renderWithProvider(<AddDeviceSettings />, store);
    expect(screen.getByTestId('enter-verification-code')).toBeInTheDocument();
  });

  it('renders LoadingStep when the phase is awaiting a sync offer', () => {
    const store = configureMockStore([thunk])({
      ...qrSyncState,
      metamask: {
        ...qrSyncState.metamask,
        qrSyncPhase: QR_SYNC_PHASES.AWAITING_SYNC_OFFER,
      },
    });
    renderWithProvider(<AddDeviceSettings />, store);
    expect(screen.getByTestId('loading-step')).toBeInTheDocument();
  });

  it('renders EnterPassword when the phase is reviewing the sync offer', () => {
    const store = configureMockStore([thunk])({
      ...qrSyncState,
      metamask: {
        ...qrSyncState.metamask,
        qrSyncPhase: QR_SYNC_PHASES.REVIEWING_SYNC_OFFER,
      },
    });
    renderWithProvider(<AddDeviceSettings />, store);
    expect(screen.getByTestId('enter-password')).toBeInTheDocument();
  });

  it('renders LoadingStep when the phase is awaiting sync completion', () => {
    const store = configureMockStore([thunk])({
      ...qrSyncState,
      metamask: {
        ...qrSyncState.metamask,
        qrSyncPhase: QR_SYNC_PHASES.AWAITING_SYNC_COMPLETION,
      },
    });
    renderWithProvider(<AddDeviceSettings />, store);
    expect(screen.getByTestId('loading-step')).toBeInTheDocument();
  });

  it('creates a QR sync session when mounted in the idle phase', async () => {
    const store = configureMockStore([thunk])(qrSyncState);
    renderWithProvider(<AddDeviceSettings />, store);

    await waitFor(() => {
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'messengerCall',
        ['QrSyncController:createSession', []],
      );
    });
  });

  it('exits automatically when the flow reaches a terminal phase', async () => {
    const store = configureMockStore([thunk])({
      ...qrSyncState,
      metamask: {
        ...qrSyncState.metamask,
        qrSyncPhase: QR_SYNC_PHASES.CANCELLED,
      },
    });
    renderWithProvider(<AddDeviceSettings />, store);

    await waitFor(() => {
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'messengerCall',
        ['QrSyncController:resetState', []],
      );
      expect(mockNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE);
    });
  });
});
