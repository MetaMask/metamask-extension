import { createSelector } from 'reselect';
// eslint-disable-next-line import-x/no-restricted-paths
import type { QrSyncControllerState } from '../../../app/scripts/controllers/qr-sync/types';
import {
  QR_SYNC_TERMINAL_PHASES,
  type QrSyncPhase,
} from '../../../shared/constants/qr-sync';

type AppState = {
  metamask: QrSyncControllerState;
};

const getMetamask = (state: AppState) => state.metamask;

export const selectQrSyncState = createSelector(
  [getMetamask],
  (metamask) => metamask,
);

export const selectQrSyncPhase = createSelector(
  [selectQrSyncState],
  (qrSyncState) => qrSyncState.qrSyncPhase,
);

export const selectQrSyncQrPayload = createSelector(
  [selectQrSyncState],
  (qrSyncState) => qrSyncState.qrSyncQrPayload,
);

export const selectQrSyncError = createSelector(
  [selectQrSyncState],
  (qrSyncState) => qrSyncState.qrSyncError,
);

export const selectIsQrSyncTerminal = createSelector(
  [selectQrSyncPhase],
  (phase) => {
    return QR_SYNC_TERMINAL_PHASES.includes(
      phase as (typeof QR_SYNC_TERMINAL_PHASES)[number],
    );
  },
);

export function isQrSyncPhase(
  phase: QrSyncPhase,
  expectedPhase: QrSyncPhase,
): boolean {
  return phase === expectedPhase;
}
