import { cloneDeep } from 'lodash';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 124;

export async function migrate(
  originalVersionedData: VersionedData,
): Promise<VersionedData> {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;
  transformState(versionedData.data);
  return versionedData;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformState(state: Record<string, any>) {
  const preferencesControllerState = state?.PreferencesController;

  if (preferencesControllerState?.preferences) {
    const isBasicFunctionalityToggleEnabled =
      preferencesControllerState?.useExternalServices;
    const isTokenDetectionEnabled =
      preferencesControllerState?.useTokenDetection;
    if (isBasicFunctionalityToggleEnabled && !isTokenDetectionEnabled) {
      preferencesControllerState.useTokenDetection = true;
    }
  }

  return state;
}
