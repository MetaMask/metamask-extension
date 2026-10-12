import { RpcEndpointType } from '@metamask/network-controller';
import { hasProperty, isObject } from '@metamask/utils';
import type { Migrate } from './types';

export const version = 231;

/**
 * Repairs network configurations saved by the Config Registry "Additional
 * networks" flow while it was broken.
 *
 * `registryConfigToAddNetworkFields` required the registry network to also be
 * in the hard-coded `InfuraNetworkType` list before preserving the Infura
 * endpoint type. Registry chains not in that list (e.g. Arc, Unichain,
 * opBNB, Celo, Hemi, XDC, Scroll, Blast) were saved as Custom endpoints
 * whose URL still contained the literal `{infuraProjectId}` placeholder.
 * Custom endpoint URLs are called verbatim, so every request to those
 * networks failed.
 *
 * Endpoints matching the broken shape are converted to Infura endpoints
 * (NetworkController rebuilds their URL from the networkClientId and the
 * real project ID). Endpoints the user repaired themselves (different URL)
 * are left alone. Built-in default networks also store `{infuraProjectId}`,
 * but as Infura endpoints, so they are untouched.
 *
 * @param versionedData - The versioned data object to migrate.
 * @param changedKeys - A set used to record controllers that were modified.
 */
export const migrate = (async (versionedData, changedKeys) => {
  versionedData.meta.version = version;

  const data = versionedData.data as Record<string, unknown>;
  const networkState = data.NetworkController;
  if (!isObject(networkState)) {
    return;
  }

  const configurations = networkState.networkConfigurationsByChainId;
  if (!isObject(configurations)) {
    return;
  }

  // old (custom) networkClientId -> new (infura) networkClientId
  const remappedClientIds = new Map<string, string>();

  for (const configuration of Object.values(configurations)) {
    if (
      !isObject(configuration) ||
      !Array.isArray(configuration.rpcEndpoints)
    ) {
      continue;
    }

    configuration.rpcEndpoints = configuration.rpcEndpoints.map((endpoint) => {
      if (
        !isObject(endpoint) ||
        endpoint.type !== RpcEndpointType.Custom ||
        typeof endpoint.url !== 'string' ||
        typeof endpoint.networkClientId !== 'string'
      ) {
        return endpoint;
      }

      const match = endpoint.url.match(
        /^https:\/\/(.+)\.infura\.io\/v3\/\{infuraProjectId\}$/u,
      );
      if (!match) {
        return endpoint;
      }

      const infuraNetworkClientId = match[1];
      remappedClientIds.set(endpoint.networkClientId, infuraNetworkClientId);
      return {
        ...endpoint,
        type: RpcEndpointType.Infura,
        networkClientId: infuraNetworkClientId,
      };
    });
  }

  if (remappedClientIds.size === 0) {
    return;
  }

  const metadata = networkState.networksMetadata;
  if (isObject(metadata)) {
    for (const [oldId, newId] of remappedClientIds) {
      if (hasProperty(metadata, oldId)) {
        metadata[newId] = metadata[oldId];
        delete metadata[oldId];
      }
    }
  }

  if (
    typeof networkState.selectedNetworkClientId === 'string' &&
    remappedClientIds.has(networkState.selectedNetworkClientId)
  ) {
    networkState.selectedNetworkClientId = remappedClientIds.get(
      networkState.selectedNetworkClientId,
    );
  }

  changedKeys.add('NetworkController');
}) satisfies Migrate;
