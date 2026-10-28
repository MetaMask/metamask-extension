import type { AccountGroupId } from '@metamask/account-api';
import type {
  ControllerGetStateAction,
  ControllerStateChangedEvent,
} from '@metamask/base-controller';
import type { Messenger } from '@metamask/messenger';

import {
  AccountTreeControllerExportStateAction,
  type AccountTreePayload,
} from '@metamask/account-tree-controller';
import type { QrSyncPhase } from '../../../../shared/constants/qr-sync';
import { QrSyncErrorCodes } from '../../../../shared/constants/qr-sync';
import type { KeyManager } from './key-manager';
import {
  QR_SYNC_CONTROLLER_NAME,
  QrSyncActionTypes,
  QrSyncConnectionStatus,
  QrSyncMessageVersion,
} from './constants';
import type { QrSyncController } from './qr-sync-controller';

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
  /**
   * Expiry timestamp for time-bound messages such as `sync-ready`.
   *
   * @type {number}
   */
  deadline?: number;
  data?: DataType;
};

export type QrSyncOffer = {
  /**
   * Whether onboarding has been completed on the receiving mobile device.
   *
   * @type {boolean}
   */
  isOnboardingCompleted: boolean;
  /**
   * Optional session identifier from the mobile sync offer.
   *
   * @type {string}
   */
  sessionId: string;
};

export type QrSyncErrorCodeType =
  (typeof QrSyncErrorCodes)[keyof typeof QrSyncErrorCodes];

export type QrSyncError = {
  code: QrSyncErrorCodeType;
  message: string;
};

/**
 * Wallet snapshot sent in the `sync-ready` message `data` field.
 *
 * The MWP envelope is
 * `{ type: 'sync-ready', version: '1.0.0', deadline, data: QrSyncReadyData }`.
 */
export type QrSyncReadyData = AccountTreePayload;

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
  /**
   * The sync offer received from mobile.
   *
   * @type {QrSyncOffer | null}
   */
  syncOffer: QrSyncOffer | null;
  /**
   * Account group IDs the user chose to sync.
   *
   * @type {AccountGroupId[]}
   */
  qrSyncSelectedAccountGroupIds: AccountGroupId[];
  /**
   * The current sync error, if any.
   *
   * @type {QrSyncError | null}
   */
  qrSyncError: QrSyncError | null;
  /**
   * Timestamp when the sync session was created.
   *
   * @type {number | null}
   */
  qrSyncCreatedAt: number | null;
  /**
   * Timestamp when the sync session state was last updated.
   *
   * @type {number | null}
   */
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
  | AccountTreeControllerExportStateAction;

export type QrSyncControllerMessenger = Messenger<
  typeof QR_SYNC_CONTROLLER_NAME,
  QrSyncAllowedActions,
  QrSyncControllerEvents
>;
