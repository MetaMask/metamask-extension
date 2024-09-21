import { cloneDeep } from 'lodash';

const version = 68;

/**
 * Transforms the PermissionsController and PermissionsMetadata substates
 * to match the new permission system.
 */
export default {
  version,
  async migrate(originalVersionedData) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    const state = versionedData.data;
    const newState = transformState(state);
    versionedData.data = newState;
    return versionedData;
  },
};

function transformState(state) {
  const {
    PermissionsController = {},
    PermissionsMetadata = {},
    ...remainingState
  } = state;

  const {
    domainMetadata = {},
    permissionsHistory = {},
    permissionsLog = [],
  } = PermissionsMetadata;

  return {
    ...remainingState,
    PermissionController: getPermissionControllerState(PermissionsController),
    PermissionLogController: {
      permissionActivityLog: permissionsLog,
      permissionHistory: permissionsHistory,
    },
    SubjectMetadataController:
      getSubjectMetadataControllerState(domainMetadata),
  };
}

function getPermissionControllerState(PermissionsController) {
  const { domains = {} } = PermissionsController;

  /**
   * Example existing domain entry. Every existing domain will have a single
   * eth_accounts permission, which simplifies the transform.
   *
   * 'https://metamask.github.io': {
   *   permissions: [
   *     {
   *       '@context': ['https://github.com/MetaMask/rpc-cap'],
   *       'caveats': [
   *         {
   *           name: 'primaryAccountOnly',
   *           type: 'limitResponseLength',
   *           value: 1,
   *         },
   *         {
   *           name: 'exposedAccounts',
   *           type: 'filterResponse',
   *           value: ['0x0c97a5c81e50a02ff8be73cc3f0a0569e61f4ed8'],
   *         },
   *       ],
   *       'date': 1616006369498,
   *       'id': '3d0bdc27-e8e4-4fb0-a24b-340d61f6a3fa',
   *       'invoker': 'https://metamask.github.io',
   *       'parentCapability': 'eth_accounts',
   *     },
   *   ],
   * },
   */

  const ETH_ACCOUNTS = 'eth_accounts';
  const NEW_CAVEAT_TYPE = 'restrictReturnedAccounts';
  const OLD_CAVEAT_NAME = 'exposedAccounts';

  const subjects = Object.entries(domains).reduce(
    (transformed, [origin, domainEntry]) => {
      const {
        permissions: [ethAccountsPermission],
      } = domainEntry;

      // There are two caveats for each eth_accounts permission, but we only
      // need the value of one of them in the new permission system.
      const oldCaveat = ethAccountsPermission.caveats.find(
        (caveat) => caveat.name === OLD_CAVEAT_NAME,
      );

      const newPermission = {
        ...ethAccountsPermission,
        caveats: [{ type: NEW_CAVEAT_TYPE, value: oldCaveat.value }],
      };

      // We never used this, and just omit it in the new system.
      delete newPermission['@context'];

      transformed[origin] = {
        origin,
        permissions: {
          [ETH_ACCOUNTS]: newPermission,
        },
      };
      return transformed;
    },
    {},
  );

  return {
    subjects,
  };
}

function getSubjectMetadataControllerState(domainMetadata) {
  /**
   * Example existing domainMetadata entry.
   *
   * "https://www.youtube.com": {
   *   "host": "www.youtube.com",
   *   "icon": null,
   *   "lastUpdated": 1637697914908,
   *   "name": "YouTube"
   * }
   */

  const subjectMetadata = Object.entries(domainMetadata).reduce(
    (transformed, [origin, metadata]) => {
      const {
        name = null,
        icon = null,
        extensionId = null,
        ...other
      } = metadata;

      // We're getting rid of these.
      delete other.lastUpdated;
      delete other.host;

      if (origin) {
        transformed[origin] = {
          name,
          iconUrl: icon,
          extensionId,
          ...other,
          origin,
        };
      }
      return transformed;
    },
    {},
  );

  return {
    subjectMetadata,
  };
}
