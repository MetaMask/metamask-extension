import type {
  ControllerGetStateAction,
  ControllerStateChangeEvent,
} from '@metamask/base-controller';
import type { IKVStore } from '@metamask/mobile-wallet-protocol-core';
import type { Messenger } from '@metamask/messenger';

import type { QrSyncController } from './qr-sync-controller';
import type { KeyManager } from './key-manager';
import { QR_SYNC_CONTROLLER_NAME, QrSyncActionTypes } from './constants';

export type QrSyncPhase =
  | 'idle'
  | 'initializing'
  | 'awaiting-connection'
  | 'displaying-qr'
  | 'awaiting-otp-display'
  | 'awaiting-otp-input'
  | 'validating-otp'
  | 'awaiting-sync-offer'
  | 'reviewing-sync-offer'
  | 'awaiting-user-selection'
  | 'sending-sync-ready'
  | 'awaiting-sync-completion'
  | 'completed'
  | 'cancelled'
  | 'failed';

export type QrSyncConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'errored';

export type QrSyncControllerInitOptions = {
  keyManager: KeyManager;
  messenger: QrSyncControllerMessenger;
  relayUrl: string;
  kvStore?: IKVStore;
  state?: Partial<QrSyncControllerState>;
};

export type QrSyncActionType =
  (typeof QrSyncActionTypes)[keyof typeof QrSyncActionTypes];

/**
 * The message structure for the whole QR Sync session.
 *
 * @type {object}
 */
export type QrSyncMessage<DataType = undefined> = {
  type: QrSyncActionType;
  version: string;
  data?: DataType;
};

export type SyncDataType = 'MNEMONIC' | 'PRIVATE_KEY';

export type QrSyncAccountCandidate = {
  id: string;
  address: string;
  name?: string;
  type: SyncDataType;
  metadata?: {
    accountName?: string;
    hiddenIdexes: number[];
  };
};

export type QrSyncOffer = {
  sessionId?: string;
  deadline: number;
  accounts: QrSyncAccountCandidate[];
};

export type QrSyncErrorCode =
  | 'CHANNEL_INIT_FAILED'
  | 'CHANNEL_DISCONNECTED'
  | 'SESSION_EXPIRED'
  | 'OTP_INVALID'
  | 'OTP_EXPIRED'
  | 'SYNC_REJECTED'
  | 'SYNC_FAILED'
  | 'UNKNOWN';

export type QrSyncError = {
  code: QrSyncErrorCode;
  message: string;
  retryable: boolean;
};

/**
 * The data payload for the sync action.
 * This is the data that is sent to the mobile wallet client.
 * The mobile will use this data to perform the sync operation.
 *
 * During the sync operation, this data is encrypted together with the parent payload. (i.e. `SYNC_READY` payload)
 *
 * @type {object}
 */
export type QrSyncData = {
  /**
   * The account/wallet data for the sync action.
   *
   * @type {object}
   */
  data: {
    /**
     * Base-64 encoded value of the account/wallet data.
     * This value could be SeedPhrase or Private Key.
     *
     * @type {string}
     */
    value: string;
    /**
     * The type of the account/wallet.
     *
     * @type {SyncDataType}
     */
    type: SyncDataType;
    /**
     * The metadata for the account/wallet.
     *
     * @type {object}
     */
    metadata?: {
      /**
       * The given name of the account.
       * This name is only required for the private key account.
       *
       * Private Key accounts are not synced to the profile service and are not discovered by the account discovery service.
       * Therefore, to sync the private key account name in mobile, we need to provide it here.
       *
       * @type {string}
       */
      accountName?: string;

      /**
       * The hidden indexes of the account group.
       * If users want to import the wallet with hidden accounts, they can provide the hidden indexes here.
       *
       * This could be useful for the case where the user wants to import the whole wallet,
       * but only wants to show a subset of the accounts to the user.
       *
       * @type {number[]}
       */
      hiddenIdexes: number[];

      /**
       * Whether the wallet is the primary wallet.
       *
       * @type {boolean}
       */
      isPrimary?: boolean;
    }
  }[];

  /**
   * The deadline of the sync operation.
   *
   * @type {number}
   */
  deadline: number;
};

