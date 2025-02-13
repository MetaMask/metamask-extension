import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { type CaipChainId } from '@metamask/utils';
import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import { getNetworkConfigurationsByChainId } from '../../../shared/modules/selectors/networks';

export const useRpcConfigs = () => {
  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);

  const rpcConfigs = useMemo(() => {
    return Object.values(networkConfigurations).reduce((acc, config) => {
      const { chainId, rpcEndpoints, defaultRpcEndpointIndex } = config;
      return {
        ...acc,
        [toEvmCaipChainId(chainId)]: {
          rpcEndpoints,
          defaultRpcEndpoint: defaultRpcEndpointIndex,
        },
      };
    }, {});
  }, [networkConfigurations]);

  const getDefaultRpcEndpointByChainId = (chainId: CaipChainId) => {
    // @ts-expect-error - We can't type this because the network-controller module does not expose the RpcEndpoint type.
    const config = rpcConfigs[chainId];
    return config ? config.rpcEndpoints[config.defaultRpcEndpoint] : undefined;
  };

  return {
    rpcConfigs,
    getDefaultRpcEndpointByChainId,
  };
};
