import { cloneDeep, isObject } from 'lodash';
import { hasProperty } from '@metamask/utils';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 115;

/**
 * As we have removed Product tour from Home Page so this migration is to remove showProductTour from AppState
 *
 * @param originalVersionedData
 */
export async function migrate(
  originalVersionedData: VersionedData,
): Promise<VersionedData> {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;
  transformState(versionedData.data);
  return versionedData;
}

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformState(state: Record<string, any>) {
  const AppStateController = state?.AppStateController || {};

  if (
    hasProperty(state, 'AppStateController') &&
    isObject(state.AppStateController) &&
    hasProperty(state.AppStateController, 'showProductTour') &&
    state.AppStateController.showProductTour !== undefined
  ) {
    delete AppStateController.showProductTour;
  }

  return {
    ...state,
    AppStateController,
  };
}
