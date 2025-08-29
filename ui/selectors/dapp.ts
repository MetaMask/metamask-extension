import { getAllDomains, getOriginOfCurrentTab } from './selectors';
import { getNetworkConfigurationsByChainId } from '../../shared/modules/selectors/networks';
import { createDeepEqualSelector } from '../../shared/modules/selectors/util';

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

    const networkConfiguration = Object.values(
      networkConfigurationsByChainId,
    ).find((network) => {
      return network.rpcEndpoints.some(
        (rpcEndpoint) => rpcEndpoint.networkClientId === networkClientId,
      );
    });

    return networkConfiguration || null;
  },
);
