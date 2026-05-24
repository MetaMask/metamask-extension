import { hasProperty, isObject } from '@metamask/utils';
import type { Migrate } from './types';

export const version = 201;

/**
 * This migration replaces `SnapsRegistry` with `SnapRegistryController`.
 *
 * @param versionedData - The versioned data object to migrate.
 * @param changedControllers - A set used to record controllers that were
 * modified.
 */
export const migrate = (async (versionedData, changedControllers) => {
  versionedData.meta.version = version;
  transformState(versionedData.data, changedControllers);
}) satisfies Migrate;

function transformState(
  state: Record<string, unknown>,
  changedControllers: Set<string>,
): void {
  if (!hasProperty(state, 'SnapsRegistry') || !isObject(state.SnapsRegistry)) {
    return;
  }

  const { SnapsRegistry } = state;

  state.SnapRegistryController = SnapsRegistry;
  delete state.SnapsRegistry;

  changedControllers.add('SnapRegistryController');
  changedControllers.add('SnapsRegistry');
}
