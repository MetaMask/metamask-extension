import type { StateMetadata } from "@metamask/base-controller";
import { QR_SYNC_PHASES } from '../../../../shared/constants/qr-sync';
import type { QrSyncControllerState } from './types';

export const controllerMetadata: StateMetadata<QrSyncControllerState> = {
  phase: {
    persist: false,
    includeInDebugSnapshot: true,
    usedInUi: true,
    includeInStateLogs: true,
  },
  connectionStatus: {
    persist: false,
    includeInDebugSnapshot: true,
    usedInUi: true,
    includeInStateLogs: true,
  },
  sessionId: {
    persist: false,
    includeInDebugSnapshot: true,
    usedInUi: false,
    includeInStateLogs: false,
  },
  createdAt: {
    persist: false,
    includeInDebugSnapshot: true,
    usedInUi: false,
    includeInStateLogs: true,
  },
  updatedAt: {
    persist: false,
    includeInDebugSnapshot: true,
    usedInUi: false,
    includeInStateLogs: true,
  },
  expiresAt: {
    persist: false,
    includeInDebugSnapshot: true,
    usedInUi: true,
    includeInStateLogs: true,
  },
  qrPayload: {
    persist: false,
    includeInDebugSnapshot: false,
    usedInUi: true,
    includeInStateLogs: false,
  },
  otpAttempts: {
    persist: false,
    includeInDebugSnapshot: true,
    usedInUi: true,
    includeInStateLogs: true,
  },
  syncOffer: {
    persist: false,
    includeInDebugSnapshot: true,
    usedInUi: true,
    includeInStateLogs: true,
  },
  selectedAccountIds: {
    persist: false,
    includeInDebugSnapshot: true,
    usedInUi: true,
    includeInStateLogs: true,
  },
  selectedSyncDataType: {
    persist: false,
    includeInDebugSnapshot: true,
    usedInUi: true,
    includeInStateLogs: true,
  },
  lastActionType: {
    persist: false,
    includeInDebugSnapshot: true,
    usedInUi: false,
    includeInStateLogs: true,
  },
  importedAccountIds: {
    persist: false,
    includeInDebugSnapshot: true,
    usedInUi: true,
    includeInStateLogs: true,
  },
  error: {
    persist: false,
    includeInDebugSnapshot: true,
    usedInUi: true,
    includeInStateLogs: true,
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
    phase: QR_SYNC_PHASES.IDLE,
    connectionStatus: 'disconnected',
    sessionId: null,
    createdAt: null,
    updatedAt: null,
    expiresAt: null,
    qrPayload: null,
    otpAttempts: 0,
    syncOffer: null,
    selectedAccountIds: [],
    selectedSyncDataType: null,
    lastActionType: null,
    importedAccountIds: [],
    error: null,
  };
}
