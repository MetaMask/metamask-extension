import React from 'react';
import {
  act,
  cleanup,
  fireEvent,
  screen,
  waitFor,
} from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import {
  QR_SYNC_PHASES,
  QrSyncErrorCodes,
  type QrSyncErrorCode,
  type QrSyncPhase,
} from '../../../../shared/constants/qr-sync';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { submitRequestToBackground } from '../../../store/background-connection';
import { AddWallets } from './components';
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
    QrCodeScan: ({ onRestart }: { onRestart: () => void }) => (
      <button type="button" data-testid="qr-code-scan" onClick={onRestart}>
        restart
      </button>
    ),
    EnterVerificationCode: ({
      isAwaitingSyncOffer,
    }: {
      isAwaitingSyncOffer?: boolean;
    }) => (
      <div
        data-testid="enter-verification-code"
        data-awaiting-sync-offer={isAwaitingSyncOffer}
      />
    ),
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
    AddWallets: jest.fn(() => <div data-testid="add-wallets" />),
    LoadingStep: () => <div data-testid="loading-step" />,
    Success: ({
      onDone,
      syncedWalletCount,
      syncedPrivateKeyAccountCount,
    }: {
      onDone: () => void;
      syncedWalletCount: number;
      syncedPrivateKeyAccountCount: number;
    }) => (
      <button
        type="button"
        data-testid="success"
        data-wallet-count={syncedWalletCount}
        data-imported-account-count={syncedPrivateKeyAccountCount}
        onClick={onDone}
      >
        done
      </button>
    ),
    SyncError: ({
      onRetry,
      onCancel,
    }: {
      onRetry: () => void;
      onCancel: () => void;
    }) => (
      <div data-testid="sync-error">
        <button type="button" data-testid="sync-error-retry" onClick={onRetry}>
          retry
        </button>
        <button
          type="button"
          data-testid="sync-error-cancel"
          onClick={onCancel}
        >
          cancel
        </button>
      </div>
    ),
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

