import { hasProperty, isObject } from '@metamask/utils';
import { captureException } from '../../../shared/lib/sentry';
import type { Migrate } from './types';

export const version = 235;

/**
 * Migration 235: remove the legacy per-endpoint `failoverUrls` property from
 * every RPC endpoint in `NetworkController.networkConfigurationsByChainId`.
 *
 * `@metamask/network-controller` no longer reads or stores `failoverUrls` on
 * RPC endpoints; failover URLs come solely from the `failoverUrls` constructor
 * option, keyed by chain ID. Any value left in persisted state is ignored, so
 * it is dropped here to keep the persisted state in line with the controller's
 * state shape.
 *
 * @param versionedData - The versioned data object to migrate.
 * @param changedControllers - A set used to record controllers that were
 * modified.
 */
export const migrate = (async (versionedData, changedControllers) => {
  versionedData.meta.version = version;

  const data = versionedData.data as Record<string, unknown>;

  if (!hasProperty(data, 'NetworkController')) {
    return;
  }

  const networkController = data.NetworkController;

  if (!isObject(networkController)) {
    captureException(
      new Error(
        `Migration ${version}: Invalid NetworkController state: '${typeof networkController}'`,
      ),
    );
    return;
  }

  // Nothing to clean up when there are no network configurations.
  if (!hasProperty(networkController, 'networkConfigurationsByChainId')) {
    return;
  }

  const { networkConfigurationsByChainId } = networkController;

  if (!isObject(networkConfigurationsByChainId)) {
    captureException(
      new Error(
        `Migration ${version}: Invalid networkConfigurationsByChainId state: '${typeof networkConfigurationsByChainId}'`,
      ),
    );
    return;
  }

  let hasChanged = false;

  for (const networkConfiguration of Object.values(
    networkConfigurationsByChainId,
  )) {
    if (
      !isObject(networkConfiguration) ||
      !Array.isArray(networkConfiguration.rpcEndpoints)
    ) {
      continue;
    }

    for (const rpcEndpoint of networkConfiguration.rpcEndpoints) {
      if (isObject(rpcEndpoint) && hasProperty(rpcEndpoint, 'failoverUrls')) {
        delete rpcEndpoint.failoverUrls;
        hasChanged = true;
      }
    }
  }

  if (hasChanged) {
    changedControllers.add('NetworkController');
  }
}) satisfies Migrate;
