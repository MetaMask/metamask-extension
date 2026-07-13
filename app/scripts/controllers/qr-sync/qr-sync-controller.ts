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
import type { AccountGroupId } from '@metamask/account-api';

import log from 'loglevel';
import {
  QR_SYNC_PHASES,
  QR_SYNC_TIMEOUT_MS,
  QrSyncErrorCode,
  type QrSyncPhase,
} from '../../../../shared/constants/qr-sync';
import { QrSyncErrorCodes } from '../../../../shared/constants/qr-sync';
import {
  QR_SYNC_CONTROLLER_NAME,
  QrSyncActionTypes,
  QrSyncConnectionStatus,
  QrSyncErrorMessages,
  QrSyncMessageVersion,
} from './constants';
import {
  assertQrSyncPhase,
  createInitSyncSessionMessage,
  generateQrCode,
  getSyncCompletionFailureError,
  getSyncCompletionTimeoutMs,
  getSyncOfferFailureError,
  canAcceptSyncOffer,
  isQrSyncOffer,
  normalizeQrSyncMessage,
  resolveQrSyncErrorCode,
} from './utils';
import type { KeyManager } from './key-manager';
import {
  QrSyncConnectionStatusType,
  QrSyncMessage,
  type QrSyncControllerInitOptions,
  type QrSyncControllerMessenger,
  type QrSyncControllerState,
  type QrSyncReadyData,
  type QrSyncOffer,
} from './types';
import {
  controllerMetadata,
  getDefaultQrSyncControllerState,
  MESSENGER_EXPOSED_METHODS,
} from './metadata';
import { InMemoryKvStore } from './kv-store';

export class QrSyncController extends BaseController<
  typeof QR_SYNC_CONTROLLER_NAME,
  QrSyncControllerState,
  QrSyncControllerMessenger
