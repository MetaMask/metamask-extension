/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any -- Legacy migration state remains loosely typed during JS-to-TS conversion. */
import { cloneDeep } from 'lodash';

type LegacyState = Record<string, any>;
type VersionedData = { meta: { version?: number }; data?: LegacyState };

const version = 68;

/**
 * Transforms the PermissionsController and PermissionsMetadata substates
 * to match the new permission system.
 */
const migration = {
  version,
  async migrate(originalVersionedData: VersionedData) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    const state = (versionedData.data ?? {}) as LegacyState;
    const newState = transformState(state);
    versionedData.data = newState;
    return versionedData;
  },
};

export default migration;

function transformState(state: LegacyState) {
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

function getPermissionControllerState(PermissionsController: LegacyState) {
  const { domains = {} } = PermissionsController;

  /**
   * Example existing domain entry. Every existing domain will have a single
   * `eth_accounts` permission, which simplifies the transform.
   */

  const ETH_ACCOUNTS = 'eth_accounts';
  const NEW_CAVEAT_TYPE = 'restrictReturnedAccounts';
  const OLD_CAVEAT_NAME = 'exposedAccounts';

  const subjects = Object.entries(domains).reduce(
    (transformed, [origin, domainEntry]) => {
      const permissions = Array.isArray(domainEntry?.permissions)
        ? domainEntry.permissions
        : [];
      const ethAccountsPermission = permissions.find(
        (permission) => permission?.parentCapability === ETH_ACCOUNTS,
      );

      if (
        !ethAccountsPermission ||
        !Array.isArray(ethAccountsPermission.caveats)
      ) {
        return transformed;
      }

      // There are two caveats for each eth_accounts permission, but we only
      // need the value of one of them in the new permission system.
      const oldCaveat = ethAccountsPermission.caveats.find(
        (caveat) => caveat.name === OLD_CAVEAT_NAME,
      );

      if (!oldCaveat) {
        return transformed;
      }

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

function getSubjectMetadataControllerState(domainMetadata: LegacyState) {
  /**
   * Example existing domainMetadata entry keyed by origin.
   */

  const subjectMetadata = Object.entries(domainMetadata).reduce(
    (transformed, [origin, metadata]) => {
      if (!metadata || typeof metadata !== 'object') {
        return transformed;
      }

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
