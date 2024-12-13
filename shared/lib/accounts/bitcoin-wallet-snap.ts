import { SnapId } from '@metamask/snaps-sdk';
// This dependency is still installed as part of the `package.json`, however
// the Snap is being pre-installed only for Flask build (for the moment).
import BitcoinWalletSnap from '../../../app/scripts/snaps/snap-bitcoin-wallet-preinstalled-snap.json';

export const BITCOIN_WALLET_SNAP_ID: SnapId =
  BitcoinWalletSnap.snapId as SnapId;

export const BITCOIN_WALLET_NAME: string =
  BitcoinWalletSnap.manifest.proposedName;
