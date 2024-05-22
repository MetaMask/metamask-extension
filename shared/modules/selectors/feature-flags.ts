import { getCurrentChainId } from '../../../ui/selectors/selectors'; // TODO: Migrate shared selectors to this file.
import { getNetworkNameByChainId } from '../feature-flags';

export type SmartTransactionsFeatureFlags = {
  extensionActive?: boolean;
  mobileActive?: boolean;
  expectedDeadline?: number;
  maxDeadline?: number;
  returnTxHashAsap?: boolean;
  optInModalMinVersion?: string;
};

export type ChainSpecificFeatureFlags = {
  extensionActive: boolean;
  mobileActive: boolean;
  smartTransactions: SmartTransactionsFeatureFlags;
};

/**
 * All feature flags. Currently only smartTransactions.
 */
export type FeatureFlags = {
  smartTransactions?: SmartTransactionsFeatureFlags;
};

type FeatureFlagsMetaMaskState = {
  metamask: {
    swapsState: {
      swapsFeatureFlags: {
        [key: string]:
          | SmartTransactionsFeatureFlags
          | ChainSpecificFeatureFlags;
        smartTransactions: SmartTransactionsFeatureFlags;
      };
    };
  };
};

export function getFeatureFlagsByChainId(
  state: FeatureFlagsMetaMaskState,
): FeatureFlags | null {
  const chainId = getCurrentChainId(state);
  const networkName = getNetworkNameByChainId(chainId);
  const featureFlags = state.metamask.swapsState?.swapsFeatureFlags;
  if (!featureFlags?.[networkName]) {
    return null;
  }
  return {
    smartTransactions: {
      ...featureFlags.smartTransactions,
      ...(featureFlags[networkName] as ChainSpecificFeatureFlags)
        .smartTransactions,
    },
  };
}
