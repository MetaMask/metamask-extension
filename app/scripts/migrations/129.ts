import { hasProperty, isObject } from '@metamask/utils';
import { cloneDeep } from 'lodash';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 129;

/**
 * This migration adds `shouldShowAggregatedBalancePopover` to preferences in PreferencesController and set it to true when its undefined.
 *
 * @param originalVersionedData - Versioned MetaMask extension state, exactly what we persist to dist.
 * @param originalVersionedData.meta - State metadata.
 * @param originalVersionedData.meta.version - The current state version.
 * @param originalVersionedData.data - The persisted MetaMask state, keyed by controller.
 * @returns Updated versioned MetaMask extension state.
 */
export async function migrate(
  originalVersionedData: VersionedData,
): Promise<VersionedData> {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;
  transformState(versionedData.data);
  return versionedData;
}

function transformState(
  state: Record<string, unknown>,
): Record<string, unknown> {
  if (
    hasProperty(state, 'PreferencesController') &&
    isObject(state.PreferencesController) &&
    isObject(state.PreferencesController.preferences)
  ) {
    if (
      state.PreferencesController.preferences
        .shouldShowAggregatedBalancePopover === undefined
    ) {
      state.PreferencesController.preferences.shouldShowAggregatedBalancePopover = true;
    }
  }

  return state;
}
