// BEGIN:ONLY_INCLUDE_IF(build-flask)
// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import AccountWatcherSnap from '@metamask/account-watcher/dist/preinstalled-snap.json';
import type { SnapId } from '@metamask/snaps-sdk';

export const ACCOUNT_WATCHER_SNAP_ID: SnapId =
  AccountWatcherSnap.snapId as SnapId;

export const ACCOUNT_WATCHER_NAME: string =
  AccountWatcherSnap.manifest.proposedName;
// END:ONLY_INCLUDE_IF
