import type { RemoteFeatureFlagController } from '@metamask/remote-feature-flag-controller';
import type { NetworkController } from '@metamask/network-controller';
/**
 * Sets RPC failover based on remote feature flags.
 *
 * @param networkController - The network controller.
 * @param remoteFeatureFlagController - The remote feature flag controller.
 */
export function updateNetworkControllerRpcFailoverFromRemoteFeatureFlagController(
  networkController: NetworkController,
  remoteFeatureFlagController: RemoteFeatureFlagController,
) {
  const walletFrameworkRpcFailoverEnabled = remoteFeatureFlagController.state
    .remoteFeatureFlags?.walletFrameworkRpcFailoverEnabled as
    | boolean
    | undefined;
  if (walletFrameworkRpcFailoverEnabled) {
    networkController.enableRpcFailover();
  } else {
    networkController.disableRpcFailover();
  }
}
