import type { NetworkConfiguration } from '@metamask/network-controller';
import type { CaipChainId, Hex } from '@metamask/utils';
import { convertCaipToHexChainId } from '../../../../shared/modules/network.utils';

type RpcEndpoint = {
  name?: string;
  url: string;
  networkClientId: string;
};

export const getRpcDataByChainId = (
  chainId: CaipChainId,
  evmNetworks: Record<Hex, NetworkConfiguration>,
): {
  rpcEndpoints: RpcEndpoint[];
  defaultRpcEndpoint: RpcEndpoint;
} => {
  const hexChainId = convertCaipToHexChainId(chainId);
  const evmNetworkConfig = evmNetworks[hexChainId];
  const { rpcEndpoints, defaultRpcEndpointIndex } = evmNetworkConfig;
  const defaultRpcEndpoint = rpcEndpoints[defaultRpcEndpointIndex];
  return {
    rpcEndpoints,
    defaultRpcEndpoint,
  };
};
