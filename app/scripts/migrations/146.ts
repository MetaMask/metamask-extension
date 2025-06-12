import { hasProperty, isObject } from '@metamask/utils';
import {
  NetworkConfiguration,
  RpcEndpointType,
} from '@metamask/network-controller';
import {
  BlockExplorerUrl,
  BUILT_IN_CUSTOM_NETWORKS_RPC,
  ChainId,
  NetworkNickname,
  NetworksTicker,
} from '@metamask/controller-utils';
import { cloneDeep } from 'lodash';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 146;

/**
 * This migration add MegaETH to the network controller
 * as a default Testnet.
 *
 * @param originalVersionedData - Versioned MetaMask extension state, exactly
 * what we persist to disk.
 * @returns Updated versioned MetaMask extension state.
 */
export async function migrate(originalVersionedData: VersionedData) {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;
  versionedData.data = transformState(versionedData.data);
  return versionedData;
}

function transformState(state: Record<string, unknown>) {
  if (
    hasProperty(state, 'NetworkController') &&
    isObject(state.NetworkController) &&
    isObject(state.NetworkController.networkConfigurationsByChainId)
  ) {
    const megaethTestnet = 'megaeth-testnet';
    const megaethTestnetChainId = ChainId[megaethTestnet];
    const megaethTestnetConfiguration: NetworkConfiguration = {
      chainId: megaethTestnetChainId,
      name: NetworkNickname[megaethTestnet],
      nativeCurrency: NetworksTicker[megaethTestnet],
      blockExplorerUrls: [BlockExplorerUrl[megaethTestnet]],
      defaultRpcEndpointIndex: 0,
      defaultBlockExplorerUrlIndex: 0,
      rpcEndpoints: [
        {
          networkClientId: megaethTestnet,
          type: RpcEndpointType.Custom,
          url: BUILT_IN_CUSTOM_NETWORKS_RPC.MEGAETH_TESTNET,
        },
      ],
    };

    state.NetworkController.networkConfigurationsByChainId[
      megaethTestnetChainId
    ] = megaethTestnetConfiguration;
  }
  return state;
}
