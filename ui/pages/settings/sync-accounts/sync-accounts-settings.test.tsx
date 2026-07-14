import React from 'react';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
// eslint-disable-next-line import-x/no-restricted-paths
import messages from '../../../../app/_locales/en/messages.json';
import {
  QR_SYNC_PHASES,
  QrSyncErrorCodes,
} from '../../../../shared/constants/qr-sync';
import { submitRequestToBackground } from '../../../store/background-connection';
import SyncAccountsSettings from './sync-accounts-settings';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('./components', () => {
  const actual = jest.requireActual('./components');

  return {
    ...actual,
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
  };
});

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

describe('SyncAccountsSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSubmitRequestToBackground.mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
  });

  it('renders QrCodeScan when the phase is idle', () => {
    const store = configureMockStore([thunk])(qrSyncState);
    renderWithProvider(<SyncAccountsSettings />, store);
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
    renderWithProvider(<SyncAccountsSettings />, store);
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
    renderWithProvider(<SyncAccountsSettings />, store);
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
    renderWithProvider(<SyncAccountsSettings />, store);
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
    renderWithProvider(<SyncAccountsSettings />, store);
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
    renderWithProvider(<SyncAccountsSettings />, store);
    expect(screen.getByTestId('loading-step')).toBeInTheDocument();
  });

  it('creates a QR sync session when mounted in the idle phase', async () => {
    const store = configureMockStore([thunk])(qrSyncState);
    renderWithProvider(<SyncAccountsSettings />, store);

    await waitFor(() => {
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'messengerCall',
        ['QrSyncController:createSession', []],
      );
    });
  });

  it('renders SyncError when the phase is cancelled', () => {
    const store = configureMockStore([thunk])({
      ...qrSyncState,
      metamask: {
        ...qrSyncState.metamask,
        qrSyncPhase: QR_SYNC_PHASES.CANCELLED,
      },
    });
    renderWithProvider(<SyncAccountsSettings />, store);
    expect(screen.getByText(messages.add_device_error_title.message)).toBeInTheDocument();
  });

  it('renders SyncError when the phase is failed', () => {
    const store = configureMockStore([thunk])({
      ...qrSyncState,
      metamask: {
        ...qrSyncState.metamask,
        qrSyncPhase: QR_SYNC_PHASES.FAILED,
      },
    });
    renderWithProvider(<SyncAccountsSettings />, store);
    expect(screen.getByText(messages.add_device_error_title.message)).toBeInTheDocument();
  });

  it('renders QrCodeScan when the phase is failed with a QR_EXPIRED error', () => {
    const store = configureMockStore([thunk])({
      ...qrSyncState,
      metamask: {
        ...qrSyncState.metamask,
        qrSyncPhase: QR_SYNC_PHASES.FAILED,
        qrSyncError: {
          code: QrSyncErrorCodes.QR_EXPIRED,
          message: 'QR code expired.',
        },
      },
    });
    renderWithProvider(<SyncAccountsSettings />, store);
    expect(screen.getByTestId('qr-code-scan')).toBeInTheDocument();
    expect(screen.queryByText(messages.add_device_error_title.message)).not.toBeInTheDocument();
  });

  it('renders EnterVerificationCode when the phase is failed with an OTP_EXPIRED error', () => {
    const store = configureMockStore([thunk])({
      ...qrSyncState,
      metamask: {
        ...qrSyncState.metamask,
        qrSyncPhase: QR_SYNC_PHASES.FAILED,
        qrSyncError: {
          code: QrSyncErrorCodes.OTP_EXPIRED,
          message: 'OTP expired.',
        },
      },
    });
    renderWithProvider(<SyncAccountsSettings />, store);
    expect(screen.getByTestId('enter-verification-code')).toBeInTheDocument();
    expect(screen.queryByText(messages.add_device_error_title.message)).not.toBeInTheDocument();
  });

  it('renders EnterVerificationCode when the phase is failed with an OTP_ATTEMPTS_EXCEEDED error', () => {
    const store = configureMockStore([thunk])({
      ...qrSyncState,
      metamask: {
        ...qrSyncState.metamask,
        qrSyncPhase: QR_SYNC_PHASES.FAILED,
        qrSyncError: {
          code: QrSyncErrorCodes.OTP_ATTEMPTS_EXCEEDED,
          message: 'Too many attempts.',
        },
      },
    });
    renderWithProvider(<SyncAccountsSettings />, store);
    expect(screen.getByTestId('enter-verification-code')).toBeInTheDocument();
    expect(screen.queryByText(messages.add_device_error_title.message)).not.toBeInTheDocument();
  });

  it('renders SyncError when the phase is failed with a non-overridden error', () => {
    const store = configureMockStore([thunk])({
      ...qrSyncState,
      metamask: {
        ...qrSyncState.metamask,
        qrSyncPhase: QR_SYNC_PHASES.FAILED,
        qrSyncError: {
          code: QrSyncErrorCodes.SYNC_FAILED,
          message: 'Sync failed.',
        },
      },
    });
    renderWithProvider(<SyncAccountsSettings />, store);
    expect(screen.getByText(messages.add_device_error_title.message)).toBeInTheDocument();
    expect(screen.queryByTestId('qr-code-scan')).not.toBeInTheDocument();
  });

  it('creates a new session when retry is clicked on the error step', async () => {
    const store = configureMockStore([thunk])({
      ...qrSyncState,
      metamask: {
        ...qrSyncState.metamask,
        qrSyncPhase: QR_SYNC_PHASES.FAILED,
      },
    });
    renderWithProvider(<SyncAccountsSettings />, store);

    fireEvent.click(screen.getByText(messages.add_device_try_again.message));

    await waitFor(() => {
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'messengerCall',
        ['QrSyncController:createSession', []],
      );
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('cancels the sync session when cancel is clicked on the error step', async () => {
    const store = configureMockStore([thunk])({
      ...qrSyncState,
      metamask: {
        ...qrSyncState.metamask,
        qrSyncPhase: QR_SYNC_PHASES.CANCELLED,
      },
    });
    renderWithProvider(<SyncAccountsSettings />, store);

    fireEvent.click(screen.getByText(messages.cancel.message));

    await waitFor(() => {
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'messengerCall',
        ['QrSyncController:cancelSync', []],
      );
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
