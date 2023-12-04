///: BEGIN:ONLY_INCLUDE_IF(snaps)
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
    curve: 'ed25519',
    name: 'Test BIP-32 Path (ed25519)',
  },
  {
    path: ['m', `44'`, `1'`],
    curve: 'secp256k1',
    name: 'Testnet',
  },
  {
    path: ['m', `44'`, `0'`],
    curve: 'secp256k1',
    name: 'Bitcoin Legacy',
  },
  {
    path: ['m', `49'`, `0'`],
    curve: 'secp256k1',
    name: 'Bitcoin Nested SegWit',
  },
  {
    path: ['m', `49'`, `1'`],
    curve: 'secp256k1',
    name: 'Bitcoin Testnet Nested SegWit',
  },
  {
    path: ['m', `84'`, `0'`],
    curve: 'secp256k1',
    name: 'Bitcoin Native SegWit',
  },
  {
    path: ['m', `84'`, `1'`],
    curve: 'secp256k1',
    name: 'Bitcoin Testnet Native SegWit',
  },
  {
    path: ['m', `44'`, `501'`],
    curve: 'ed25519',
    name: 'Solana',
  },
  {
    path: ['m', `44'`, `501'`, "0'", "0'"],
    curve: 'ed25519',
    name: 'Solana',
  },
  {
    path: ['m', `44'`, `2'`],
    curve: 'secp256k1',
    name: 'Litecoin',
  },
  {
    path: ['m', `44'`, `3'`],
    curve: 'secp256k1',
    name: 'Dogecoin',
  },
  {
    path: ['m', `44'`, `60'`],
    curve: 'secp256k1',
    name: 'Ethereum',
  },
  {
    path: ['m', `44'`, `118'`],
    curve: 'secp256k1',
    name: 'Atom',
  },
  {
    path: ['m', `44'`, `145'`],
    curve: 'secp256k1',
    name: 'Bitcoin Cash',
  },
  {
    path: ['m', `44'`, `637'`],
    curve: 'ed25519',
    name: 'Aptos',
  },
  {
    path: ['m', `44'`, `714'`],
    curve: 'secp256k1',
    name: 'Binance (BNB)',
  },
  {
    path: ['m', `44'`, `784'`],
    curve: 'ed25519',
    name: 'Sui',
  },
  {
    path: ['m', `44'`, `931'`],
    curve: 'secp256k1',
    name: 'THORChain (RUNE)',
  },
  {
    path: ['m', `44'`, `330'`],
    curve: 'secp256k1',
    name: 'Terra (LUNA)',
  },
  {
    path: ['m', `44'`, `459'`],
    curve: 'secp256k1',
    name: 'Kava',
  },
  {
    path: ['m', `44'`, `529'`],
    curve: 'secp256k1',
    name: 'Secret Network',
  },
  {
    path: ['m', `44'`, `397'`, `0'`],
    curve: 'ed25519',
    name: 'NEAR Protocol',
  },
  {
    path: ['m', `44'`, `1'`, `0'`],
    curve: 'ed25519',
    name: 'Testnet',
  },
  {
    path: ['m', `44'`, `472'`],
    curve: 'ed25519',
    name: 'Arweave',
  },
  {
    path: ['m', `44'`, `12586'`],
    curve: 'secp256k1',
    name: 'Mina',
  },
  {
    path: ['m', `44'`, `1729'`, `0'`, `0'`],
    curve: 'ed25519',
    name: 'Tezos',
  },
  {
    path: ['m', `1789'`, `0'`],
    curve: 'ed25519',
    name: 'Vega',
  },
];
///: END:ONLY_INCLUDE_IF
