import { getErrorMessage, hasProperty, isObject } from '@metamask/utils';
import { RpcEndpointType } from '@metamask/network-controller';
import { captureException } from '../../../shared/lib/sentry';
import {
  allowedInfuraHosts,
  CHAIN_IDS,
  infuraChainIdsTestNets,
  infuraProjectId,
} from '../../../shared/constants/network';
import type { Migrate } from './types';

export const version = 213;

const ZKSYNC_LEGACY_URL = 'https://mainnet.era.zksync.io';
const ZKSYNC_INFURA_URL = `https://zksync-mainnet.infura.io/v3/${infuraProjectId}`;

/**
 * Migration 213: replace the public zkSync Era RPC endpoint
 * (`https://mainnet.era.zksync.io`) with the Infura endpoint on existing user
 * installs, but only when the user already relies on Infura elsewhere in
 * their network config (excluding testnets and Linea Mainnet, which ship as
 * Infura by default for everyone).
 *
 * - Users without zkSync Era configured: no-op.
 * - Users who customized the zkSync URL away from the public endpoint: no-op.
 * - Users with no Infura defaults anywhere else: no-op.
 *
 * @param versionedData - Versioned MetaMask extension state, exactly what we
 * persist to disk.
 * @param localChangedControllers - A set of controller keys that have been
 * changed by the migration.
 */
export const migrate = (async (versionedData, localChangedControllers) => {
  versionedData.meta.version = version;

  const data = versionedData.data as Record<string, unknown>;

  try {
    transformState(data, localChangedControllers);
  } catch (error) {
    console.error(error);
    captureException(
      new Error(`Migration #${version}: ${getErrorMessage(error)}`),
    );
  }
}) satisfies Migrate;

export default migrate;

function transformState(
  state: Record<string, unknown>,
  localChangedControllers: Set<string>,
) {
  if (
    !hasProperty(state, 'NetworkController') ||
    !isObject(state.NetworkController) ||
    !hasProperty(state.NetworkController, 'networkConfigurationsByChainId') ||
    !isObject(state.NetworkController.networkConfigurationsByChainId)
  ) {
    return;
  }

  const { networkConfigurationsByChainId } = state.NetworkController;

  if (!userReliesOnInfura(networkConfigurationsByChainId)) {
    return;
  }

  const zksyncNetworkConfig =
    networkConfigurationsByChainId[CHAIN_IDS.ZKSYNC_ERA];
  if (!isObject(zksyncNetworkConfig)) {
    return;
  }

  const { rpcEndpoints } = zksyncNetworkConfig;
  if (!Array.isArray(rpcEndpoints)) {
    return;
  }

  const index = rpcEndpoints.findIndex(
    (endpoint) => isObject(endpoint) && endpoint.url === ZKSYNC_LEGACY_URL,
  );

  if (index === -1) {
    return;
  }

  rpcEndpoints[index] = {
    ...rpcEndpoints[index],
    url: ZKSYNC_INFURA_URL,
  };
  localChangedControllers.add('NetworkController');
}

function userReliesOnInfura(
  networkConfigurationsByChainId: Record<string, unknown>,
): boolean {
  return Object.entries(networkConfigurationsByChainId)
    .filter(
      ([chainId]) =>
        ![
          ...infuraChainIdsTestNets,
          CHAIN_IDS.LINEA_MAINNET,
          CHAIN_IDS.ZKSYNC_ERA,
        ].includes(chainId),
    )
    .some(([, networkConfig]) => {
      if (
        !isObject(networkConfig) ||
        !Array.isArray(networkConfig.rpcEndpoints) ||
        typeof networkConfig.defaultRpcEndpointIndex !== 'number'
      ) {
        return false;
      }

      const defaultRpcEndpoint =
        networkConfig.rpcEndpoints[networkConfig.defaultRpcEndpointIndex];

      if (
        !isObject(defaultRpcEndpoint) ||
        typeof defaultRpcEndpoint.url !== 'string'
      ) {
        return false;
      }

      try {
        const urlHost = new URL(defaultRpcEndpoint.url).host;
        return (
          defaultRpcEndpoint.type === RpcEndpointType.Infura ||
          allowedInfuraHosts.includes(urlHost)
        );
      } catch {
        return false;
      }
    });
}
