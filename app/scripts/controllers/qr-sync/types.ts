import type { AccountGroupId } from '@metamask/account-api';
import type {
  AccountTreeControllerGetAccountGroupObjectAction,
  AccountTreeControllerGetAccountWalletObjectAction,
} from '@metamask/account-tree-controller';
import type { AccountsControllerGetAccountAction } from '@metamask/accounts-controller';
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
import type { QrSyncController } from './qr-sync-controller';
import type { KeyManager } from './key-manager';
import {
  QR_SYNC_CONTROLLER_NAME,
  QrSyncActionTypes,
  QrSyncMessageVersion,
} from './constants';
import {
  QR_SYNC_CONTROLLER_NAME,
  QrSyncActionTypes,
  QrSyncMessageVersion,
} from './constants';

export type QrSyncConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'errored';

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
};

/**
 * Metadata for a single HD account group within a mnemonic wallet export.
 *
 * Boolean flags (`hidden`, `pinned`) are omitted when `false`.
 */
export type AccountGroupExport = {
  /**
   * The account group index within the HD wallet (Account 1 = 0).
   *
   * @type {number}
   */
  groupIndex: number;
  /**
   * The display name of the account group.
   *
   * @type {string}
   */
  name?: string;
  /**
   * Whether the account group is hidden in the UI.
   *
   * @type {boolean}
   */
  hidden?: boolean;
  /**
   * Whether the account group is pinned in the UI.
   *
   * @type {boolean}
   */
  pinned?: boolean;
};

/**
 * Mnemonic wallet entry in a sync-ready export bundle.
 */
export type MnemonicWalletExport = {
  /**
   * The wallet entry type.
   *
   * @type {'Mnemonic'}
   */
  type: 'Mnemonic';
  /**
   * Base64-encoded UTF-8 string of the space-separated BIP-39 mnemonic words
   * (not wordlist indices).
   *
   * @type {string}
   */
  mnemonic: string;
  /**
   * The display name of the wallet.
   *
   * @type {string}
   */
  name?: string;
  /**
   * Whether this wallet is the primary SRP wallet.
   *
   * @type {boolean}
   */
  isPrimary?: boolean;
  /**
   * The account groups to restore for this wallet.
   *
   * @type {AccountGroupExport[]}
   */
  groups: AccountGroupExport[];
};

/**
 * Imported private-key account entry in a sync-ready export bundle.
 *
 * Boolean flags (`hidden`, `pinned`) are omitted when `false`.
 */
export type PrivateKeyAccountExport = {
  /**
   * The wallet entry type.
   *
   * @type {'PrivateKey'}
   */
  type: 'PrivateKey';
  /**
   * Base64-encoded UTF-8 string of the hex private key (e.g. base64("0xabc…"),
   * not raw bytes).
   *
   * @type {string}
   */
  privateKey: string;
  /**
   * The display name of the imported account.
   *
   * Private Key accounts are not synced to the profile service and are not
   * discovered by the account discovery service. Therefore, to sync the
   * private key account name in mobile, we need to provide it here.
   *
   * @type {string}
   */
  name?: string;
  /**
   * Whether the imported account is hidden in the UI.
   *
   * @type {boolean}
   */
  hidden?: boolean;
  /**
   * Whether the imported account is pinned in the UI.
   *
   * @type {boolean}
   */
  pinned?: boolean;
};

/**
 * A single wallet or imported account entry in a sync-ready export bundle.
 */
export type WalletExportEntry =
  | MnemonicWalletExport
  | PrivateKeyAccountExport;

/**
 * Wallet export entries sent in the `sync-ready` message `data` field.
 *
 * The MWP envelope is
 * `{ type: 'sync-ready', version: '1.0.0', deadline, data: QrSyncReadyData }`.
 */
export type QrSyncReadyData = WalletExportEntry[];

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
   * @type {QrSyncConnectionStatus}
   */
  qrSyncConnectionStatus: QrSyncConnectionStatus;
  /**
   * Current session ID.
   */
  qrSyncSessionId: string | null;
  /**
   * The QR payload to be displayed to the user.
   *
   * @type {string | null}
   */
  qrPayload: string | null;
  /**
   * The number of OTP attempts.
   */
  otpAttempts: number;
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
  selectedAccountGroupIds: AccountGroupId[];
  /**
   * The last action type sent or received during the sync session.
   *
   * @type {QrSyncActionType | null}
   */
  lastActionType: QrSyncActionType | null;
  /**
   * Account IDs imported on the receiving device after sync completes.
   *
   * @type {string[]}
   */
  importedAccountIds: string[];
  /**
   * The current sync error, if any.
   *
   * @type {QrSyncError | null}
   */
  error: QrSyncError | null;
  /**
   * Timestamp when the sync session was created.
   *
   * @type {number | null}
   */
  createdAt: number | null;
  /**
   * Timestamp when the sync session state was last updated.
   *
   * @type {number | null}
   */
  updatedAt: number | null;
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
  | KeyringControllerExportAccountAction
  | AccountTreeControllerGetAccountGroupObjectAction
  | AccountTreeControllerGetAccountWalletObjectAction
  | AccountsControllerGetAccountAction;

export type QrSyncControllerMessenger = Messenger<
  typeof QR_SYNC_CONTROLLER_NAME,
  QrSyncAllowedActions,
  QrSyncControllerEvents
>;
