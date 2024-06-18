import { SnapId } from '@metamask/snaps-sdk';

export const BITCOIN_MANAGER_SNAP_ID: SnapId =
  'npm:@metamask/bitcoin' as SnapId;
  //'local:http://localhost:8080' as SnapId;

// FIXME: This one should probably somewhere else with other CAIP-2 chain ID identifiers!
export const BITCOIN_MANAGER_SCOPE_MAINNET =
  'bip122:000000000019d6689c085ae165831e93';
