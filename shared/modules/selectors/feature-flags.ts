import { BackgroundStateProxy } from '../../types/metamask';
import { getNetworkNameByChainId } from '../feature-flags';
import { getCurrentChainId } from './networks';
import { createDeepEqualSelector } from './util';

export const getFeatureFlagsByChainId = createDeepEqualSelector(
  getCurrentChainId,
  (state: { metamask: Pick<BackgroundStateProxy, 'SwapsController'> }) =>
    state.metamask.SwapsController.swapsState?.swapsFeatureFlags,
  (chainId, featureFlags) => {
    const networkName = getNetworkNameByChainId(chainId);
    if (
      !(networkName in featureFlags) ||
      !featureFlags?.[networkName as keyof typeof featureFlags]
    ) {
      return null;
    }
    const networkFeatureFlags =
      featureFlags[networkName as keyof typeof featureFlags] ?? {};
    return {
      smartTransactions: {
        ...featureFlags.smartTransactions,
        ...(typeof networkFeatureFlags === 'object' &&
        'smartTransactions' in networkFeatureFlags
          ? networkFeatureFlags.smartTransactions
          : {}),
      },
    };
  },
);
