import { SnapId } from '@metamask/snaps-sdk';
// This dependency is still installed as part of the `package.json`, however
// the Snap is being pre-installed only for Flask build (for the moment).
import SolanaWalletSnap from '@metamask/solana-wallet-snap/dist/preinstalled-snap.json';

// export const SOLANA_WALLET_SNAP_ID: SnapId = SolanaWalletSnap.snapId as SnapId;
export const SOLANA_WALLET_SNAP_ID: SnapId =
  'local:http://localhost:8080' as SnapId;

export const SOLANA_WALLET_NAME: string =
  SolanaWalletSnap.manifest.proposedName;
