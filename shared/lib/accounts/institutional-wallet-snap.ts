import InstitutionalWalletSnap from '@metamask/institutional-wallet-snap/dist/preinstalled-snap.json';
import type { SnapId } from '@metamask/snaps-sdk';

export const INSTITUTIONAL_WALLET_SNAP_ID: SnapId =
  InstitutionalWalletSnap.snapId as SnapId;

export const INSTITUTIONAL_WALLET_NAME: string =
  InstitutionalWalletSnap.manifest.proposedName;
