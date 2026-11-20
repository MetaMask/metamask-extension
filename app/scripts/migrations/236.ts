import { hasProperty, isObject } from '@metamask/utils';
import type { Migrate } from './types';

export const version = 236;

/**
 * Renames the persisted deferred deep-link URL without discarding pending links.
 *
 * @param versionedData - The persisted state to migrate.
 * @param changedKeys - The controllers whose changes must be persisted.
 */
export const migrate = (async (versionedData, changedKeys) => {
  versionedData.meta.version = version;

  const data = versionedData.data as Record<string, unknown>;
  const appState = data.AppStateController;
  if (!isObject(appState) || !isObject(appState.deferredDeepLink)) {
    return;
  }

  const { deferredDeepLink } = appState;
  if (!hasProperty(deferredDeepLink, 'referringLink')) {
    return;
  }

  if (!hasProperty(deferredDeepLink, 'originalUrl')) {
    deferredDeepLink.originalUrl = deferredDeepLink.referringLink;
  }
  delete deferredDeepLink.referringLink;
  changedKeys.add('AppStateController');
}) satisfies Migrate;
