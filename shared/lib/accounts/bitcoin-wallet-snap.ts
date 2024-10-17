import { SnapId } from '@metamask/snaps-sdk';
// This dependency is still installed as part of the `package.json`, however
// the Snap is being pre-installed only for Flask build (for the moment).
import BitcoinWalletSnap from '@metamask/bitcoin-wallet-snap/dist/preinstalled-snap.json';

// export const BITCOIN_WALLET_SNAP_ID: SnapId = 'local:http://localhost:8080';
export const BITCOIN_WALLET_SNAP_ID: SnapId =
  BitcoinWalletSnap.snapId as SnapId;

export const BITCOIN_WALLET_NAME: string =
  BitcoinWalletSnap.manifest.proposedName;
