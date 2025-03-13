// BEGIN:ONLY_INCLUDE_IF(build-flask)
import { SnapId } from '@metamask/snaps-sdk';
import AccountWatcherSnap from '@metamask/account-watcher/dist/preinstalled-snap.json';

export const ACCOUNT_WATCHER_SNAP_ID: SnapId =
  AccountWatcherSnap.snapId as SnapId;

export const ACCOUNT_WATCHER_NAME: string =
  AccountWatcherSnap.manifest.proposedName;
// END:ONLY_INCLUDE_IF
