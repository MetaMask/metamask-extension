import {
  getRemoteFeatureFlags,
  type RemoteFeatureFlagsState,
} from './remote-feature-flags';

const EIP7702_CONTRACT_ADDRESSES_FLAG = 'confirmations_eip_7702';

/**
 * Get the state of the `vaultRemoteMode` remote feature flag.
 *
 * @param state - The MetaMask state object
 * @returns The state of the `vaultRemoteMode` remote feature flag
 */
export function getIsRemoteModeEnabled(state: RemoteFeatureFlagsState) {
  const { vaultRemoteMode } = getRemoteFeatureFlags(state);
  return vaultRemoteMode;
}

export function getEIP7702ContractAddresses(state: RemoteFeatureFlagsState) {
  const flags = getRemoteFeatureFlags(state);
  return flags[EIP7702_CONTRACT_ADDRESSES_FLAG];
}
