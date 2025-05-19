import { cloneDeep } from 'lodash';
import { hasProperty, isObject } from '@metamask/utils';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 159;

/**
 * This migration removes the `shouldShowAggregatedBalancePopover` property from the PreferencesController state.
 *
 * If the PreferenceController is not valid (not found or is not an object), the migration logs an error,
 * however we will leave the state unchanged.
 *
 * @param originalVersionedData - The versioned extension state.
 * @returns The updated versioned extension state without the `PreferencesController.shouldShowAggregatedBalancePopover` property.
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
  if (!hasProperty(state, 'PreferencesController')) {
    global.sentry?.captureException?.(
      new Error(`Migration ${version}: PreferencesController not found.`),
    );
    return state;
  }

  const preferencesControllerState = state.PreferencesController;

  if (!isObject(preferencesControllerState)) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: PreferencesController is type '${typeof preferencesControllerState}', expected object.`,
      ),
    );
    return state;
  }

  if (
    hasProperty(
      preferencesControllerState,
      'shouldShowAggregatedBalancePopover',
    )
  ) {
    delete preferencesControllerState.shouldShowAggregatedBalancePopover;
  }

  return state;
}
