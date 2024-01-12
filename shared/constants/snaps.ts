///: BEGIN:ONLY_INCLUDE_IF(snaps)
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
///: END:ONLY_INCLUDE_IF
