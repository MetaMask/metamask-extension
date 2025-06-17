import { cloneDeep } from 'lodash';
import { hasProperty, isObject } from '@metamask/utils';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
  getAllScopesFromPermission,
  type Caip25CaveatValue,
} from '@metamask/chain-agnostic-permission';
import { hexToDecimal } from '../../../shared/modules/conversion.utils';

export const version = 167;

/**
 * This migration removes app chain permissions from PermissionController if the chain
 * is not configured in NetworkController.
 *
 * @param originalVersionedData - Versioned MetaMask extension state, exactly what we persist to dist.
 * @param originalVersionedData.meta - State metadata.
 * @param originalVersionedData.meta.version - The current state version.
 * @param originalVersionedData.data - The persisted MetaMask state, keyed by controller.
 * @returns Updated versioned MetaMask extension state.
 */
export async function migrate(originalVersionedData: {
  meta: { version: number };
  data: Record<string, unknown>;
}) {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;
  versionedData.data = transformState(versionedData.data);
  return versionedData;
}

function transformState(state: Record<string, unknown>) {
  if (
    !hasProperty(state, 'NetworkController') ||
    !hasProperty(state, 'PermissionController')
  ) {
    return state;
  }

  const networkController = state.NetworkController;
  const permissionController = state.PermissionController;

  if (!isObject(networkController) || !isObject(permissionController)) {
    return state;
  }

  if (
    !hasProperty(networkController, 'networkConfigurationsByChainId') ||
    !hasProperty(permissionController, 'subjects')
  ) {
    return state;
  }

  const { networkConfigurationsByChainId } = networkController;
  const { subjects } = permissionController;

  if (!isObject(networkConfigurationsByChainId) || !isObject(subjects)) {
    return state;
  }

  // Get all configured chain IDs and convert them to decimal format
  const configuredChainIds = new Set(
    Object.keys(networkConfigurationsByChainId).map((chainId) =>
      hexToDecimal(chainId),
    ),
  );

  for (const [_subjectKey, subject] of Object.entries(subjects)) {
    if (!isObject(subject) || !hasProperty(subject, 'permissions')) {
      continue;
    }

    const { permissions } = subject;
    if (
      !isObject(permissions) ||
      !hasProperty(permissions, Caip25EndowmentPermissionName)
    ) {
      continue;
    }

    const caip25Permission = permissions[Caip25EndowmentPermissionName];
    if (
      !isObject(caip25Permission) ||
      !hasProperty(caip25Permission, 'caveats')
    ) {
      continue;
    }

    const { caveats } = caip25Permission;
    if (!Array.isArray(caveats)) {
      continue;
    }

    const caip25Caveat = caveats.find(
      (caveat) => caveat.type === Caip25CaveatType,
    );
    if (!caip25Caveat || !isObject(caip25Caveat.value)) {
      continue;
    }

    const allScopes = getAllScopesFromPermission(
      caip25Permission as {
        caveats: { type: string; value: Caip25CaveatValue }[];
      },
    );

    const validScopes = allScopes.filter((scope) =>
      filterScopes(scope, configuredChainIds),
    );

    // If no valid scopes remain, remove the subject entirely
    if (validScopes.length === 0) {
      delete subjects[_subjectKey];
      continue;
    }

    const { value } = caip25Caveat;
    const { requiredScopes = {}, optionalScopes = {} } =
      value as Caip25CaveatValue;

    const updatedRequiredScopes = Object.fromEntries(
      Object.entries(requiredScopes).filter(([scope]) =>
        filterScopes(scope, configuredChainIds),
      ),
    );

    const updatedOptionalScopes = Object.fromEntries(
      Object.entries(optionalScopes).filter(([scope]) =>
        filterScopes(scope, configuredChainIds),
      ),
    );

    caip25Caveat.value = {
      ...value,
      requiredScopes: updatedRequiredScopes,
      optionalScopes: updatedOptionalScopes,
    };
  }

  return state;
}

function filterScopes(scope: string, configuredChainIds: Set<string>) {
  if (scope.startsWith('wallet:') || !scope.startsWith('eip155:')) {
    return true;
  }

  const chainId = scope.split(':')[1];
  return configuredChainIds.has(chainId);
}
