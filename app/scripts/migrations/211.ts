import { getErrorMessage, hasProperty, isObject } from '@metamask/utils';
import { captureException } from '../../../shared/lib/sentry';
import type { Migrate } from './types';

export const version = 211;

const Caip25CaveatType = 'authorizedScopes';
const Caip25EndowmentPermissionName = 'endowment:caip25';
const EIP1193_COMPATIBLE_SESSION_PROPERTY = 'eip1193-compatible';
const EIP155_NAMESPACE_PREFIX = 'eip155:';

/**
 * Migration 211: backfill the `eip1193-compatible` CAIP-25 session property
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
 * @param versionedData - The versioned data object to migrate.
 * @param changedControllers - A set used to record controllers that were modified.
 */
export const migrate = (async (versionedData, changedControllers) => {
  versionedData.meta.version = version;
  try {
    transformState(versionedData.data, changedControllers);
  } catch (error) {
    captureException(
      new Error(`Migration #${version}: ${getErrorMessage(error)}`),
    );
  }
}) satisfies Migrate;

function transformState(
  state: Record<string, unknown>,
  changedControllers: Set<string>,
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
    changedControllers.add('PermissionController');
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
