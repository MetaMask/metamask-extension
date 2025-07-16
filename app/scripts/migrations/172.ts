import { cloneDeep } from 'lodash';
import { hasProperty, isObject } from '@metamask/utils';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 172;

/**
 * This migration migrates "general" settings from the extension PreferencesController
 * to the new CorePreferencesController for cross-platform sync.
 *
 * Settings migrated:
 * - currentLocale
 * - theme
 * - useBlockie
 * - currentCurrency
 * - showNativeTokenAsMainBalance (from preferences object)
 * - hideZeroBalanceTokens (from preferences object)
 *
 * @param originalVersionedData - The versioned extension state.
 * @returns The updated versioned extension state with CorePreferencesController populated.
 */
export async function migrate(
  originalVersionedData: VersionedData,
): Promise<VersionedData> {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;

  versionedData.data = transformState(versionedData.data);

  return versionedData;
}

/**
 * Transforms the state by migrating general settings from PreferencesController
 * to CorePreferencesController.
 *
 * @param state - The extension state to transform.
 * @returns The transformed state.
 */
function transformState(state: Record<string, unknown>): Record<string, unknown> {
  // Skip migration if CorePreferencesController already exists
  if (hasProperty(state, 'CorePreferencesController')) {
    return state;
  }

  // Skip migration if PreferencesController doesn't exist
  if (!hasProperty(state, 'PreferencesController') || !isObject(state.PreferencesController)) {
    return state;
  }

  const preferencesController = state.PreferencesController;
  const preferences = hasProperty(preferencesController, 'preferences') &&
    isObject(preferencesController.preferences) ? preferencesController.preferences : {};

  // Extract general settings from extension PreferencesController
  const corePreferencesState = {
    currentLocale:
      hasProperty(preferencesController, 'currentLocale') &&
      typeof preferencesController.currentLocale === 'string'
        ? preferencesController.currentLocale
        : 'en',
    theme:
      hasProperty(preferencesController, 'theme') &&
      typeof preferencesController.theme === 'string'
        ? preferencesController.theme
        : 'auto',
    useBlockie:
      hasProperty(preferencesController, 'useBlockie') &&
      typeof preferencesController.useBlockie === 'boolean'
        ? preferencesController.useBlockie
        : false,
    currentCurrency:
      hasProperty(preferencesController, 'currentCurrency') &&
      typeof preferencesController.currentCurrency === 'string'
        ? preferencesController.currentCurrency
        : 'USD',
    showNativeTokenAsMainBalance:
      hasProperty(preferences, 'showNativeTokenAsMainBalance') &&
      typeof preferences.showNativeTokenAsMainBalance === 'boolean'
        ? preferences.showNativeTokenAsMainBalance
        : false,
    hideZeroBalanceTokens:
      hasProperty(preferences, 'hideZeroBalanceTokens') &&
      typeof preferences.hideZeroBalanceTokens === 'boolean'
        ? preferences.hideZeroBalanceTokens
        : false,
  };

  // Create CorePreferencesController state
  return {
    ...state,
    CorePreferencesController: corePreferencesState,
  };
}

export default { migrate, version };