// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import InstitutionalWalletSnap from '@metamask/institutional-wallet-snap/dist/preinstalled-snap.json';
import type { SnapId } from '@metamask/snaps-sdk';

export const INSTITUTIONAL_WALLET_SNAP_ID: SnapId =
  InstitutionalWalletSnap.snapId as SnapId;

export const INSTITUTIONAL_WALLET_NAME: string =
  InstitutionalWalletSnap.manifest.proposedName;