type QrSyncTestState = Omit<typeof qrSyncState, 'metamask'> & {
  metamask: Omit<
    typeof qrSyncState.metamask,
    'qrSyncPhase' | 'qrSyncQrPayload' | 'qrSyncError'
  > & {
    qrSyncPhase: QrSyncPhase;
    qrSyncQrPayload: string | null;
    qrSyncError: { code: QrSyncErrorCode; message: string } | null;
  };
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

  it('keeps EnterVerificationCode visible while awaiting a sync offer', () => {
    const store = configureMockStore([thunk])({
      ...qrSyncState,
      metamask: {
        ...qrSyncState.metamask,
        qrSyncPhase: QR_SYNC_PHASES.AWAITING_SYNC_OFFER,
      },
    });
    renderWithProvider(<SyncAccountsSettings />, store);
    expect(screen.getByTestId('enter-verification-code')).toHaveAttribute(
      'data-awaiting-sync-offer',
      'true',
    );
    expect(screen.queryByTestId('loading-step')).not.toBeInTheDocument();
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

  it('renders a usable Success step when sync completed on another surface', async () => {
    const store = configureMockStore([thunk])({
      ...qrSyncState,
      metamask: {
        ...qrSyncState.metamask,
        qrSyncPhase: QR_SYNC_PHASES.COMPLETED,
      },
    });
    renderWithProvider(<SyncAccountsSettings />, store);

    const success = screen.getByTestId('success');
    expect(success).toHaveAttribute('data-wallet-count', '0');
    expect(success).toHaveAttribute('data-imported-account-count', '0');

    fireEvent.click(success);

    await waitFor(() => {
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'QrSyncController:cancelSync',
        [],
      );
    });
  });

  it('creates a QR sync session without cancelling another surface when mounted', async () => {
    const store = configureMockStore([thunk])(qrSyncState);
    renderWithProvider(<SyncAccountsSettings />, store);

    await waitFor(() => {
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'QrSyncController:createSession',
        [],
      );
    });
    expect(mockSubmitRequestToBackground).not.toHaveBeenCalledWith(
      'QrSyncController:cancelSync',
      [],
    );
  });

  it('reuses the active QR sync session when mounted in the displaying-qr phase', async () => {
    const store = configureMockStore([thunk])({
      ...qrSyncState,
      metamask: {
        ...qrSyncState.metamask,
        qrSyncPhase: QR_SYNC_PHASES.DISPLAYING_QR,
      },
    });
    renderWithProvider(<SyncAccountsSettings />, store);

    await waitFor(() => {
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'QrSyncController:createSession',
        [],
      );
    });
    expect(mockSubmitRequestToBackground).not.toHaveBeenCalledWith(
      'QrSyncController:cancelSync',
      [],
    );
  });

  it('does not cancel the shared session when another extension surface unmounts', async () => {
    const store = configureMockStore([thunk])(qrSyncState);
    const { unmount } = renderWithProvider(<SyncAccountsSettings />, store);

    await waitFor(() => {
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'QrSyncController:createSession',
        [],
      );
    });
    mockSubmitRequestToBackground.mockClear();

    unmount();

    expect(mockSubmitRequestToBackground).not.toHaveBeenCalledWith(
      'QrSyncController:cancelSync',
      [],
    );
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
    expect(screen.getByTestId('sync-error')).toBeInTheDocument();
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
    expect(screen.getByTestId('sync-error')).toBeInTheDocument();
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
    expect(screen.queryByTestId('sync-error')).not.toBeInTheDocument();
  });

  it('does not start a new session on its own when the QR code expires', async () => {
    let currentState: QrSyncTestState = qrSyncState;
    const store = configureMockStore([thunk])(() => currentState);
    renderWithProvider(<SyncAccountsSettings />, store);

    await waitFor(() => {
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'QrSyncController:createSession',
        [],
      );
    });
    mockSubmitRequestToBackground.mockClear();

    currentState = {
      ...qrSyncState,
      metamask: {
        ...qrSyncState.metamask,
        qrSyncPhase: QR_SYNC_PHASES.FAILED,
        qrSyncQrPayload: null,
        qrSyncError: {
          code: QrSyncErrorCodes.QR_EXPIRED,
          message: 'QR code expired.',
        },
      },
    };
    act(() => {
      store.dispatch({ type: 'QR_SYNC_TEST_EXPIRED' });
    });

    expect(screen.getByTestId('qr-code-scan')).toBeInTheDocument();
    expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();
  });

  it('starts a new session when restart is clicked on the QR step', async () => {
    renderWithProvider(
      <SyncAccountsSettings />,
      configureMockStore([thunk])(qrSyncState),
    );
    await waitFor(() => {
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'QrSyncController:createSession',
        [],
      );
    });
    mockSubmitRequestToBackground.mockClear();

    fireEvent.click(screen.getByTestId('qr-code-scan'));

    await waitFor(() => {
      expect(mockSubmitRequestToBackground).toHaveBeenNthCalledWith(
        1,
        'QrSyncController:cancelSync',
        [],
      );
      expect(mockSubmitRequestToBackground).toHaveBeenNthCalledWith(
        2,
        'QrSyncController:createSession',
        [],
      );
    });
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
    expect(screen.queryByTestId('sync-error')).not.toBeInTheDocument();
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
    expect(screen.queryByTestId('sync-error')).not.toBeInTheDocument();
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
    expect(screen.getByTestId('sync-error')).toBeInTheDocument();
    expect(screen.queryByTestId('qr-code-scan')).not.toBeInTheDocument();
  });

  it('cancels the session when retry is clicked on the error step', async () => {
    const store = configureMockStore([thunk])({
      ...qrSyncState,
      metamask: {
        ...qrSyncState.metamask,
        qrSyncPhase: QR_SYNC_PHASES.FAILED,
      },
    });
    renderWithProvider(<SyncAccountsSettings />, store);

    fireEvent.click(screen.getByTestId('sync-error-retry'));

    await waitFor(() => {
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'QrSyncController:cancelSync',
        [],
      );
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'QrSyncController:createSession',
        [],
      );
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('syncs the selected account groups using the entered password', async () => {
    jest.mocked(AddWallets).mockImplementationOnce(({ onAddWallets }) => (
      <button
        data-testid="add-wallets"
        type="button"
        onClick={() =>
          onAddWallets({
            selectedAccountGroupIds: ['entropy:wallet/0'],
            syncedAccountCount: 1,
            syncedWalletCount: 1,
          })
        }
      >
        add wallets
      </button>
    ));
    const store = configureMockStore([thunk])({
      ...qrSyncState,
      metamask: {
        ...qrSyncState.metamask,
        qrSyncPhase: QR_SYNC_PHASES.REVIEWING_SYNC_OFFER,
      },
    });
    renderWithProvider(<SyncAccountsSettings />, store);

    fireEvent.click(screen.getByTestId('enter-password'));
    fireEvent.click(screen.getByTestId('add-wallets'));

    await waitFor(() => {
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'QrSyncController:syncAccounts',
        ['test-password', ['entropy:wallet/0']],
      );
    });
  });

  it('cancels and navigates away when cancel is clicked on the error step', async () => {
    const store = configureMockStore([thunk])({
      ...qrSyncState,
      metamask: {
        ...qrSyncState.metamask,
        qrSyncPhase: QR_SYNC_PHASES.CANCELLED,
      },
    });
    renderWithProvider(<SyncAccountsSettings />, store);

    fireEvent.click(screen.getByTestId('sync-error-cancel'));

    await waitFor(() => {
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'QrSyncController:cancelSync',
        [],
      );
      expect(mockNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE);
    });
  });
});
