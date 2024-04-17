import { cloneDeep } from 'lodash';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 116;

/**
 * As we have removed Product tour from Home Page so this migration is to remove showProductTour from AppState
 */
export async function migrate(
  originalVersionedData: VersionedData,
): Promise<VersionedData> {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;
  transformState(versionedData.data);
  return versionedData;
}

function transformState(state: Record<string, any>) {
  if (state?.AppStateController?.showProductTour !== undefined) {
    delete state.AppStateController.showProductTour;
  }
  return state;
}
