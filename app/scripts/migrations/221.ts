import { hasProperty, isObject } from '@metamask/utils';
import type { Migrate } from './types';

export const version = 221;

const IPFS_DEFAULT_GATEWAY_URL = 'dweb.link';
const INFURA_IPFS_GATEWAY_HOST = 'ipfs.infura.io';

/**
 * Migrates users from the deprecated Infura IPFS gateway to the default IPFS gateway.
 *
 * @param versionedData - The versioned data object to migrate.
 * @param changedControllers - A set used to record controllers that were modified.
 */
export const migrate = (async (versionedData, changedControllers) => {
  versionedData.meta.version = version;

  const state = versionedData.data;
  if (!hasProperty(state, 'PreferencesController')) {
    return;
  }

  if (!isObject(state.PreferencesController)) {
    return;
  }

  const preferencesControllerState = state.PreferencesController;
  const { ipfsGateway } = preferencesControllerState;

  if (
    typeof ipfsGateway === 'string' &&
    getGatewayHost(ipfsGateway) === INFURA_IPFS_GATEWAY_HOST
  ) {
    preferencesControllerState.ipfsGateway = IPFS_DEFAULT_GATEWAY_URL;
    changedControllers.add('PreferencesController');
  }
}) satisfies Migrate;

export default migrate;

function getGatewayHost(ipfsGateway: string): string {
  const gatewayWithoutProtocol = ipfsGateway.replace(/^https?:\/\//u, '');
  return gatewayWithoutProtocol.split('/')[0];
}
