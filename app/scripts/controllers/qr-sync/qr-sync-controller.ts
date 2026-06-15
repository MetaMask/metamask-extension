import { BaseController } from '@metamask/base-controller';
import {
  type IKVStore,
  type SessionRequest,
  type ISessionStore,
  SessionStore,
  WebSocketTransport,
} from '@metamask/mobile-wallet-protocol-core';
import {
  DappClient,
  type OtpRequiredPayload,
} from '@metamask/mobile-wallet-protocol-dapp-client';

import { QR_SYNC_CONTROLLER_NAME, QrSyncActionTypes, QrSyncMessageVersion } from './constants';
import type { KeyManager } from './key-manager';
import {
  QrSyncMessage,
  type QrSyncActionType,
  type QrSyncControllerInitOptions,
  type QrSyncControllerMessenger,
  type QrSyncControllerState,
  type QrSyncData,
  type QrSyncError,
  type QrSyncOffer,
  type QrSyncPhase,
  type SyncDataType,
} from './types';
import { controllerMetadata, getDefaultQrSyncControllerState, MESSENGER_EXPOSED_METHODS } from './metadata';

export class QrSyncController extends BaseController<
  typeof QR_SYNC_CONTROLLER_NAME,
  QrSyncControllerState,
  QrSyncControllerMessenger
