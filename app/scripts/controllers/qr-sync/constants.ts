export const QR_SYNC_CONTROLLER_NAME = 'QrSyncController' as const;

export const RELAY_URL =
  'wss://mm-sdk-relay.api.cx.metamask.io/connection/websocket';

export enum QrSyncMessageVersion {
  V1 = '1.0.0',
}

export const QrSyncActionTypes = {
  /**
   * Init Sync Session
   *
   * This action is used to initialize a sync session by
   * sending the initial payload to the Mobile Wallet Client via the WebSocket.
   *
   * @type {string}
   */
  INIT_SYNC_SESSION: 'init-sync-session',

  /**
   * OTP Display Grant
   *
   * This action is used by the **EXTENSION** to request the connected mobile wallet client to display an OTP.
   * The mobile wallet client will only then display the OTP and user will have to enter the OTP
   * in the extension to complete the sync session establishment.
   *
   * @type {string}
   */
  OTP_DISPLAY_GRANT: 'otp-display-grant',

  /**
   * Sync Offer
   *
   * This action is used by **MOBILE** to send the sync offer to the extension via the WebSocket.
   * Upon receiving the sync offer, the extension will show the available accounts to the user to begin the sync.
   *
   * @type {string}
   */
  SYNC_OFFER: 'sync-offer',

  /**
   * Sync Ready
   *
   * This action is used by **EXTENSION** to notify the connected mobile wallet client that the sync is ready to begin.
   * Additionally, the extension will also send the SyncAccountData to the mobile wallet client.
   *
   * @type {string}
   */
  SYNC_READY: 'sync-ready',

  /**
   * Sync Completed
   *
   * This action is used by **MOBILE** to notify the extension that the sync has been completed.
   *
   * @type {string}
   */
  SYNC_COMPLETED: 'sync-completed',

  /**
   * Sync Cancel
   *
   * This action is used by the **EXTENSION** to notify the connected mobile wallet client
   * that the user cancelled the sync session.
   *
   * @type {string}
   */
  SYNC_CANCEL: 'sync-cancel',

  /**
   * Sync Error
   *
   * This action is used to notify the any participant that the sync has encountered an error.
   * Both mobile and extension can send this action.
   *
   * @type {string}
   */
  SYNC_ERROR: 'sync-error',
};

export const QrSyncConnectionStatus = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ERRORED: 'errored',
} as const;

export const QrSyncErrorMessages = {
  SYNC_FAILED_TO_INITIALIZE: 'Failed to initialize the sync session',
  SYNC_FAILED_TO_CREATE_SESSION: 'Failed to create the sync session',
  SYNC_COMPLETION_TIMED_OUT: 'Sync completion timed out',
  SYNC_COMPLETION_FAILED: 'Sync completion failed',
  SYNC_OFFER_TIMED_OUT: 'Sync offer timed out',
  SYNC_OFFER_FAILED: 'Sync offer failed',
  SYNC_SESSION_ENDED_BEFORE_COMPLETION: 'Sync session ended before completion',
  SYNC_SESSION_ENDED_BEFORE_SYNC_OFFER: 'Sync session ended before sync offer',
  SYNC_SESSION_ENCOUNTERED_ERROR: 'The sync session encountered an error.',
  OTP_VALIDATION_FAILED: 'Failed to validate OTP',
  SYNC_SESSION_CANCELLED_BY_PEER: 'Sync session cancelled by peer',
  SYNC_FAILED_TO_SEND_MESSAGE: 'Failed to send message to mobile wallet client',
  PREMATURE_SYNC_OFFER_RECEIVED: 'Premature sync offer received',
} as const;
