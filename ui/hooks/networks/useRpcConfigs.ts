import { useSelector } from 'react-redux';
import { getNetworkConfigurationsByChainId } from '../../../shared/modules/selectors/networks';
import { hexToDecimal } from '../../../shared/modules/conversion.utils';

export const useRpcConfigs = () => {
  const rpcConfigs = {};
  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);

  Object.values(networkConfigurations).forEach((config) => {
    const chainId = 'eip155:' + hexToDecimal(config.chainId);
    rpcConfigs[chainId] = { rpcEndpoints: config.rpcEndpoints, defaultRpcEndpoint: config.defaultRpcEndpointIndex };
  });

  const getDefaultRpcEndpointByChainId = (chainId: string) => {
    const config = rpcConfigs[chainId];
    return config ? config.rpcEndpoints[config.defaultRpcEndpoint] : undefined;
  };

  return {
    rpcConfigs,
    getDefaultRpcEndpointByChainId,
  };
};
