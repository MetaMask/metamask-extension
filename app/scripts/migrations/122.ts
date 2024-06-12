import { cloneDeep, isObject } from 'lodash';
import { hasProperty } from '@metamask/utils';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 122;

/**
 * As we have removed Unconnected Account component so this migration is to remove unconnectedAccount from state
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformState(state: Record<string, any>) {
  const AlertController = state?.AlertController || {};

  if (
    hasProperty(state, 'AlertController') &&
    isObject(state.AlertController) &&
    hasProperty(state.AlertController, 'unconnectedAccount') &&
    state.AlertController.unconnectedAccount !== undefined
  ) {
    delete AlertController.unconnectedAccount;
  }

  return {
    ...state,
    AlertController,
  };
}
