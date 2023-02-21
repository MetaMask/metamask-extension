///: BEGIN:ONLY_INCLUDE_IN(flask)
import type { SupportedCurve } from '@metamask/key-tree';

type SnapsMetadata = {
  [snapId: string]: {
    name: string;
  };
};

// If a Snap ID is present in this object, its metadata is used before the info
// of the snap is fetched. Ideally this information would be fetched from the
// snap registry, but this is a temporary solution.
export const SNAPS_METADATA: SnapsMetadata = {
  'npm:@metamask/test-snap-error': {
    name: 'Error Test Snap',
  },
  'npm:@metamask/test-snap-confirm': {
    name: 'Confirm Test Snap',
  },
  'npm:@metamask/test-snap-dialog': {
    name: 'Dialog Test Snap',
  },
  'npm:@metamask/test-snap-bip44': {
    name: 'BIP-44 Test Snap',
  },
  'npm:@metamask/test-snap-managestate': {
    name: 'Manage State Test Snap',
  },
  'npm:@metamask/test-snap-notification': {
    name: 'Notification Test Snap',
  },
  'npm:@metamask/test-snap-bip32': {
    name: 'BIP-32 Test Snap',
  },
  'npm:@metamask/test-snap-insights': {
    name: 'Insights Test Snap',
  },
  'npm:@metamask/test-snap-rpc': {
    name: 'RPC Test Snap',
  },
  'npm:@metamask/test-snap-cronjob': {
    name: 'Cronjob Test Snap',
  },
};

type SnapsDerivationPath = {
  path: ['m', ...string[]];
  curve: SupportedCurve;
  name: string;
};

export const SNAPS_DERIVATION_PATHS: SnapsDerivationPath[] = [
  {
    path: ['m', `44'`, `0'`],
    curve: 'secp256k1',
    name: 'Test BIP-32 Path (secp256k1)',
  },
  {
    path: ['m', `44'`, `0'`],
    curve: 'ed25519',
    name: 'Test BIP-32 Path (ed25519)',
  },
];
///: END:ONLY_INCLUDE_IN
