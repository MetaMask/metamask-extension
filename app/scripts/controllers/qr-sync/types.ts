import type {
  ControllerGetStateAction,
  ControllerStateChangedEvent,
} from '@metamask/base-controller';
import type {
  KeyringControllerExportAccountAction,
  KeyringControllerExportSeedPhraseAction,
  KeyringControllerGetStateAction,
  KeyringControllerWithKeyringV2Action,
} from '@metamask/keyring-controller';
import type { Messenger } from '@metamask/messenger';

import type { QrSyncPhase } from '../../../../shared/constants/qr-sync';
import { QrSyncErrorCodes } from '../../../../shared/constants/qr-sync';
import type { QrSyncController } from './qr-sync-controller';
import type { KeyManager } from './key-manager';
import {
  QR_SYNC_CONTROLLER_NAME,
  QrSyncActionTypes,
  QrSyncConnectionStatus,
  QrSyncMessageVersion,
} from './constants';

export type QrSyncConnectionStatusType =
  (typeof QrSyncConnectionStatus)[keyof typeof QrSyncConnectionStatus];

export type QrSyncControllerInitOptions = {
  keyManager: KeyManager;
  messenger: QrSyncControllerMessenger;
  relayUrl: string;
  state?: Partial<QrSyncControllerState>;
};

export type QrSyncActionType =
  (typeof QrSyncActionTypes)[keyof typeof QrSyncActionTypes];

/**
 * The message structure for the whole QR Sync session over Mobile Wallet Protocol relay.
 *
 * @type {object}
 */
export type QrSyncMessage<DataType = undefined> = {
  type: QrSyncActionType;
  version: QrSyncMessageVersion;
  data?: DataType;
};

export type SyncDataType = 'MNEMONIC' | 'PRIVATE_KEY';

export type QrSyncOffer = {
  sessionId: string;
  isOnboardingCompleted: boolean;
};

export type QrSyncErrorCodeType =
  (typeof QrSyncErrorCodes)[keyof typeof QrSyncErrorCodes];

export type QrSyncError = {
  code: QrSyncErrorCodeType;
  message: string;
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
      hiddenIndexes: number[];

      /**
       * Whether the wallet is the primary wallet.
       *
       * @type {boolean}
       */
      isPrimary?: boolean;
    };
  }[];

  /**
   * The deadline of the sync operation.
   *
   * @type {number}
   */
  deadline: number;
};

export type QrSyncControllerState = {
  /**
   * The current phase of the QR Sync process.
   *
   * @type {QrSyncPhase}
   */
  qrSyncPhase: QrSyncPhase;
  /**
   * The current connection status of the MWP protocol connection.
   *
   * @type {QrSyncConnectionStatusType}
   */
  qrSyncConnectionStatus: QrSyncConnectionStatusType;
  /**
   * Current session ID.
   */
  qrSyncSessionId: string | null;
  /**
   * The QR payload to be displayed to the user.
   *
   * @type {string | null}
   */
  qrSyncQrPayload: string | null;
  syncOffer: QrSyncOffer | null;
  qrSyncSelectedAccountIds: string[];
  qrSyncImportedAccountIds: string[];
  qrSyncError: QrSyncError | null;
  qrSyncCreatedAt: number | null;
  qrSyncUpdatedAt: number | null;
};

export type QrSyncControllerStateChangeEvent = ControllerStateChangedEvent<
  typeof QR_SYNC_CONTROLLER_NAME,
  QrSyncControllerState
>;

export type QrSyncControllerEvents = QrSyncControllerStateChangeEvent;

export type QrSyncControllerGetStateAction = ControllerGetStateAction<
  typeof QR_SYNC_CONTROLLER_NAME,
  QrSyncControllerState
>;

export type QrSyncControllerCreateSessionAction = {
  type: 'QrSyncController:createSession';
  handler: QrSyncController['createSession'];
};

export type QrSyncControllerSubmitOtpAction = {
  type: 'QrSyncController:submitOtp';
  handler: QrSyncController['submitOtp'];
};

export type QrSyncControllerCancelOtpAction = {
  type: 'QrSyncController:cancelOtp';
  handler: QrSyncController['cancelOtp'];
};

export type QrSyncControllerSyncAccountsAction = {
  type: 'QrSyncController:syncAccounts';
  handler: QrSyncController['syncAccounts'];
};

export type QrSyncControllerCancelSyncAction = {
  type: 'QrSyncController:cancelSync';
  handler: QrSyncController['cancelSync'];
};

export type QrSyncControllerResetStateAction = {
  type: 'QrSyncController:resetState';
  handler: QrSyncController['resetState'];
};

export type QrSyncControllerActions =
  | QrSyncControllerGetStateAction
  | QrSyncControllerCreateSessionAction
  | QrSyncControllerSubmitOtpAction
  | QrSyncControllerCancelOtpAction
  | QrSyncControllerSyncAccountsAction
  | QrSyncControllerCancelSyncAction
  | QrSyncControllerResetStateAction;

export type QrSyncAllowedActions =
  | QrSyncControllerActions
  | KeyringControllerGetStateAction
  | KeyringControllerWithKeyringV2Action
  | KeyringControllerExportSeedPhraseAction
  | KeyringControllerExportAccountAction;

export type QrSyncControllerMessenger = Messenger<
  typeof QR_SYNC_CONTROLLER_NAME,
  QrSyncAllowedActions,
  QrSyncControllerEvents
>;
