import type { QrSyncControllerState } from './types';
import type { StateMetadata } from "@metamask/base-controller";

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
  otpRequired: {
    persist: false,
    includeInDebugSnapshot: true,
    usedInUi: true,
    includeInStateLogs: true,
  },
  otpAttempts: {
    persist: false,
    includeInDebugSnapshot: true,
    usedInUi: true,
    includeInStateLogs: true,
  },
  otpValidated: {
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
  isSubmitting: {
    persist: false,
    includeInDebugSnapshot: true,
    usedInUi: true,
    includeInStateLogs: true,
  },
  canCancel: {
    persist: false,
    includeInDebugSnapshot: true,
    usedInUi: true,
    includeInStateLogs: true,
  },
  canRetry: {
    persist: false,
    includeInDebugSnapshot: true,
    usedInUi: true,
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
  'initialize',
  'createSession',
  'grantOtpDisplay',
  'submitOtp',
  'selectAccounts',
  'sendSyncData',
  'cancelSync',
  'retryConnection',
  'acknowledgeCompletion',
  'dismissError',
  'resetState',
] as const;

export function getDefaultQrSyncControllerState(): QrSyncControllerState {
  return {
    phase: 'idle',
    connectionStatus: 'disconnected',
    sessionId: null,
    createdAt: null,
    updatedAt: null,
    expiresAt: null,
    qrPayload: null,
    otpRequired: false,
    otpAttempts: 0,
    otpValidated: false,
    syncOffer: null,
    selectedAccountIds: [],
    selectedSyncDataType: null,
    lastActionType: null,
    isSubmitting: false,
    canCancel: false,
    canRetry: false,
    importedAccountIds: [],
    error: null,
  };
}
