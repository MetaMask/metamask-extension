import { getErrorMessage, hasProperty } from '@metamask/utils';

import { captureException } from '../../../shared/lib/sentry';
import { checkNetworkEnablementState } from './196_utils';
import type { Migrate } from './types';

export type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 196;

export const TARGET_KEY = 'eip155:999';
export const VALUE_TO_SET = 'eip155:999/slip44:2457';

// Context: HYPE token (eip155:999/slip44:2457) was incorrectly set to eip155:999/slip44:1 (1 instead of 2457)
// for some users in NetworkEnablementController.nativeAssetIdentifiers state.
// This is because https://chainid.network/chains.json is fetched to populate this state,
// and that chainId "999" references a "WanChain testnet" instead of HyperEVM.
// PR https://github.com/MetaMask/core/pull/7975 addresses future population by forcing an
// override at fetch-time.
// However such fetching is not always triggered if an user had already added the network,
// hence the need for this migration that - ontop of the PR above - will migrate the incorrect
// entry ('eip155:999/slip44:1') to the correct one ('eip155:999/slip44:2457').
//
// This migration will operate only if an entry already exists AND is not 'eip155:999/slip44:2457'.
export const migrate = (async (
  versionedData: VersionedData,
  changedControllers: Set<string>,
): Promise<void> => {
  versionedData.meta.version = version;
  try {
    // Transforming directly the state here without doing a copy.
    // Because only one change action is possible, so it happens or doesn't.
    transformState(versionedData.data, changedControllers);
  } catch (error) {
    console.error(error);
    const newError = new Error(
      `Migration #${version}: ${getErrorMessage(error)}`,
    );
    captureException(newError);
  }
}) satisfies Migrate;

function transformState(
  state: Record<string, unknown>,
  changedControllers: Set<string>,
) {
  if (!checkNetworkEnablementState(state, version)) {
    return;
  }
  const { nativeAssetIdentifiers } = state.NetworkEnablementController;
  // Only setting the value if the key already exists
  if (!hasProperty(nativeAssetIdentifiers, TARGET_KEY)) {
    return;
  }
  // Only setting the value if the key isn't already correctly set
  if (nativeAssetIdentifiers[TARGET_KEY] === VALUE_TO_SET) {
    return;
  }
  // Setting the correct value, overridding the wrong one
  nativeAssetIdentifiers[TARGET_KEY] = VALUE_TO_SET;
  changedControllers.add('NetworkEnablementController');
}
