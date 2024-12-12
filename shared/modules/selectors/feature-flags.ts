import { BackgroundStateProxy } from '../../types/metamask';
import { getNetworkNameByChainId } from '../feature-flags';
import { getCurrentChainId } from './networks';

export function getFeatureFlagsByChainId(state: {
  metamask: BackgroundStateProxy;
}) {
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
