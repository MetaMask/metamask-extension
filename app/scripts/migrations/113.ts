import { cloneDeep } from 'lodash';
import { hasProperty, isObject } from '@metamask/utils';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 113;

/**
 * This migration set preference PreferencesController.useNativeCurrencyAsPrimaryCurrency to true.
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

function transformState(state: any) {
  if (!hasProperty(state, 'PreferencesController')) {
    return state;
  }

  if (!isObject(state.PreferencesController)) {
    global.sentry?.captureException?.(
      new Error(
        `state.PreferencesController is type: ${typeof state.PreferencesController}`,
      ),
    );
    return state;
  }
  if (!hasProperty(state.PreferencesController, 'preferences')) {
    global.sentry?.captureException?.(
      new Error(
        `state.PreferencesController.preferences is missing from PreferencesController state`,
      ),
    );
    return state;
  }
  if (
    !hasProperty(
      state.PreferencesController.preferences,
      'useNativeCurrencyAsPrimaryCurrency',
    )
  ) {
    global.sentry?.captureException?.(
      new Error(
        `state.PreferencesController.preferences.useNativeCurrencyAsPrimaryCurrency is missing from PreferencesController state`,
      ),
    );
    return state;
  }
  if (
    typeof state.PreferencesController.preferences
      .useNativeCurrencyAsPrimaryCurrency !== 'boolean'
  ) {
    global.sentry?.captureException?.(
      new Error(
        `state.PreferencesController.useNativeCurrencyAsPrimaryCurrency is type: ${typeof state
          .PreferencesController.preferences
          .useNativeCurrencyAsPrimaryCurrency}`,
      ),
    );
    return state;
  }

  if (
    state.PreferencesController.preferences
      .useNativeCurrencyAsPrimaryCurrency === false
  ) {
    state.PreferencesController.preferences.useNativeCurrencyAsPrimaryCurrency =
      true;
    return state;
  }
  return state;
}
