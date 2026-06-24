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
import { KeyringType } from '@metamask/keyring-api/v2';
import { bytesToBase64, stringToBytes } from '@metamask/utils';

import log from 'loglevel';
import {
  QR_SYNC_PHASES,
  type QrSyncPhase,
} from '../../../../shared/constants/qr-sync';
import { convertEnglishWordlistIndicesToCodepoints } from '../../lib/util';
import { QR_SYNC_CONTROLLER_NAME, QrSyncActionTypes, QrSyncMessageVersion } from './constants';
import type { KeyManager } from './key-manager';
import {
  QrSyncMessage,
  type QrSyncControllerInitOptions,
  type QrSyncControllerMessenger,
  type QrSyncControllerState,
  type QrSyncData,
  type QrSyncError,
  type QrSyncOffer,
} from './types';
import { controllerMetadata, getDefaultQrSyncControllerState, MESSENGER_EXPOSED_METHODS } from './metadata';
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
      });
      throw error;
    } finally {
      this.#finishSubmission();
    }
  }

  async submitOtp(_otp: string): Promise<void> {
    this.#assertPhase([QR_SYNC_PHASES.AWAITING_OTP_INPUT]);
    const otp = _otp.trim();

    if (!this.#otpSubmitCallback) {
      throw new Error('OTP submit callback is not available.');
    }

    try {
      await this.#otpSubmitCallback(otp);

      this.update((state) => {
        state.otpAttempts += 1;
        state.phase = QR_SYNC_PHASES.AWAITING_SYNC_OFFER;
        state.updatedAt = Date.now();
      });
    } catch (error) {
      this.update((state) => {
        state.otpAttempts += 1;
        state.error = {
          code: 'OTP_INVALID',
          message:
            error instanceof Error ? error.message : 'Failed to validate OTP',
        };
        state.updatedAt = Date.now();
      });
      throw error;
    } finally {
      this.#finishSubmission();
    }
  }

  async syncAccounts(
    password: string,
    selectedEntropyIds: string[],
  ): Promise<void> {
    this.#assertPhase([QR_SYNC_PHASES.REVIEWING_SYNC_OFFER]);

    // TODO: The following logic should be replaced with `exportMetadata` from Accounts.
    const entropyIds = [...new Set(selectedEntropyIds)];
    if (entropyIds.length === 0) {
      throw new Error('At least one entropy source must be selected.');
    }

    const validatedEntropyIds = await Promise.all(
      entropyIds.map(async (entropyId) => {
        try {
          return (await this.messenger.call(
            'KeyringController:withKeyringV2',
            { id: entropyId },
            async ({ keyring, metadata }) => {
              return keyring.type === KeyringType.Hd ? metadata.id : null;
            },
          )) as string | null;
        } catch {
          return null;
        }
      }),
    );

    const availableEntropyIds = new Set(
      validatedEntropyIds.filter(
        (entropyId): entropyId is string => Boolean(entropyId),
      ),
    );
    // Across the app, the first HD keyring is treated as the primary SRP.
    const primaryEntropyId = (await this.messenger.call(
      'KeyringController:withKeyringV2',
      { type: KeyringType.Hd, index: 0 },
      async ({ metadata }) => metadata.id,
    )) as string | undefined;

    for (const entropyId of entropyIds) {
      if (!availableEntropyIds.has(entropyId)) {
        throw new Error(`Entropy source with ID "${entropyId}" not found.`);
      }
    }

    const syncData: QrSyncData = {
      data: await Promise.all(
        entropyIds.map(async (entropyId) => {
          const seedPhrase = await this.messenger.call(
            'KeyringController:exportSeedPhrase',
            { password },
            entropyId,
          );
          const encodedMnemonic = convertEnglishWordlistIndicesToCodepoints(seedPhrase);
          const b64EncodedMnemonic = bytesToBase64(encodedMnemonic);

          return {
            value: b64EncodedMnemonic,
            type: 'MNEMONIC',
            metadata: {
              hiddenIndexes: [],
              isPrimary: primaryEntropyId === entropyId,
            },
          };
        }),
      ),
      deadline: this.state.expiresAt ?? Date.now(),
    };

    this.update((state) => {
      state.selectedAccountIds = [...entropyIds];
      state.selectedSyncDataType = 'MNEMONIC';
      state.lastActionType = QrSyncActionTypes.SYNC_READY;
      state.error = null;
      state.updatedAt = Date.now();
    });

    await this.#sendSyncData(syncData);
  }

  async #initialize(): Promise<void> {
    if (this.#mwpDappClient && this.#transport && this.#sessionStore) {
      return;
    }

    this.update((state) => {
      state.connectionStatus = 'connecting';
      state.lastActionType = QrSyncActionTypes.INIT_SYNC_SESSION;
      state.error = null;
      state.updatedAt = Date.now();
      state.createdAt = state.createdAt ?? Date.now();
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
      this.#transitionPhase(this.state.phase, 'connected');
    } catch (error) {
      this.#setError({
        code: 'CHANNEL_INIT_FAILED',
        message:
          error instanceof Error ? error.message : 'Failed to initialize sync',
      });
      throw error;
    } finally {
      this.#finishSubmission();
    }
  }

  async #sendSyncData(syncData: QrSyncData): Promise<void> {
    this.#assertPhase([QR_SYNC_PHASES.REVIEWING_SYNC_OFFER]);

    await this.#sendMessage({
      type: QrSyncActionTypes.SYNC_READY,
      data: syncData,
    });

    this.update((state) => {
      state.phase = QR_SYNC_PHASES.AWAITING_SYNC_COMPLETION;
    });
    this.#finishSubmission();
  }

  async cancelOtp(reason?: string): Promise<void> {
    this.#assertPhase([QR_SYNC_PHASES.AWAITING_OTP_INPUT]);
    await this.#notifyPeerCancel();
    this.#cleanupSession({ cancelOtp: true });

    this.update((state) => {
      state.phase = QR_SYNC_PHASES.CANCELLED;
      state.lastActionType = QrSyncActionTypes.SYNC_CANCEL;
      state.updatedAt = Date.now();
      if (reason) {
        state.error = {
          code: 'SYNC_FAILED',
          message: reason,
        };
      }
    });
  }

  async cancelSync(reason?: string): Promise<void> {
    await this.#notifyPeerCancel();
    this.#cleanupSession({ cancelOtp: true });

    this.update((state) => {
      state.phase = QR_SYNC_PHASES.CANCELLED;
      state.lastActionType = QrSyncActionTypes.SYNC_CANCEL;
      state.updatedAt = Date.now();
      if (reason) {
        state.error = {
          code: 'SYNC_REJECTED',
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

  setSyncOffer(syncOffer: QrSyncOffer): void {
    this.update((state) => {
      state.syncOffer = syncOffer;
      state.phase = QR_SYNC_PHASES.REVIEWING_SYNC_OFFER;
      state.expiresAt = syncOffer.deadline;
      state.lastActionType = QrSyncActionTypes.SYNC_OFFER;
      state.updatedAt = Date.now();
    });
  }

  completeSync(importedAccountIds: string[]): void {
    this.update((state) => {
      state.phase = QR_SYNC_PHASES.COMPLETED;
      state.importedAccountIds = [...importedAccountIds];
      state.lastActionType = QrSyncActionTypes.SYNC_COMPLETED;
      state.updatedAt = Date.now();
    });

    this.#cleanupSession();
  }

  destroy(): void {
    this.#cleanupSession({ cancelOtp: true });
    super.destroy();
  }

  #generateInitialPayload(): QrSyncMessage {
    return {
      type: QrSyncActionTypes.INIT_SYNC_SESSION,
      version: QrSyncMessageVersion.V1,
    };
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
          code: 'OTP_INVALID',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to handle OTP requirement',
        });
      });
    };

    const connected = () => {
      log.debug('QrSyncController: connected to the sync channel');
      this.update((state) => {
        state.connectionStatus = 'connected';
        state.updatedAt = Date.now();
      });
    };

    const disconnected = () => {
      this.#setError({
        code: 'CHANNEL_DISCONNECTED',
        message: 'The sync channel disconnected.',
      });
    };

    const clientError = (error: Error) => {
      log.error('QrSyncController: error', error);
      this.#setError({
        code: 'UNKNOWN',
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
      state.sessionId = request.id;
      state.qrPayload = this.#generateQrCode(request);
      state.phase = QR_SYNC_PHASES.DISPLAYING_QR;
      state.connectionStatus = 'connecting';
      state.createdAt = state.createdAt ?? Date.now();
      state.updatedAt = Date.now();
      state.expiresAt = request.expiresAt;
      state.error = null;
    });
  }

  async #handleOtpRequired(payload: OtpRequiredPayload): Promise<void> {
    this.#otpSubmitCallback = payload.submit;
    this.#otpCancelCallback = payload.cancel;

    this.update((state) => {
      state.phase = QR_SYNC_PHASES.AWAITING_OTP_INPUT;
      state.updatedAt = Date.now();
      state.expiresAt = payload.deadline;
      state.lastActionType = QrSyncActionTypes.OTP_DISPLAY_GRANT;
      state.error = null;
    });

    // TODO: Implement OTP display grant on MWP SDK
    // await this.#sendMessage({
    //   type: QrSyncActionTypes.OTP_DISPLAY_GRANT,
    // });

    this.#finishSubmission();
  }

  #handleMessage(message: unknown): void {
    const parsedMessage = this.#normalizeMessage(message);

    if (!parsedMessage) {
      log.warn('QrSyncController: received invalid message payload', message);
      return;
    }

    switch (parsedMessage.type) {
      case QrSyncActionTypes.SYNC_OFFER:
        if (this.#isQrSyncOffer(parsedMessage.data)) {
          this.setSyncOffer(parsedMessage.data);
          return;
        }

        log.warn(
          'QrSyncController: received sync offer with invalid payload',
          parsedMessage,
        );
        return;

      case QrSyncActionTypes.SYNC_COMPLETED:
        this.completeSync(this.state.importedAccountIds);
        return;

      case QrSyncActionTypes.SYNC_CANCEL:
        this.#handlePeerCancel();
        return;

      case QrSyncActionTypes.SYNC_ERROR:
        this.#setError({
          code: 'SYNC_FAILED',
          message: (parsedMessage.data as { message?: string })?.message ?? 'The sync session encountered an error.',
        });
        return;

      default:
        log.debug(
          'QrSyncController: ignoring unsupported message type',
          parsedMessage.type,
        );
    }
  }

  #generateQrCode(request: SessionRequest): string {
    const base64QRpayload = bytesToBase64(
      stringToBytes(JSON.stringify(request)),
    );
    const qrData = `metamask://connect/mwp?p=${base64QRpayload}`;
    console.log('QrSyncController: qrData', qrData);
    return qrData;
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

  #normalizeMessage(message: unknown): QrSyncMessage<unknown> | null {
    const normalizedMessage = this.#parseJsonMessage(message);

    if (
      !normalizedMessage ||
      typeof normalizedMessage !== 'object' ||
      !('type' in normalizedMessage) ||
      typeof normalizedMessage.type !== 'string'
    ) {
      return null;
    }

    return normalizedMessage as QrSyncMessage<unknown>;
  }

  #parseJsonMessage(message: unknown): unknown {
    if (typeof message !== 'string') {
      return message;
    }

    try {
      return JSON.parse(message);
    } catch {
      return null;
    }
  }

  #isQrSyncOffer(value: unknown): value is QrSyncOffer {
    if (!value || typeof value !== 'object') {
      return false;
    }

    if (!('deadline' in value) || typeof value.deadline !== 'number') {
      return false;
    }

    return true;
  }

  #handlePeerCancel(): void {
    this.#cleanupSession({ cancelOtp: true });

    this.update((state) => {
      state.phase = QR_SYNC_PHASES.CANCELLED;
      state.connectionStatus = 'disconnected';
      state.lastActionType = QrSyncActionTypes.SYNC_CANCEL;
      state.error = {
        code: 'SYNC_REJECTED',
        message: 'Session cancelled by peer',
      };
      state.syncOffer = null;
      state.qrPayload = null;
      state.selectedAccountIds = [];
      state.selectedSyncDataType = null;
      state.updatedAt = Date.now();
    });
  }

  #finishSubmission(): void {
    this.update((state) => {
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
    this.#cleanupSession({ cancelOtp: true });

    this.update((state) => {
      state.phase = QR_SYNC_PHASES.FAILED;
      state.connectionStatus = 'errored';
      state.error = error;
      state.syncOffer = null;
      state.qrPayload = null;
      state.selectedAccountIds = [];
      state.selectedSyncDataType = null;
      state.updatedAt = Date.now();
    });
  }

  #cleanupSession({ cancelOtp = false }: { cancelOtp?: boolean } = {}): void {
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
      log.error('QrSyncController: failed to send message', message, error);
      throw new Error('Failed to send message to mobile wallet client');
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

    const removableClient = client as DappClient & {
      off?: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener?: (
        event: string,
        handler: (...args: unknown[]) => void,
      ) => void;
    };

    const removeHandler =
      removableClient.off?.bind(removableClient) ??
      removableClient.removeListener?.bind(removableClient);

    if (removeHandler) {
      removeHandler('session_request', this.#clientEventHandlers.sessionRequest);
      removeHandler('message', this.#clientEventHandlers.message);
      removeHandler('otp_required', this.#clientEventHandlers.otpRequired);
      removeHandler('connected', this.#clientEventHandlers.connected);
      removeHandler('disconnected', this.#clientEventHandlers.disconnected);
      removeHandler('error', this.#clientEventHandlers.error);
    }

    this.#clientEventHandlers = null;
  }
}
