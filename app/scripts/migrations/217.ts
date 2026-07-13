import { hasProperty, isObject } from '@metamask/utils';
import type { Migrate } from './types';

export const version = 217;

/**
 * Migration 217: clear any stored `advancedGasFee` from `PreferencesController`.
 *
 * The UI for saving advanced gas fee defaults (the "Save these values as my
 * default" option in the advanced gas fee popover) was removed in
 * https://github.com/MetaMask/metamask-extension/pull/41041, but the persisted
 * `advancedGasFee` values were left in place and are still applied to
 * transactions (via `getSavedGasFees`). With no UI to view or clear them, a
 * user who had previously saved an advanced gas fee (e.g. a low max base fee)
 * has every transaction underpriced, with no in-app way to fix it. This
 * migration clears those orphaned values.
 *
 * @param versionedData - Versioned MetaMask extension state; what we persist to disk.
 * @param changedControllers - A set used to record controllers that were modified.
 */
export const migrate = (async (versionedData, changedControllers) => {
  versionedData.meta.version = version;

  const data = versionedData.data as Record<string, unknown>;

  if (
    hasProperty(data, 'PreferencesController') &&
    isObject(data.PreferencesController) &&
    hasProperty(data.PreferencesController, 'advancedGasFee') &&
    isObject(data.PreferencesController.advancedGasFee) &&
    Object.keys(data.PreferencesController.advancedGasFee).length > 0
  ) {
    data.PreferencesController.advancedGasFee = {};
    changedControllers.add('PreferencesController');
  }
}) satisfies Migrate;

export default migrate;
