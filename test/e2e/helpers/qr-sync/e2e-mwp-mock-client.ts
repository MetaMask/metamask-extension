import {
  ErrorCode,
  SessionError,
  type SessionRequest,
} from '@metamask/mobile-wallet-protocol-core';
import {
  DappClient,
  type OtpRequiredPayload,
} from '@metamask/mobile-wallet-protocol-dapp-client';
import { QR_SYNC_TIMEOUT_MS } from '../../../../shared/constants/qr-sync';
import {
  E2E_MWP_STUB_KEY_MANAGER,
  E2E_MWP_STUB_SESSION_STORE,
  E2E_MWP_STUB_TRANSPORT,
} from './e2e-mwp-stubs';

type PendingConnection = {
  resolve: () => void;
  expiryTimeoutId: ReturnType<typeof setTimeout>;
};

/**
 * Test-build stand-in for {@link DappClient} used by QrSync E2E tests.
 * Emits the same events as the unit-test MWP mock without a real relay.
 */
export class E2eMwpMockClient extends DappClient {
  #sessionRequest: SessionRequest | null = null;

  #lastSentRequest: unknown | null = null;

  #pendingConnection: PendingConnection | null = null;

  constructor() {
    super({
      transport: E2E_MWP_STUB_TRANSPORT,
      sessionstore: E2E_MWP_STUB_SESSION_STORE,
      keymanager: E2E_MWP_STUB_KEY_MANAGER,
    });
  }

  get sessionRequest(): SessionRequest | null {
    return this.#sessionRequest;
  }

  get lastSentRequest(): unknown | null {
    return this.#lastSentRequest;
  }

  /**
   * Like the real client, stays pending until the wallet scans the QR code and
   * rejects with `REQUEST_EXPIRED` once the session request expires.
   *
   * @param options - Connection options.
   */
  override async connect(
    options?: Parameters<DappClient['connect']>[0],
  ): Promise<void> {
    this.#settlePendingConnection();

    const mode = options?.mode ?? 'untrusted';
    const sessionRequest: SessionRequest = {
      id: crypto.randomUUID(),
      expiresAt: Date.now() + QR_SYNC_TIMEOUT_MS.MWP_SESSION_TIMEOUT,
      mode,
      channel: 'websocket',
      publicKeyB64: 'e2e-mock-public-key',
    };
    console.log('E2E MWP Mock Client: session request', sessionRequest);

    this.#sessionRequest = sessionRequest;

    await new Promise<void>((resolve, reject) => {
      const expiryTimeoutId = setTimeout(
        () => {
          this.#pendingConnection = null;
          reject(
            new SessionError(
              ErrorCode.REQUEST_EXPIRED,
              'Session request expired before wallet could connect',
            ),
          );
        },
        Math.max(sessionRequest.expiresAt - Date.now(), 0),
      );
      this.#pendingConnection = { resolve, expiryTimeoutId };

      this.emit('session_request', sessionRequest);
    });
  }

  override async disconnect(): Promise<void> {
    this.#settlePendingConnection();
    await super.disconnect();
  }

  override async sendRequest(payload: unknown): Promise<void> {
    this.#lastSentRequest = payload;
  }

  emitSessionRequest(request: SessionRequest): void {
    this.#sessionRequest = request;
    this.emit('session_request', request);
  }

  emitOtpRequired(payload: OtpRequiredPayload): void {
    // The wallet scanned the QR code, so the session request can no longer
    // expire.
    this.#settlePendingConnection();
    this.emit('otp_required', payload);
  }

  emitConnected(): void {
    this.#settlePendingConnection();
    this.emit('connected');
  }

  emitMessage(message: unknown): void {
    this.emit('message', message);
  }

  emitDisconnected(): void {
    this.emit('disconnected');
  }

  emitError(error: Error): void {
    this.emit('error', error);
  }

  reset(): void {
    this.#settlePendingConnection();
    this.#sessionRequest = null;
    this.#lastSentRequest = null;
  }

  #settlePendingConnection(): void {
    if (!this.#pendingConnection) {
      return;
    }

    clearTimeout(this.#pendingConnection.expiryTimeoutId);
    this.#pendingConnection.resolve();
    this.#pendingConnection = null;
  }
}
