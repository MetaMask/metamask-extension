import { QR_SYNC_TIMEOUT_MS } from '../../../../../shared/constants/qr-sync';
import { QrSyncActionTypes, QrSyncMessageVersion } from '../constants';
import { E2eMwpMockClient } from './e2e-mwp-mock-client';

export type QrSyncSimulatorAction =
  | 'mobileScanned'
  | 'deliverSyncOffer'
  | 'deliverSyncCompleted'
  | 'deliverSyncCancel'
  | 'deliverSyncError'
  | 'reset';

export type SimulatorParams = {
  otp?: string;
  isOnboardingCompleted?: boolean;
  sessionId?: string;
  errorMessage?: string;
};

/** Default OTP for QrSync E2E scenarios (matches mobile simulator). */
export const QR_SYNC_E2E_OTP = '123456';

/**
 * Scripts MetaMask Mobile behaviour for QrSync E2E by driving
 * {@link E2eMwpMockClient} events.
 */
export class MobileWalletSimulator {
  readonly #client: E2eMwpMockClient;

  #otp = QR_SYNC_E2E_OTP;

  #otpDeadline: number | null = null;

  #isConnected = false;

  constructor(client: E2eMwpMockClient) {
    this.#client = client;
  }

  bind(): void {
    // No-op for v1 — actions are invoked explicitly via the E2E bridge.
  }

  runAction(action: QrSyncSimulatorAction, params: SimulatorParams = {}): void {
    switch (action) {
      case 'mobileScanned':
        this.#runMobileScanned(params);
        return;
      case 'deliverSyncOffer':
        this.#runDeliverSyncOffer(params);
        return;
      case 'deliverSyncCompleted':
        this.#runDeliverSyncCompleted();
        return;
      case 'deliverSyncCancel':
        this.#runDeliverSyncCancel();
        return;
      case 'deliverSyncError':
        this.#runDeliverSyncError(params);
        return;
      case 'reset':
        this.#runReset();
        return;
      default: {
        const unsupportedAction: never = action;
        throw new Error(
          `Unsupported QrSync simulator action: ${String(unsupportedAction)}`,
        );
      }
    }
  }

  getState() {
    return {
      sessionId: this.#client.sessionRequest?.id ?? null,
      otp: this.#otp,
      otpDeadline: this.#otpDeadline,
      isConnected: this.#isConnected,
      lastSyncReadyPayload: this.#client.lastSentRequest,
    };
  }

  #runMobileScanned(params: SimulatorParams): void {
    this.#otp = params.otp ?? QR_SYNC_E2E_OTP;
    this.#otpDeadline = Date.now() + QR_SYNC_TIMEOUT_MS.MWP_SESSION_TIMEOUT;

    this.#client.emitOtpRequired({
      submit: async (otp: string) => {
        if (otp.trim() !== this.#otp) {
          throw new Error('Invalid OTP');
        }
      },
      cancel: () => {
        this.#isConnected = false;
      },
      deadline: this.#otpDeadline,
    });
  }

  #runDeliverSyncOffer(params: SimulatorParams): void {
    if (!this.#isConnected) {
      this.#client.emitConnected();
      this.#isConnected = true;
    }

    const sessionId =
      params.sessionId ?? this.#client.sessionRequest?.id ?? 'e2e-session-id';

    this.#client.emitMessage({
      type: QrSyncActionTypes.SYNC_OFFER,
      version: QrSyncMessageVersion.V1,
      data: {
        sessionId,
        isOnboardingCompleted: params.isOnboardingCompleted ?? true,
      },
    });
  }

  #runDeliverSyncCompleted(): void {
    this.#client.emitMessage({
      type: QrSyncActionTypes.SYNC_COMPLETED,
      version: QrSyncMessageVersion.V1,
    });
  }

  #runDeliverSyncCancel(): void {
    this.#client.emitMessage({
      type: QrSyncActionTypes.SYNC_CANCEL,
      version: QrSyncMessageVersion.V1,
    });
  }

  #runDeliverSyncError(params: SimulatorParams): void {
    this.#client.emitMessage({
      type: QrSyncActionTypes.SYNC_ERROR,
      version: QrSyncMessageVersion.V1,
      data: {
        message: params.errorMessage ?? 'Simulated sync error',
      },
    });
  }

  #runReset(): void {
    this.#otp = QR_SYNC_E2E_OTP;
    this.#otpDeadline = null;
    this.#isConnected = false;
    this.#client.reset();
  }
}
