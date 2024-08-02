import { cloneDeep } from 'lodash';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 125;

export async function migrate(
  originalVersionedData: VersionedData,
): Promise<VersionedData> {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;
  transformState(versionedData.data);
  return versionedData;
}

function transformState(state: Record<string, unknown>) {
  const preferencesControllerState = state?.PreferencesController as
    | Record<string, unknown>
    | undefined;

  if (preferencesControllerState) {
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
