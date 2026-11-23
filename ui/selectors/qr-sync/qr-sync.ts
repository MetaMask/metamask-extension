import { createSelector } from 'reselect';
// eslint-disable-next-line import-x/no-restricted-paths
import type { QrSyncControllerState } from '../../../app/scripts/controllers/qr-sync/types';

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
