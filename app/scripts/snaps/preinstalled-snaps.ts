import type { PreinstalledSnap } from '@metamask/snaps-controllers';

// TODO - use the new version of the snap (once released), it should have this file.
// Interim - build the snap locally (using `yarn build:clean`) and copy/paste this file & update the snap package.json exports to match.
import MessageSigningSnap from '@metamask/message-signing-snap/dist/preinstalled-snap.json';

const PREINSTALLED_SNAPS = Object.freeze<PreinstalledSnap[]>([
  MessageSigningSnap as PreinstalledSnap,
]);

export default PREINSTALLED_SNAPS;

// TODO - this is for testing purposes
console.log({ PREINSTALLED_SNAPS });
