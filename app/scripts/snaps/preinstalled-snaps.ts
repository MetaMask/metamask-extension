import type { PreinstalledSnap } from '@metamask/snaps-controllers';
import MessageSigningSnap from '@metamask/message-signing-snap/dist/preinstalled-snap.json';
import BitcoinManagerSnap from '@consensys/bitcoin-manager-snap/dist/preinstalled-snap.json';

const PREINSTALLED_SNAPS: readonly PreinstalledSnap[] = Object.freeze([
  MessageSigningSnap as PreinstalledSnap,
  BitcoinManagerSnap as PreinstalledSnap,
]);

export default PREINSTALLED_SNAPS;
