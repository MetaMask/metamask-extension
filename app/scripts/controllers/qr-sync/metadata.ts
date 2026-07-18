import type { StateMetadata } from '@metamask/base-controller';
import { QR_SYNC_PHASES } from '../../../../shared/constants/qr-sync';
import type { QrSyncControllerState } from './types';
import { QrSyncConnectionStatus } from './constants';

export const controllerMetadata: StateMetadata<QrSyncControllerState> = {
  qrSyncPhase: {
    persist: false,
    includeInDebugSnapshot: false,
    usedInUi: true,
    includeInStateLogs: false,
  },
  qrSyncConnectionStatus: {
    persist: false,
    includeInDebugSnapshot: false,
    usedInUi: true,
    includeInStateLogs: false,
  },
  qrSyncSessionId: {
    persist: false,
    includeInDebugSnapshot: false,
    usedInUi: false,
    includeInStateLogs: false,
  },
  qrSyncCreatedAt: {
    persist: false,
    includeInDebugSnapshot: false,
    usedInUi: false,
    includeInStateLogs: false,
  },
  qrSyncUpdatedAt: {
    persist: false,
    includeInDebugSnapshot: false,
    usedInUi: false,
    includeInStateLogs: false,
  },
  qrSyncQrPayload: {
    persist: false,
    includeInDebugSnapshot: false,
    usedInUi: true,
    includeInStateLogs: false,
  },
  syncOffer: {
    persist: false,
    includeInDebugSnapshot: false,
    usedInUi: false,
    includeInStateLogs: false,
  },
  qrSyncSelectedAccountIds: {
    persist: false,
    includeInDebugSnapshot: false,
    usedInUi: false,
    includeInStateLogs: false,
  },
  qrSyncImportedAccountIds: {
    persist: false,
    includeInDebugSnapshot: false,
    usedInUi: false,
    includeInStateLogs: false,
  },
  qrSyncError: {
    persist: false,
    includeInDebugSnapshot: false,
    usedInUi: true,
    includeInStateLogs: false,
  },
};

export const MESSENGER_EXPOSED_METHODS = [
  'createSession',
  'submitOtp',
  'cancelOtp',
  'syncAccounts',
  'cancelSync',
  'resetState',
] as const;

export function getDefaultQrSyncControllerState(): QrSyncControllerState {
  return {
    qrSyncPhase: QR_SYNC_PHASES.IDLE,
    qrSyncConnectionStatus: QrSyncConnectionStatus.DISCONNECTED,
    qrSyncSessionId: null,
    qrSyncCreatedAt: null,
    qrSyncUpdatedAt: null,
    qrSyncQrPayload: null,
    syncOffer: null,
    qrSyncSelectedAccountIds: [],
    qrSyncImportedAccountIds: [],
    qrSyncError: null,
  };
}

/** Flat state keys excluded from downloaded state logs. */
export const QR_SYNC_STATE_LOG_KEYS = Object.keys(
  getDefaultQrSyncControllerState(),
) as (keyof QrSyncControllerState)[];
