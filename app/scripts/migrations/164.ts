import { cloneDeep } from 'lodash';
import { hasProperty, isObject } from '@metamask/utils';
import type { CaipChainId } from '@metamask/utils';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 164;

// In-lined from @metamask/chain-agnostic-permission
const Caip25CaveatType = 'authorizedScopes';
const Caip25EndowmentPermissionName = 'endowment:caip25';

type InternalScopeObject = {
  accounts: string[];
};

type InternalScopesObject = Record<CaipChainId, InternalScopeObject>;

type Caip25CaveatValue = {
  requiredScopes: InternalScopesObject;
  optionalScopes: InternalScopesObject;
  sessionProperties?: Record<string, unknown>;
  isMultichainOrigin: boolean;
};

/**
 * This migration removes from the PermissionController state all permission scopes that reference deleted networks.
 *
 * Specifically, it cleans up `endowment:caip25` permissions by removing any chain-specific scopes (like `eip155:1337`)
 * that reference networks that no longer exist in the NetworkController's `networkConfigurationsByChainId`.
 *
 * If the required controllers are not found or are not objects, the migration logs an error,
 * but otherwise leaves the state unchanged.
 *
 * @param originalVersionedData - The versioned extension state.
 * @returns The updated versioned extension state without orphaned network permissions.
 */
export async function migrate(
  originalVersionedData: VersionedData,
): Promise<VersionedData> {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;

  versionedData.data = transformState(versionedData.data);

  return versionedData;
}

function transformState(
  state: Record<string, unknown>,
): Record<string, unknown> {
  if (!hasProperty(state, 'PermissionController')) {
    global.sentry?.captureException?.(
      new Error(`Migration ${version}: PermissionController not found.`),
    );
    return state;
  }

  if (!hasProperty(state, 'NetworkController')) {
    global.sentry?.captureException?.(
      new Error(`Migration ${version}: NetworkController not found.`),
    );
    return state;
  }

  const permissionControllerState = state.PermissionController;
  const networkControllerState = state.NetworkController;

  if (!isObject(permissionControllerState)) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: PermissionController is type '${typeof permissionControllerState}', expected object.`,
      ),
    );
    return state;
  }

  if (!isObject(networkControllerState)) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: NetworkController is type '${typeof networkControllerState}', expected object.`,
      ),
    );
    return state;
  }

  if (!hasProperty(networkControllerState, 'networkConfigurationsByChainId')) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: NetworkController.networkConfigurationsByChainId not found.`,
      ),
    );
    return state;
  }

  const { networkConfigurationsByChainId } = networkControllerState;

  if (!isObject(networkConfigurationsByChainId)) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: NetworkController.networkConfigurationsByChainId is type '${typeof networkConfigurationsByChainId}', expected object.`,
      ),
    );
    return state;
  }

  // Get the list of valid chain IDs
  const validChainIds = Object.keys(networkConfigurationsByChainId);

  // Convert hex chain IDs to decimal format for EIP-155 comparison (e.g., "0x1" -> "eip155:1")
  const validEip155ChainIds = validChainIds.map((chainId) => {
    const decimal = parseInt(chainId, 16);
    return `eip155:${decimal}`;
  });

  if (!hasProperty(permissionControllerState, 'subjects')) {
    // No subjects to clean up
    return state;
  }

  const { subjects } = permissionControllerState;

  if (!isObject(subjects)) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: PermissionController.subjects is type '${typeof subjects}', expected object.`,
      ),
    );
    return state;
  }

  // Clean up permissions for each subject
  for (const subjectKey of Object.keys(subjects)) {
    const subject = subjects[subjectKey];

    if (!isObject(subject)) {
      continue;
    }

    if (
      !hasProperty(subject, 'permissions') ||
      !isObject(subject.permissions)
    ) {
      continue;
    }

    const { permissions } = subject;

    // Check if this subject has CAIP-25 permissions
    if (!hasProperty(permissions, Caip25EndowmentPermissionName)) {
      continue;
    }

    const caip25Permission = permissions[Caip25EndowmentPermissionName];

    if (!isObject(caip25Permission)) {
      continue;
    }

    if (
      !hasProperty(caip25Permission, 'caveats') ||
      !Array.isArray(caip25Permission.caveats)
    ) {
      continue;
    }

    // Find and clean up the authorizedScopes caveat
    for (const caveat of caip25Permission.caveats) {
      if (!isObject(caveat) || caveat.type !== Caip25CaveatType) {
        continue;
      }

      if (!hasProperty(caveat, 'value') || !isObject(caveat.value)) {
        continue;
      }

      const caveatValue = caveat.value as Caip25CaveatValue;

      // Clean up requiredScopes
      if (isObject(caveatValue.requiredScopes)) {
        for (const scopeKey of Object.keys(caveatValue.requiredScopes)) {
          // Skip wallet scopes and other non-chain-specific scopes
          if (
            scopeKey.startsWith('wallet:') ||
            !scopeKey.startsWith('eip155:')
          ) {
            continue;
          }

          // Remove if this chain ID is not in the valid list
          if (!validEip155ChainIds.includes(scopeKey)) {
            delete caveatValue.requiredScopes[scopeKey as CaipChainId];
          }
        }
      }

      // Clean up optionalScopes
      if (isObject(caveatValue.optionalScopes)) {
        for (const scopeKey of Object.keys(caveatValue.optionalScopes)) {
          // Skip wallet scopes and other non-chain-specific scopes
          if (
            scopeKey.startsWith('wallet:') ||
            !scopeKey.startsWith('eip155:')
          ) {
            continue;
          }

          // Remove if this chain ID is not in the valid list
          if (!validEip155ChainIds.includes(scopeKey)) {
            delete caveatValue.optionalScopes[scopeKey as CaipChainId];
          }
        }
      }
    }
  }

  return state;
}
