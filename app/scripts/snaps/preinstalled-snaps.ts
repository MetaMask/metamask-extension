import type { PreinstalledSnap } from '@metamask/snaps-controllers';
import MessageSigningSnap from '@metamask/message-signing-snap/dist/preinstalled-snap.json';
import AccountWatcherSnap from './account-watcher-test-preinstalled-snap.json';

const PREINSTALLED_SNAPS: readonly PreinstalledSnap[] = Object.freeze([
  MessageSigningSnap as PreinstalledSnap,
  AccountWatcherSnap as PreinstalledSnap,
]);

export default PREINSTALLED_SNAPS;
