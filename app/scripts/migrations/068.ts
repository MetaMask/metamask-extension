import { cloneDeep } from 'lodash';
import type { LegacyMigration, MigrationState } from '../lib/migrator';
import type {
  LegacyPermissionsController,
  LegacyState,
} from './legacy-migration-utils';
const version = 68;

/**
 * Transforms the PermissionsController and PermissionsMetadata substates
 * to match the new permission system.
 */
export default {
  version,
  async migrate(originalVersionedData: MigrationState) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    const state = versionedData.data as LegacyState;
    const newState = transformState(state);
    versionedData.data = newState;
    return versionedData;
  },
} satisfies LegacyMigration;

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
    SubjectMetadataController: getSubjectMetadataControllerState(
      domainMetadata as Record<string, Record<string, unknown>>,
    ),
  };
}

function getPermissionControllerState(
  PermissionsController: LegacyPermissionsController,
) {
  const { domains = {} } = PermissionsController;

  /**
   * Example existing domain entry. Every existing domain will have a single
   * `eth_accounts` permission, which simplifies the transform.
   */

  const ETH_ACCOUNTS = 'eth_accounts';
  const NEW_CAVEAT_TYPE = 'restrictReturnedAccounts';
  const OLD_CAVEAT_NAME = 'exposedAccounts';

  const subjects = Object.entries(domains).reduce<Record<string, unknown>>(
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

      const newPermission: Record<string, unknown> = {
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

function getSubjectMetadataControllerState(
  domainMetadata: Record<string, Record<string, unknown>>,
) {
  /**
   * Example existing domainMetadata entry keyed by origin.
   */

  const subjectMetadata = Object.entries(domainMetadata).reduce<
    Record<string, Record<string, unknown>>
  >((transformed, [origin, metadata]) => {
    if (!metadata || typeof metadata !== 'object') {
      return transformed;
    }

    const {
      name = null,
      icon = null,
      extensionId = null,
      ...other
    } = metadata as Record<string, unknown>;

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
  }, {});

  return {
    subjectMetadata,
  };
}