> {
  readonly #keyManager: KeyManager;

  readonly #kvStore: IKVStore = new InMemoryKvStore();

  readonly #relayUrl: string;

  #transport: WebSocketTransport | null = null;

  #mwpDappClient: DappClient | null = null;

  #sessionStore: ISessionStore | null = null;

  #otpSubmitCallback: ((otp: string) => Promise<void>) | null = null;

  #otpCancelCallback: (() => void) | null = null;

  #syncCompletionDeferred: {
    resolve: () => void;
    reject: (error: Error) => void;
  } | null = null;

  #syncCompletionTimeoutId: NodeJS.Timeout | null = null;

  #syncOfferDeferred: {
    resolve: () => void;
    reject: (error: Error) => void;
  } | null = null;

  #syncOfferTimeoutId: NodeJS.Timeout | null = null;

  #otpTimeoutId: NodeJS.Timeout | null = null;

  #clientEventHandlers: {
    sessionRequest: (request: SessionRequest) => void;
    message: (message: unknown) => void;
    otpRequired: (payload: OtpRequiredPayload) => void;
    connected: () => void;
    disconnected: () => void;
    error: (error: Error) => void;
  } | null = null;

  constructor({
    keyManager,
    messenger,
    relayUrl,
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

    this.messenger.registerMethodActionHandlers(
      this,
      MESSENGER_EXPOSED_METHODS,
    );
  }

  async createSession(): Promise<void> {
    await this.#initialize();
    this.#assertDappClientInitialized(this.#mwpDappClient);

    try {
      await this.#mwpDappClient.connect({
        initialPayload: createInitSyncSessionMessage(),
        mode: 'untrusted',
      });
    } catch (error) {
      this.#setError({
        error,
        code: QrSyncErrorCodes.CHANNEL_INIT_FAILED,
        message: QrSyncErrorMessages.SYNC_FAILED_TO_CREATE_SESSION,
      });
      log.error('QrSyncController: failed to create session', error);
      this.#cleanupSession({ cancelOtp: true });
    } finally {
      this.#finishSubmission();
    }
  }

  async submitOtp(otp: string): Promise<void> {
    assertQrSyncPhase(this.state.qrSyncPhase, [
      QR_SYNC_PHASES.AWAITING_OTP_INPUT,
    ]);

    if (!this.#otpSubmitCallback) {
      throw new Error('OTP submit callback is not available.');
    }

    try {
      await this.#otpSubmitCallback(otp.trim());
      this.#clearOtpTimeout();

      this.update((state) => {
        state.qrSyncPhase = QR_SYNC_PHASES.AWAITING_SYNC_OFFER;
        state.qrSyncUpdatedAt = Date.now();
      });

      this.#waitForSyncOffer().catch((error) => {
        this.#failAwaitingSyncOffer(error).catch((failError) => {
          log.error(
            'QrSyncController: failed to handle sync offer wait failure',
            failError,
          );
        });
      });
    } catch (error) {
      this.update((state) => {
        state.qrSyncError = {
          code: QrSyncErrorCodes.OTP_INVALID,
          message:
            error instanceof Error
              ? error.message
              : QrSyncErrorMessages.OTP_VALIDATION_FAILED,
        };
        state.qrSyncUpdatedAt = Date.now();
      });
      throw error;
    } finally {
      this.#finishSubmission();
    }
  }

  async syncAccounts(
    password: string,
    selectedAccountGroupIds: AccountGroupId[],
  ): Promise<void> {
    assertQrSyncPhase(this.state.qrSyncPhase, [
      QR_SYNC_PHASES.REVIEWING_SYNC_OFFER,
    ]);

    const exportData = (await this.messenger.call(
      'QrSyncDataService:buildWalletExportEntries',
      password,
      selectedAccountGroupIds,
    )) as QrSyncReadyData;

    const deadline = Date.now() + QR_SYNC_TIMEOUT_MS.SYNC_COMPLETION_TIMEOUT;

    this.update((state) => {
      state.qrSyncSelectedAccountGroupIds = [...selectedAccountGroupIds];
      state.qrSyncError = null;
      state.qrSyncUpdatedAt = Date.now();
    });
    await this.#sendSyncData({ deadline, data: exportData });
  }

  async #initialize(): Promise<void> {
    if (this.#mwpDappClient && this.#transport && this.#sessionStore) {
      return;
    }

    this.update((state) => {
      state.qrSyncConnectionStatus = 'connecting';
      state.qrSyncError = null;
      state.qrSyncUpdatedAt = Date.now();
      state.qrSyncCreatedAt = state.qrSyncCreatedAt ?? Date.now();
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
      this.#transitionPhase(this.state.qrSyncPhase, 'connected');
    } catch (error) {
      this.#setError({
        error,
        code: QrSyncErrorCodes.CHANNEL_INIT_FAILED,
        message: QrSyncErrorMessages.SYNC_FAILED_TO_INITIALIZE,
      });
      throw error;
    } finally {
      this.#finishSubmission();
    }
  }

  async #sendSyncData(syncPayload: {
    deadline: number;
    data: QrSyncReadyData;
  }): Promise<void> {
    assertQrSyncPhase(this.state.qrSyncPhase, [
      QR_SYNC_PHASES.REVIEWING_SYNC_OFFER,
    ]);

    await this.#sendMessage<QrSyncReadyData>({
      type: QrSyncActionTypes.SYNC_READY,
      deadline: syncPayload.deadline,
      data: syncPayload.data,
    });

    this.update((state) => {
      state.qrSyncPhase = QR_SYNC_PHASES.AWAITING_SYNC_COMPLETION;
    });
    this.#finishSubmission();

    // asynchronously wait for the sync completion message from the mobile wallet client
    // if the sync completion message is not received within the timeout period, fail the sync with SESSION_EXPIRED error
    this.#waitForSyncCompletion(syncPayload.deadline).catch((error) => {
      this.#failAwaitingSyncCompletion(error);
    });
  }

  async #waitForSyncOffer(): Promise<void> {
    try {
      await new Promise<void>((resolve, reject) => {
        this.#syncOfferDeferred = { resolve, reject };
        this.#syncOfferTimeoutId = setTimeout(() => {
          this.#rejectSyncOffer(
            new Error(QrSyncErrorMessages.SYNC_OFFER_TIMED_OUT),
          );
        }, QR_SYNC_TIMEOUT_MS.SYNC_OFFER_TIMEOUT);
      });
    } finally {
      this.#clearSyncOfferWait();
    }
  }

  async #failAwaitingSyncOffer(error: unknown): Promise<void> {
    if (this.state.qrSyncPhase !== QR_SYNC_PHASES.AWAITING_SYNC_OFFER) {
      return;
    }

    const { code, message } = getSyncOfferFailureError(error);

    if (message === QrSyncErrorMessages.SYNC_OFFER_TIMED_OUT) {
      await this.#notifyPeerSyncOfferTimedOut(message);
    }

    this.#setError({
      code,
      message,
    });
  }

  async #notifyPeerSyncOfferTimedOut(message: string): Promise<void> {
    if (!this.#mwpDappClient) {
      return;
    }

    try {
      await this.#sendMessage({
        type: QrSyncActionTypes.SYNC_ERROR,
        data: { message },
      });
      await this.#sendMessage({
        type: QrSyncActionTypes.SYNC_CANCEL,
      });
    } catch (notifyError) {
      log.warn(
        'QrSyncController: failed to notify mobile of sync offer timeout',
        notifyError,
      );
    }
  }

  async #waitForSyncCompletion(deadline: number): Promise<void> {
    const timeoutMs = getSyncCompletionTimeoutMs(deadline);

    try {
      await new Promise<void>((resolve, reject) => {
        this.#syncCompletionDeferred = { resolve, reject };
        this.#syncCompletionTimeoutId = setTimeout(() => {
          this.#rejectSyncCompletion(
            new Error(QrSyncErrorMessages.SYNC_COMPLETION_TIMED_OUT),
          );
        }, timeoutMs);
      });
    } finally {
      this.#clearSyncCompletionWait();
    }
  }

  #failAwaitingSyncCompletion(error: unknown): void {
    if (this.state.qrSyncPhase !== QR_SYNC_PHASES.AWAITING_SYNC_COMPLETION) {
      return;
    }

    this.#setError(getSyncCompletionFailureError(error));
  }

  async cancelOtp(reason?: string): Promise<void> {
    assertQrSyncPhase(this.state.qrSyncPhase, [
      QR_SYNC_PHASES.AWAITING_OTP_INPUT,
    ]);
    this.#clearOtpTimeout();
    await this.#notifyPeerCancel();
    this.#cleanupSession({ cancelOtp: true });

    this.update((state) => {
      state.qrSyncPhase = QR_SYNC_PHASES.CANCELLED;
      state.qrSyncUpdatedAt = Date.now();
      if (reason) {
        state.qrSyncError = {
          code: QrSyncErrorCodes.SYNC_FAILED,
          message: reason,
        };
      }
    });
  }

  async cancelSync(reason?: string): Promise<void> {
    await this.#notifyPeerCancel();
    this.#cleanupSession({ cancelOtp: true });

    this.update((state) => {
      state.qrSyncPhase = QR_SYNC_PHASES.CANCELLED;
      state.qrSyncUpdatedAt = Date.now();
      if (reason) {
        state.qrSyncError = {
          code: QrSyncErrorCodes.SYNC_REJECTED,
          message: reason,
        };
      }
    });
  }

  resetState(): void {
    this.update((state) => {
      Object.assign(state, getDefaultQrSyncControllerState());
    });
  }

  destroy(): void {
    this.#cleanupSession({ cancelOtp: true });
    super.destroy();
  }

  #setSyncOffer(syncOffer: QrSyncOffer): void {
    this.#resolveSyncOffer();

    this.update((state) => {
      state.syncOffer = syncOffer;
      state.qrSyncPhase = QR_SYNC_PHASES.REVIEWING_SYNC_OFFER;
      state.qrSyncUpdatedAt = Date.now();
    });
  }

  #completeSync(): void {
    this.update((state) => {
      state.qrSyncPhase = QR_SYNC_PHASES.COMPLETED;
      state.qrSyncUpdatedAt = Date.now();
    });

    this.#cleanupSession();
  }

  #registerClientEventHandlers(client: DappClient): void {
    const sessionRequest = (request: SessionRequest) => {
      this.#handleSessionRequest(request);
    };

    const message = (messagePayload: unknown) => {
      this.#handleMessage(messagePayload);
    };

    const otpRequired = (payload: OtpRequiredPayload) => {
      log.debug('QrSyncController: OTP required');
      this.#handleOtpRequired(payload).catch((error) => {
        this.#setError({
          error,
          code: QrSyncErrorCodes.OTP_INVALID,
          message: 'Failed to handle OTP requirement',
        });
      });
    };

    const connected = () => {
      log.debug('QrSyncController: connected to the sync channel');
      this.update((state) => {
        state.qrSyncConnectionStatus = QrSyncConnectionStatus.CONNECTED;
        state.qrSyncUpdatedAt = Date.now();
      });
    };

    const disconnected = () => {
      this.#setError({
        code: QrSyncErrorCodes.CHANNEL_DISCONNECTED,
        message: 'The sync channel disconnected.',
      });
    };

    const clientError = (error: Error) => {
      log.error('QrSyncController: error', error);
      this.#setError({
        error,
        code: QrSyncErrorCodes.UNKNOWN,
        message: error.message,
      });
    };

    this.#clientEventHandlers = {
      sessionRequest,
      message,
      otpRequired,
      connected,
      disconnected,
      error: clientError,
    };

    client.on('session_request', sessionRequest);
    client.on('message', message);
    client.on('otp_required', otpRequired);
    client.on('connected', connected);
    client.on('disconnected', disconnected);
    client.on('error', clientError);
  }

  #handleSessionRequest(request: SessionRequest): void {
    this.update((state) => {
      state.qrSyncSessionId = request.id;
      state.qrSyncQrPayload = generateQrCode(request);
      state.qrSyncPhase = QR_SYNC_PHASES.DISPLAYING_QR;
      state.qrSyncConnectionStatus = QrSyncConnectionStatus.CONNECTING;
      state.qrSyncCreatedAt = state.qrSyncCreatedAt ?? Date.now();
      state.qrSyncUpdatedAt = Date.now();
      state.qrSyncError = null;
    });
  }

  async #handleOtpRequired(payload: OtpRequiredPayload): Promise<void> {
    this.#otpSubmitCallback = payload.submit;
    this.#otpCancelCallback = payload.cancel;

    this.update((state) => {
      state.qrSyncPhase = QR_SYNC_PHASES.AWAITING_OTP_INPUT;
      state.qrSyncUpdatedAt = Date.now();
      state.qrSyncError = null;
    });

    // TODO: Implement OTP display grant on MWP SDK
    // await this.#sendMessage({
    //   type: QrSyncActionTypes.OTP_DISPLAY_GRANT,
    // });

    this.#scheduleOtpTimeout();

    this.#finishSubmission();
  }

  #scheduleOtpTimeout(): void {
    this.#clearOtpTimeout();

    this.#otpTimeoutId = setTimeout(() => {
      if (this.state.qrSyncPhase !== QR_SYNC_PHASES.AWAITING_OTP_INPUT) {
        return;
      }

      // set error to OTP expired
      this.#setError({
        code: QrSyncErrorCodes.OTP_EXPIRED,
        message: QrSyncErrorMessages.OTP_EXPIRED,
      });
    }, QR_SYNC_TIMEOUT_MS.MWP_SESSION_TIMEOUT);
  }

  #clearOtpTimeout(): void {
    if (this.#otpTimeoutId !== null) {
      clearTimeout(this.#otpTimeoutId);
      this.#otpTimeoutId = null;
    }
  }

  #handleMessage(message: unknown): void {
    const parsedMessage = normalizeQrSyncMessage(message);

    if (!parsedMessage) {
      log.warn('QrSyncController: received invalid message payload', message);
      return;
    }

    switch (parsedMessage.type) {
      case QrSyncActionTypes.SYNC_OFFER:
        if (
          !canAcceptSyncOffer({
            hasDappClient: Boolean(this.#mwpDappClient),
            connectionStatus: this.state.qrSyncConnectionStatus,
            phase: this.state.qrSyncPhase,
          })
        ) {
          log.warn('QrSyncController: ignoring sync offer', {
            connectionStatus: this.state.qrSyncConnectionStatus,
            phase: this.state.qrSyncPhase,
          });
          throw new Error(
            `QrSyncController: ${QrSyncErrorMessages.PREMATURE_SYNC_OFFER_RECEIVED}`,
          );
        }

        if (isQrSyncOffer(parsedMessage.data)) {
          this.#setSyncOffer(parsedMessage.data);
          return;
        }

        log.warn(
          'QrSyncController: received sync offer with invalid payload',
          parsedMessage,
        );
        return;

      case QrSyncActionTypes.SYNC_COMPLETED:
        this.#resolveSyncCompletion();
        this.#completeSync();
        return;

      case QrSyncActionTypes.SYNC_CANCEL:
        this.#resolveSyncCompletion();
        this.#handlePeerCancel();
        return;

      case QrSyncActionTypes.SYNC_ERROR: {
        const syncErrorMessage =
          (parsedMessage.data as { message?: string })?.message ??
          QrSyncErrorMessages.SYNC_SESSION_ENCOUNTERED_ERROR;
        this.#rejectSyncCompletion(new Error(syncErrorMessage));
        this.#setError({
          code: QrSyncErrorCodes.SYNC_FAILED,
          message: syncErrorMessage,
        });
        return;
      }

      default:
        log.error(
          'QrSyncController: ignoring unsupported message type',
          parsedMessage.type,
        );
    }
  }

  #assertDappClientInitialized(value: unknown): asserts value is DappClient {
    if (!value || !(value instanceof DappClient)) {
      throw new Error('MWP Dapp Client not initialized');
    }
  }

  #handlePeerCancel(): void {
    this.#cleanupSession({ cancelOtp: true });

    this.update((state) => {
      state.qrSyncPhase = QR_SYNC_PHASES.CANCELLED;
      state.qrSyncConnectionStatus = QrSyncConnectionStatus.DISCONNECTED;
      state.qrSyncError = {
        code: QrSyncErrorCodes.SYNC_REJECTED,
        message: QrSyncErrorMessages.SYNC_SESSION_CANCELLED_BY_PEER,
      };
      state.syncOffer = null;
      state.qrSyncQrPayload = null;
      state.qrSyncSelectedAccountGroupIds = [];
      state.qrSyncUpdatedAt = Date.now();
    });
  }

  #finishSubmission(): void {
    this.update((state) => {
      state.qrSyncUpdatedAt = Date.now();
    });
  }

  #transitionPhase(
    qrSyncPhase: QrSyncPhase,
    qrSyncConnectionStatus: QrSyncConnectionStatusType,
  ): void {
    this.update((state) => {
      state.qrSyncPhase = qrSyncPhase;
      state.qrSyncConnectionStatus = qrSyncConnectionStatus;
      state.qrSyncUpdatedAt = Date.now();
    });
  }

  #setError({
    error,
    code,
    message,
  }: {
    error?: unknown;
    code: QrSyncErrorCode;
    message?: string;
  }): void {
    const resolvedCode = resolveQrSyncErrorCode(error, code);
    const resolvedMessage =
      error instanceof Error && error.message ? error.message : (message ?? '');

    this.#cleanupSession({ cancelOtp: true });

    this.update((state) => {
      state.qrSyncPhase = QR_SYNC_PHASES.FAILED;
      state.qrSyncConnectionStatus = QrSyncConnectionStatus.ERRORED;
      state.qrSyncError = { code: resolvedCode, message: resolvedMessage };
      state.syncOffer = null;
      state.qrSyncQrPayload = null;
      state.qrSyncSelectedAccountGroupIds = [];
      state.qrSyncUpdatedAt = Date.now();
    });
  }

  #resolveSyncCompletion(): void {
    this.#clearSyncCompletionWait();
    this.#syncCompletionDeferred?.resolve();
    this.#syncCompletionDeferred = null;
  }

  #rejectSyncCompletion(error: Error): void {
    this.#clearSyncCompletionWait();
    this.#syncCompletionDeferred?.reject(error);
    this.#syncCompletionDeferred = null;
  }

  #clearSyncCompletionWait(): void {
    if (this.#syncCompletionTimeoutId !== null) {
      clearTimeout(this.#syncCompletionTimeoutId);
      this.#syncCompletionTimeoutId = null;
    }
  }

  #resolveSyncOffer(): void {
    this.#clearSyncOfferWait();
    this.#syncOfferDeferred?.resolve();
    this.#syncOfferDeferred = null;
  }

  #rejectSyncOffer(error: Error): void {
    this.#clearSyncOfferWait();
    this.#syncOfferDeferred?.reject(error);
    this.#syncOfferDeferred = null;
  }

  #clearSyncOfferWait(): void {
    if (this.#syncOfferTimeoutId !== null) {
      clearTimeout(this.#syncOfferTimeoutId);
      this.#syncOfferTimeoutId = null;
    }
  }

  #cleanupSession({ cancelOtp = false }: { cancelOtp?: boolean } = {}): void {
    this.#clearOtpTimeout();

    if (this.#syncOfferDeferred) {
      this.#rejectSyncOffer(
        new Error(QrSyncErrorMessages.SYNC_SESSION_ENDED_BEFORE_SYNC_OFFER),
      );
    } else {
      this.#clearSyncOfferWait();
    }

    if (this.#syncCompletionDeferred) {
      this.#rejectSyncCompletion(
        new Error(QrSyncErrorMessages.SYNC_SESSION_ENDED_BEFORE_COMPLETION),
      );
    } else {
      this.#clearSyncCompletionWait();
    }

    if (cancelOtp) {
      try {
        this.#otpCancelCallback?.();
      } catch (error) {
        log.warn('QrSyncController: failed to cancel OTP flow', error);
      }
    }

    if (this.#mwpDappClient) {
      this.#unregisterClientEventHandlers(this.#mwpDappClient);
    }

    this.#otpSubmitCallback = null;
    this.#otpCancelCallback = null;
    this.#transport = null;
    this.#mwpDappClient = null;
    this.#sessionStore = null;

    if (this.#kvStore instanceof InMemoryKvStore) {
      this.#kvStore.clear();
    }
  }

  /**
   * Sends a message to the mobile wallet client over the relay channel.
   *
   * @param message - The message to send.
   * @returns A promise that resolves when the message is sent.
   */
  async #sendMessage<DataType = undefined>(
    message: Omit<QrSyncMessage<DataType>, 'version'>,
  ): Promise<void> {
    try {
      this.#assertDappClientInitialized(this.#mwpDappClient);

      await this.#mwpDappClient.sendRequest({
        ...message,
        version: QrSyncMessageVersion.V1,
      });
    } catch (error) {
      log.error(
        'QrSyncController: failed to send message',
        message.type,
        error,
      );
      throw new Error(QrSyncErrorMessages.SYNC_FAILED_TO_SEND_MESSAGE);
    }
  }

  async #notifyPeerCancel(): Promise<void> {
    if (!this.#mwpDappClient) {
      return;
    }

    try {
      await this.#sendMessage({
        type: QrSyncActionTypes.SYNC_CANCEL,
      });
    } catch (error) {
      log.warn(
        'QrSyncController: failed to notify mobile of sync cancellation',
        error,
      );
    }
  }

  #unregisterClientEventHandlers(client: DappClient): void {
    if (!this.#clientEventHandlers) {
      return;
    }

    const removeHandler =
      client.off?.bind(client) ?? client.removeListener?.bind(client);

    if (removeHandler) {
      removeHandler(
        'session_request',
        this.#clientEventHandlers.sessionRequest,
      );
      removeHandler('message', this.#clientEventHandlers.message);
      removeHandler('otp_required', this.#clientEventHandlers.otpRequired);
      removeHandler('connected', this.#clientEventHandlers.connected);
      removeHandler('disconnected', this.#clientEventHandlers.disconnected);
      removeHandler('error', this.#clientEventHandlers.error);
    }

    this.#clientEventHandlers = null;
  }
}
