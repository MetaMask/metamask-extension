import { SnapId } from '@metamask/snaps-sdk';
// This dependency is still installed as part of the `package.json`, however
// the Snap is being pre-installed only for Flask build (for the moment).
import InstitutionalWalletSnap from '@metamask/institutional-wallet-snap/dist/preinstalled-snap.json';

export const INSTITUTIONAL_WALLET_SNAP_ID: SnapId =
  InstitutionalWalletSnap.snapId as SnapId;

export const INSTITUTIONAL_WALLET_NAME: string =
  InstitutionalWalletSnap.manifest.proposedName;