> {
  readonly #keyManager: KeyManager;

  readonly #kvStore: IKVStore;

  readonly #relayUrl: string;

  #transport: WebSocketTransport | null = null;

  #mwpDappClient: DappClient | null = null;

  #sessionStore: ISessionStore | null = null;

  #otpSubmitCallback: ((otp: string) => Promise<void>) | null = null;

  #otpCancelCallback: (() => void) | null = null;

  constructor({
    keyManager,
    messenger,
    relayUrl,
    kvStore,
    state = {},
  }: QrSyncControllerInitOptions) {
    super({
      name: QR_SYNC_CONTROLLER_NAME,
      metadata: controllerMetadata,
      messenger,
      state: {
        ...getDefaultQrSyncControllerState(),
        ...state,
      },
    });

    this.#keyManager = keyManager;
    this.#relayUrl = relayUrl;
    this.#kvStore = kvStore ?? {
      get: () => Promise.resolve(null),
      set: () => Promise.resolve(),
      delete: () => Promise.resolve(),
    };

    this.messenger.registerMethodActionHandlers(
      this,
      MESSENGER_EXPOSED_METHODS,
    );
  }

  async initialize(): Promise<void> {
    if (this.#mwpDappClient && this.#transport && this.#sessionStore) {
      return;
    }

    this.#setInFlightState({
      actionType: QrSyncActionTypes.INIT_SYNC_SESSION,
      phase: 'initializing',
      connectionStatus: 'connecting',
      canCancel: true,
      canRetry: false,
    });

    try {
      this.#transport = await WebSocketTransport.create({
        kvstore: this.#kvStore,
        url: this.#relayUrl,
        websocket: typeof WebSocket === 'undefined' ? undefined : WebSocket,
      });

      this.#sessionStore = await SessionStore.create(this.#kvStore);

      this.#mwpDappClient = new DappClient({
        transport: this.#transport,
        sessionstore: this.#sessionStore,
        keymanager: this.#keyManager,
      });

      this.#registerClientEventHandlers(this.#mwpDappClient);
      this.#transitionPhase('awaiting-connection', 'connected');
    } catch (error) {
      this.#setError({
        code: 'CHANNEL_INIT_FAILED',
        message:
          error instanceof Error ? error.message : 'Failed to initialize sync',
        retryable: true,
      });
      throw error;
    } finally {
      this.#finishSubmission();
    }
  }

  async createSession(): Promise<void> {
    await this.initialize();
    this.#assertDappClientInitialized(this.#mwpDappClient);

    this.#setInFlightState({
      actionType: QrSyncActionTypes.INIT_SYNC_SESSION,
      phase: 'awaiting-connection',
      connectionStatus: 'connected',
      canCancel: true,
      canRetry: false,
    });

    try {
      await this.#mwpDappClient.connect({
        initialPayload: this.#generateInitialPayload(),
        mode: 'untrusted',
      });
    } catch (error) {
      this.#setError({
        code: 'CHANNEL_INIT_FAILED',
        message:
          error instanceof Error
            ? error.message
            : 'Failed to create sync session',
        retryable: true,
      });
      throw error;
    } finally {
      this.#finishSubmission();
    }
  }

  async grantOtpDisplay(): Promise<void> {
    this.#assertPhase(['awaiting-otp-display']);

    await this.#sendMessage({
      type: QrSyncActionTypes.OTP_DISPLAY_GRANT,
    });

    this.#setInFlightState({
      actionType: QrSyncActionTypes.OTP_DISPLAY_GRANT,
      phase: 'awaiting-otp-input',
      connectionStatus: this.state.connectionStatus,
      canCancel: true,
      canRetry: false,
    });

    // TODO: Send OTP display grant over the sync channel.
    this.#finishSubmission();
  }

  async submitOtp(_otp: string): Promise<void> {
    this.#assertPhase(['awaiting-otp-input']);
    const otp = _otp.trim();

    if (!this.#otpSubmitCallback) {
      throw new Error('OTP submit callback is not available.');
    }

    this.#setInFlightState({
      actionType: QrSyncActionTypes.OTP_DISPLAY_GRANT,
      phase: 'validating-otp',
      connectionStatus: this.state.connectionStatus,
      canCancel: true,
      canRetry: false,
    });

    try {
      await this.#otpSubmitCallback(otp);

      this.update((state) => {
        state.otpAttempts += 1;
        state.otpValidated = true;
        state.phase = 'awaiting-sync-offer';
        state.updatedAt = Date.now();
      });
    } catch (error) {
      this.update((state) => {
        state.otpAttempts += 1;
        state.error = {
          code: 'OTP_INVALID',
          message:
            error instanceof Error ? error.message : 'Failed to validate OTP',
          retryable: true,
        };
        state.updatedAt = Date.now();
      });
      throw error;
    } finally {
      this.#finishSubmission();
    }
  }

  selectAccounts(
    selectedAccountIds: string[],
    selectedSyncDataType: SyncDataType,
  ): void {
    this.#assertPhase(['reviewing-sync-offer', 'awaiting-user-selection']);

    this.update((state) => {
      state.selectedAccountIds = [...selectedAccountIds];
      state.selectedSyncDataType = selectedSyncDataType;
      state.phase = 'sending-sync-ready';
      state.updatedAt = Date.now();
    });
  }

  async sendSyncData(_syncData: QrSyncData[]): Promise<void> {
    this.#assertPhase(['sending-sync-ready']);

    this.#setInFlightState({
      actionType: QrSyncActionTypes.SYNC_READY,
      phase: 'sending-sync-ready',
      connectionStatus: this.state.connectionStatus,
      canCancel: true,
      canRetry: false,
    });

    // TODO: Encrypt and send the selected sync data to the mobile client.
    this.update((state) => {
      state.phase = 'awaiting-sync-completion';
    });
    this.#finishSubmission();
  }

  async cancelSync(reason?: string): Promise<void> {
    this.#otpCancelCallback?.();
    this.#otpSubmitCallback = null;
    this.#otpCancelCallback = null;

    this.update((state) => {
      state.phase = 'cancelled';
      state.isSubmitting = false;
      state.canCancel = false;
      state.canRetry = true;
      state.updatedAt = Date.now();
      if (reason) {
        state.error = {
          code: 'SYNC_FAILED',
          message: reason,
          retryable: true,
        };
      }
    });
  }

  async retryConnection(): Promise<void> {
    this.update((state) => {
      state.connectionStatus = 'reconnecting';
      state.canRetry = false;
      state.error = null;
      state.updatedAt = Date.now();
    });

    await this.createSession();
  }

  acknowledgeCompletion(): void {
    if (this.state.phase !== 'completed') {
      return;
    }

    this.messenger.publish('QrSyncController:syncCompleted', {
      sessionId: this.state.sessionId,
      importedAccountIds: this.state.importedAccountIds,
    });
  }

  dismissError(): void {
    this.update((state) => {
      state.error = null;
      state.updatedAt = Date.now();
    });
  }

  resetState(): void {
    this.update((state) => {
      Object.assign(state, getDefaultQrSyncControllerState());
    });
  }

  setSyncOffer(syncOffer: QrSyncOffer): void {
    this.update((state) => {
      state.syncOffer = syncOffer;
      state.phase = 'reviewing-sync-offer';
      state.expiresAt = syncOffer.deadline;
      state.lastActionType = QrSyncActionTypes.SYNC_OFFER;
      state.updatedAt = Date.now();
    });
  }

  completeSync(importedAccountIds: string[]): void {
    this.update((state) => {
      state.phase = 'completed';
      state.importedAccountIds = [...importedAccountIds];
      state.isSubmitting = false;
      state.canCancel = false;
      state.canRetry = false;
      state.lastActionType = QrSyncActionTypes.SYNC_COMPLETED;
      state.updatedAt = Date.now();
    });
  }

  failSync(error: QrSyncError): void {
    this.#setError(error);
  }

  destroy(): void {
    this.#transport = null;
    this.#mwpDappClient = null;
    this.#sessionStore = null;
    super.destroy();
  }

  #generateInitialPayload(): QrSyncMessage {
    return {
      type: QrSyncActionTypes.INIT_SYNC_SESSION,
      version: QrSyncMessageVersion.V1,
    };
  }

  #registerClientEventHandlers(client: DappClient): void {
    client.on('session_request', (request) => {
      this.#handleSessionRequest(request);
    });

    client.on('otp_required', (payload) => {
      this.#handleOtpRequired(payload).catch((error) => {
        this.#setError({
          code: 'OTP_INVALID',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to handle OTP requirement',
          retryable: true,
        });
      });
    });

    client.on('connected', () => {
      this.update((state) => {
        state.connectionStatus = 'connected';
        state.updatedAt = Date.now();
      });
    });

    client.on('disconnected', () => {
      this.#setError({
        code: 'CHANNEL_DISCONNECTED',
        message: 'The sync channel disconnected.',
        retryable: true,
      });
    });

    client.on('error', (error) => {
      this.#setError({
        code: 'UNKNOWN',
        message: error.message,
        retryable: true,
      });
    });
  }

  #handleSessionRequest(request: SessionRequest): void {
    this.update((state) => {
      state.sessionId = request.id;
      state.qrPayload = this.#generateQrCode(request);
      state.phase = 'displaying-qr';
      state.connectionStatus = 'connecting';
      state.createdAt = state.createdAt ?? Date.now();
      state.updatedAt = Date.now();
      state.expiresAt = request.expiresAt;
      state.canCancel = true;
      state.canRetry = false;
      state.error = null;
    });
  }

  async #handleOtpRequired(payload: OtpRequiredPayload): Promise<void> {
    this.#otpSubmitCallback = payload.submit;
    this.#otpCancelCallback = payload.cancel;

    this.update((state) => {
      state.phase = 'awaiting-otp-display';
      state.otpRequired = true;
      state.otpValidated = false;
      state.updatedAt = Date.now();
      state.expiresAt = payload.deadline;
      state.error = null;
    });

    await this.grantOtpDisplay();
  }

  #generateQrCode(request: SessionRequest): string {
    return JSON.stringify(request);
  }

  #assertDappClientInitialized(value: unknown): asserts value is DappClient {
    if (!value || !(value instanceof DappClient)) {
      throw new Error('MWP Dapp Client not initialized');
    }
  }

  #assertPhase(expectedPhases: QrSyncPhase[]): void {
    if (!expectedPhases.includes(this.state.phase)) {
      throw new Error(
        `QrSyncController action invalid in phase "${this.state.phase}". Expected one of: ${expectedPhases.join(
          ', ',
        )}`,
      );
    }
  }

  #setInFlightState({
    actionType,
    phase,
    connectionStatus,
    canCancel,
    canRetry,
  }: {
    actionType: QrSyncActionType;
    phase: QrSyncPhase;
    connectionStatus: QrSyncControllerState['connectionStatus'];
    canCancel: boolean;
    canRetry: boolean;
  }): void {
    this.update((state) => {
      state.phase = phase;
      state.connectionStatus = connectionStatus;
      state.lastActionType = actionType;
      state.isSubmitting = true;
      state.canCancel = canCancel;
      state.canRetry = canRetry;
      state.error = null;
      state.updatedAt = Date.now();
      state.createdAt = state.createdAt ?? Date.now();
    });
  }

  #finishSubmission(): void {
    this.update((state) => {
      state.isSubmitting = false;
      state.updatedAt = Date.now();
    });
  }

  #transitionPhase(
    phase: QrSyncPhase,
    connectionStatus: QrSyncControllerState['connectionStatus'],
  ): void {
    this.update((state) => {
      state.phase = phase;
      state.connectionStatus = connectionStatus;
      state.updatedAt = Date.now();
    });
  }

  #setError(error: QrSyncError): void {
    this.update((state) => {
      state.phase = 'failed';
      state.connectionStatus = 'errored';
      state.error = error;
      state.isSubmitting = false;
      state.canCancel = false;
      state.canRetry = error.retryable;
      state.updatedAt = Date.now();
    });

    this.messenger.publish('QrSyncController:channelDisconnected', {
      sessionId: this.state.sessionId,
      retryable: error.retryable,
    });
  }

  /**
   * Sends a message to the mobile wallet client over the relay channel.
   *
   * @param message - The message to send.
   * @returns A promise that resolves when the message is sent.
   */
  async #sendMessage(message: Omit<QrSyncMessage, 'version'>): Promise<void> {
    try {
      this.#assertDappClientInitialized(this.#mwpDappClient);

      await this.#mwpDappClient.sendRequest({
        ...message,
        version: QrSyncMessageVersion.V1,
      });
    } catch (error) {
      throw new Error('Failed to send message to mobile wallet client');
    }
  }
}
