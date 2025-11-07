/**
 * Sets RPC failover based on remote feature flags.
 * @param {import("@metamask/remote-feature-flag-controller").RemoteFeatureFlagController} remoteFeatureFlagController - The remote feature flag controller.
 * @param {import("@metamask/network-controller").NetworkController} networkController - The network controller.
 * @returns {void}
 */
export function updateNetworkControllerRpcFailoverFromRemoteFeatureFlagController(
  networkController,
  remoteFeatureFlagController,
) {
  /**
   * @type {boolean | undefined}
   */
  const walletFrameworkRpcFailoverEnabled =
    remoteFeatureFlagController.state.remoteFeatureFlags
      ?.walletFrameworkRpcFailoverEnabled;
  if (walletFrameworkRpcFailoverEnabled) {
    networkController.enableRpcFailover();
  } else {
    networkController.disableRpcFailover();
  }
}