export type QrSyncControllerState = {
  phase: QrSyncPhase;
  connectionStatus: QrSyncConnectionStatus;
  sessionId: string | null;
  createdAt: number | null;
  updatedAt: number | null;
  expiresAt: number | null;
  qrPayload: string | null;
  otpRequired: boolean;
  otpAttempts: number;
  otpValidated: boolean;
  syncOffer: QrSyncOffer | null;
  selectedAccountIds: string[];
  selectedSyncDataType: SyncDataType | null;
  lastActionType: QrSyncActionType | null;
  isSubmitting: boolean;
  canCancel: boolean;
  canRetry: boolean;
  importedAccountIds: string[];
  error: QrSyncError | null;
};

export type QrSyncControllerStateChangeEvent = ControllerStateChangeEvent<
  typeof QR_SYNC_CONTROLLER_NAME,
  QrSyncControllerState
>;

export type QrSyncControllerSyncCompletedEvent = {
  type: 'QrSyncController:syncCompleted';
  payload: [
    {
      sessionId: string | null;
      importedAccountIds: string[];
    },
  ];
};

export type QrSyncControllerChannelDisconnectedEvent = {
  type: 'QrSyncController:channelDisconnected';
  payload: [
    {
      sessionId: string | null;
      retryable: boolean;
    },
  ];
};

export type QrSyncControllerEvents =
  | QrSyncControllerStateChangeEvent
  | QrSyncControllerSyncCompletedEvent
  | QrSyncControllerChannelDisconnectedEvent;

export type QrSyncControllerGetStateAction = ControllerGetStateAction<
  typeof QR_SYNC_CONTROLLER_NAME,
  QrSyncControllerState
>;

export type QrSyncControllerInitializeAction = {
  type: 'QrSyncController:initialize';
  handler: QrSyncController['initialize'];
};

export type QrSyncControllerCreateSessionAction = {
  type: 'QrSyncController:createSession';
  handler: QrSyncController['createSession'];
};

export type QrSyncControllerGrantOtpDisplayAction = {
  type: 'QrSyncController:grantOtpDisplay';
  handler: QrSyncController['grantOtpDisplay'];
};

export type QrSyncControllerSubmitOtpAction = {
  type: 'QrSyncController:submitOtp';
  handler: QrSyncController['submitOtp'];
};

export type QrSyncControllerSelectAccountsAction = {
  type: 'QrSyncController:selectAccounts';
  handler: QrSyncController['selectAccounts'];
};

export type QrSyncControllerSendSyncDataAction = {
  type: 'QrSyncController:sendSyncData';
  handler: QrSyncController['sendSyncData'];
};

export type QrSyncControllerCancelSyncAction = {
  type: 'QrSyncController:cancelSync';
  handler: QrSyncController['cancelSync'];
};

export type QrSyncControllerRetryConnectionAction = {
  type: 'QrSyncController:retryConnection';
  handler: QrSyncController['retryConnection'];
};

export type QrSyncControllerAcknowledgeCompletionAction = {
  type: 'QrSyncController:acknowledgeCompletion';
  handler: QrSyncController['acknowledgeCompletion'];
};

export type QrSyncControllerDismissErrorAction = {
  type: 'QrSyncController:dismissError';
  handler: QrSyncController['dismissError'];
};

export type QrSyncControllerResetStateAction = {
  type: 'QrSyncController:resetState';
  handler: QrSyncController['resetState'];
};

export type QrSyncControllerActions =
  | QrSyncControllerGetStateAction
  | QrSyncControllerInitializeAction
  | QrSyncControllerCreateSessionAction
  | QrSyncControllerGrantOtpDisplayAction
  | QrSyncControllerSubmitOtpAction
  | QrSyncControllerSelectAccountsAction
  | QrSyncControllerSendSyncDataAction
  | QrSyncControllerCancelSyncAction
  | QrSyncControllerRetryConnectionAction
  | QrSyncControllerAcknowledgeCompletionAction
  | QrSyncControllerDismissErrorAction
  | QrSyncControllerResetStateAction;

export type QrSyncControllerMessenger = Messenger<
  typeof QR_SYNC_CONTROLLER_NAME,
  QrSyncControllerActions,
  QrSyncControllerEvents
>;
