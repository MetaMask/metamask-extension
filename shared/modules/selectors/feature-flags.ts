import { getNetworkNameByChainId } from '../feature-flags';
import { ProviderConfigState, getCurrentChainId } from './networks';

type FeatureFlagsMetaMaskState = {
  metamask: {
    SwapsController: {
      swapsState: {
        swapsFeatureFlags: {
          [key: string]: {
            extensionActive: boolean;
            mobileActive: boolean;
            smartTransactions: {
              expectedDeadline?: number;
              maxDeadline?: number;
              extensionReturnTxHashAsap?: boolean;
            };
          };
        };
      };
    };
  };
};

export function getFeatureFlagsByChainId(
  state: ProviderConfigState & FeatureFlagsMetaMaskState,
) {
  const chainId = getCurrentChainId(state);
  const networkName = getNetworkNameByChainId(chainId);
  const featureFlags =
    state.metamask.SwapsController.swapsState?.swapsFeatureFlags;
  if (!featureFlags?.[networkName]) {
    return null;
  }
  return {
    smartTransactions: {
      ...featureFlags.smartTransactions,
      ...featureFlags[networkName].smartTransactions,
    },
  };
}
