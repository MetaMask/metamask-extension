import { getNetworkConfigurationsByChainId } from '../../shared/modules/selectors/networks';
import { createDeepEqualSelector } from '../../shared/modules/selectors/util';
import { getAllDomains, getOriginOfCurrentTab } from './selectors';

export const getDappActiveNetwork = createDeepEqualSelector(
  getOriginOfCurrentTab,
  getAllDomains,
  getNetworkConfigurationsByChainId,
  (activeTabOrigin, allDomains, networkConfigurationsByChainId) => {
    if (!activeTabOrigin || !allDomains) {
      return null;
    }

    const networkClientId = allDomains[activeTabOrigin];
    if (!networkClientId) {
      return null;
    }

    for (const chainId in networkConfigurationsByChainId) {
      if (Object.prototype.hasOwnProperty.call(networkConfigurationsByChainId, chainId)) {
        const network = networkConfigurationsByChainId[chainId as keyof typeof networkConfigurationsByChainId];
        const hasMatchingEndpoint = network.rpcEndpoints.some(
          (rpcEndpoint: any) => rpcEndpoint.networkClientId === networkClientId,
        );
        if (hasMatchingEndpoint) {
          return network;
        }
      }
    }

    return null;
  },
);
