import { getErrorMessage, hasProperty, isObject } from '@metamask/utils';
import { cloneDeep } from 'lodash';
import { captureException } from '../../../shared/lib/sentry';

export type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 209;

const Caip25CaveatType = 'authorizedScopes';
const Caip25EndowmentPermissionName = 'endowment:caip25';
const EIP1193_COMPATIBLE_SESSION_PROPERTY = 'eip1193-compatible';
const EIP155_NAMESPACE_PREFIX = 'eip155:';

/**
 * Migration 209: backfill the `eip1193-compatible` CAIP-25 session property
 * for every existing dapp connection that has any `eip155:*` scope.
 *
 * Without this, after upgrading to a build that gates the EVM network picker
 * on `sessionProperties['eip1193-compatible']`, any pre-existing connection
 * (which never went through `wallet_createSession` with that property) would
 * lose its network picker until the user disconnects and reconnects.
 *
 * Connections with no EVM scope (e.g. Solana-only) are left unchanged so the
 * picker stays hidden for them.
 *
 * @param versionedData - Versioned MetaMask extension state, exactly what we
 * persist to disk.
 * @param localChangedControllers - A set of controller keys that have been
 * changed by the migration.
 */
export async function migrate(
  versionedData: VersionedData,
  localChangedControllers: Set<string>,
): Promise<void> {
  versionedData.meta.version = version;
  const changedVersionedData = cloneDeep(versionedData);
  const changedLocalChangedControllers = new Set<string>();

  try {
    transformState(changedVersionedData.data, changedLocalChangedControllers);
    versionedData.data = changedVersionedData.data;
    changedLocalChangedControllers.forEach((controller) =>
      localChangedControllers.add(controller),
    );
  } catch (error) {
    console.error(error);
    captureException(
      new Error(`Migration #${version}: ${getErrorMessage(error)}`),
    );
    // Even though we encountered an error, we need the migration to pass for
    // the migrator tests to work.
  }
}

export default migrate;

function transformState(
  state: Record<string, unknown>,
  changedLocalChangedControllers: Set<string>,
): void {
  if (
    !hasProperty(state, 'PermissionController') ||
    !isObject(state.PermissionController)
  ) {
    return;
  }

  const { PermissionController } = state;
  if (
    !hasProperty(PermissionController, 'subjects') ||
    !isObject(PermissionController.subjects)
  ) {
    return;
  }

  const { subjects } = PermissionController;
  let didChange = false;

  for (const subject of Object.values(subjects)) {
    if (!isObject(subject) || !hasProperty(subject, 'permissions')) {
      continue;
    }
    const { permissions } = subject;
    if (!isObject(permissions)) {
      continue;
    }

    const caip25Permission = permissions[Caip25EndowmentPermissionName];
    if (
      !isObject(caip25Permission) ||
      !Array.isArray(caip25Permission.caveats)
    ) {
      continue;
    }

    for (const caveat of caip25Permission.caveats) {
      if (
        !isObject(caveat) ||
        caveat.type !== Caip25CaveatType ||
        !isObject(caveat.value)
      ) {
        continue;
      }

      if (!hasAnyEip155Scope(caveat.value)) {
        continue;
      }

      const sessionProperties = isObject(caveat.value.sessionProperties)
        ? caveat.value.sessionProperties
        : {};

      if (
        sessionProperties[EIP1193_COMPATIBLE_SESSION_PROPERTY] !== undefined
      ) {
        continue;
      }

      caveat.value.sessionProperties = {
        ...sessionProperties,
        [EIP1193_COMPATIBLE_SESSION_PROPERTY]: true,
      };
      didChange = true;
    }
  }

  if (didChange) {
    changedLocalChangedControllers.add('PermissionController');
  }
}

function hasAnyEip155Scope(caveatValue: Record<string, unknown>): boolean {
  return (
    hasEip155Key(caveatValue.requiredScopes) ||
    hasEip155Key(caveatValue.optionalScopes)
  );
}

function hasEip155Key(scopes: unknown): boolean {
  if (!isObject(scopes)) {
    return false;
  }
  return Object.keys(scopes).some((key) =>
    key.startsWith(EIP155_NAMESPACE_PREFIX),
  );
}
