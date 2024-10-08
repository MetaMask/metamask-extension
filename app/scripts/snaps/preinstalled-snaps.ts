import type { PreinstalledSnap } from '@metamask/snaps-controllers';
import MessageSigningSnap from '@metamask/message-signing-snap/dist/preinstalled-snap.json';
import EnsResolverSnap from '@metamask/ens-resolver-snap/dist/preinstalled-snap.json';
///: BEGIN:ONLY_INCLUDE_IF(build-flask)
import AccountWatcherSnap from '@metamask/account-watcher/dist/preinstalled-snap.json';
import BitcoinWalletSnap from '@metamask/bitcoin-wallet-snap/dist/preinstalled-snap.json';
import PreinstalledExampleSnap from '@metamask/preinstalled-example-snap/dist/preinstalled-snap.json';
///: END:ONLY_INCLUDE_IF

// The casts here are less than ideal but we expect the SnapController to validate the inputs.
const PREINSTALLED_SNAPS = Object.freeze<PreinstalledSnap[]>([
  MessageSigningSnap as PreinstalledSnap,
  EnsResolverSnap as PreinstalledSnap,
  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  AccountWatcherSnap as PreinstalledSnap,
  AccountWatcherSnap as PreinstalledSnap,
  BitcoinWalletSnap as unknown as PreinstalledSnap,
  PreinstalledExampleSnap as unknown as PreinstalledSnap,
  ///: END:ONLY_INCLUDE_IF
]);

export default PREINSTALLED_SNAPS;
