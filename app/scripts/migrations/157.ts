import { RpcEndpointType } from '@metamask/network-controller';
import { getErrorMessage, hasProperty, Hex, isObject } from '@metamask/utils';
import { cloneDeep, escapeRegExp } from 'lodash';
import { captureException } from '../../../shared/lib/sentry';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 157;

// Chains supported by Infura that are either built in or featured,
// mapped to their corresponding failover URLs.
// Copied from `FEATURED_RPCS` in shared/constants/network.ts:
// <https://github.com/MetaMask/metamask-extension/blob/f28216fad810d138dab8577fe9bdb39f5b6d18d8/shared/constants/network.ts#L1051>
export const INFURA_CHAINS_WITH_FAILOVERS: Map<
  Hex,
  { subdomain: string; getFailoverUrl: () => string | undefined }
> = new Map([
  [
    '0x1',
    {
      subdomain: 'mainnet',
      getFailoverUrl: () => process.env.QUICKNODE_MAINNET_URL,
    },
  ],
  // linea mainnet
  [
    '0xe708',
    {
      subdomain: 'linea-mainnet',
      getFailoverUrl: () => process.env.QUICKNODE_LINEA_MAINNET_URL,
    },
  ],
  [
    '0xa4b1',
    {
      subdomain: 'arbitrum',
      getFailoverUrl: () => process.env.QUICKNODE_ARBITRUM_URL,
    },
  ],
  [
    '0xa86a',
    {
      subdomain: 'avalanche',
      getFailoverUrl: () => process.env.QUICKNODE_AVALANCHE_URL,
    },
  ],
  [
    '0xa',
    {
      subdomain: 'optimism',
      getFailoverUrl: () => process.env.QUICKNODE_OPTIMISM_URL,
    },
  ],
  [
    '0x89',
    {
      subdomain: 'polygon',
      getFailoverUrl: () => process.env.QUICKNODE_POLYGON_URL,
    },
  ],
  [
    '0x2105',
    {
      subdomain: 'base',
      getFailoverUrl: () => process.env.QUICKNODE_BASE_URL,
    },
  ],
]);

/**
 * This migration ensures that all RPC endpoints that hit Infura and use our API
 * key are assigned failover URLs that point to Quicknode.
 *
 * @param originalVersionedData - The original MetaMask extension state.
 * @returns Updated versioned MetaMask extension state.
 */
export async function migrate(
  originalVersionedData: VersionedData,
): Promise<VersionedData> {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;

  try {
    transformState(versionedData.data);
  } catch (error) {
    console.error(error);
    const newError = new Error(
      `Migration #${version}: ${getErrorMessage(error)}`,
    );
    captureException(newError);
    // Even though we encountered an error, we need the migration to pass for
    // the migrator tests to work
    versionedData.data = originalVersionedData.data;
  }

  return versionedData;
}

function transformState(state: Record<string, unknown>) {
  if (!process.env.INFURA_PROJECT_ID) {
    throw new Error('No INFURA_PROJECT_ID set!');
  }

  if (!hasProperty(state, 'NetworkController')) {
    throw new Error('Missing NetworkController state');
  }

  if (!isObject(state.NetworkController)) {
    throw new Error(
      `Expected state.NetworkController to be an object, but is ${typeof state.NetworkController}`,
    );
  }

  if (!hasProperty(state.NetworkController, 'networkConfigurationsByChainId')) {
    throw new Error(
      'Missing state.NetworkController.networkConfigurationsByChainId',
    );
  }

  if (!isObject(state.NetworkController.networkConfigurationsByChainId)) {
    throw new Error(
      `Expected state.NetworkController.networkConfigurationsByChainId to be an object, but is ${typeof state
        .NetworkController.networkConfigurationsByChainId}`,
    );
  }

  const { networkConfigurationsByChainId } = state.NetworkController;

  for (const [chainId, networkConfiguration] of Object.entries(
    networkConfigurationsByChainId,
  )) {
    const infuraChainWithFailover = INFURA_CHAINS_WITH_FAILOVERS.get(
      chainId as Hex,
    );

    if (
      !isObject(networkConfiguration) ||
      !hasProperty(networkConfiguration, 'rpcEndpoints') ||
      !Array.isArray(networkConfiguration.rpcEndpoints)
    ) {
      continue;
    }

    networkConfiguration.rpcEndpoints = networkConfiguration.rpcEndpoints.map(
      (rpcEndpoint) => {
        if (
          !isObject(rpcEndpoint) ||
          !hasProperty(rpcEndpoint, 'url') ||
          typeof rpcEndpoint.url !== 'string' ||
          (hasProperty(rpcEndpoint, 'failoverUrls') &&
            Array.isArray(rpcEndpoint.failoverUrls) &&
            rpcEndpoint.failoverUrls.length > 0)
        ) {
          return rpcEndpoint;
        }

        // All featured networks that use Infura get added as custom RPC
        // endpoints, not Infura RPC endpoints
        const match = rpcEndpoint.url.match(
          new RegExp(
            `https://(.+?)\\.infura\\.io/v3/${escapeRegExp(
              process.env.INFURA_PROJECT_ID,
            )}`,
            'u',
          ),
        );
        const isInfuraLike =
          match &&
          infuraChainWithFailover &&
          match[1] === infuraChainWithFailover.subdomain;

        const failoverUrl = infuraChainWithFailover?.getFailoverUrl();

        if (
          failoverUrl &&
          (rpcEndpoint.type === RpcEndpointType.Infura || isInfuraLike)
        ) {
          return {
            ...rpcEndpoint,
            failoverUrls: [failoverUrl],
          };
        }

        return rpcEndpoint;
      },
    );
  }
}
