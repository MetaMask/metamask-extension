import { cloneDeep, isObject } from 'lodash';
import { hasProperty } from '@metamask/utils';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 122;

/**
 * As we have updated the survey link for Q2 so this migration is to remove surveyLinkLastClickedOrClosed from AppState
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
  const AppStateController = state?.AppStateController || {};

  if (
    hasProperty(state, 'AppStateController') &&
    isObject(state.AppStateController) &&
    hasProperty(state.AppStateController, 'surveyLinkLastClickedOrClosed') &&
    state.AppStateController.surveyLinkLastClickedOrClosed !== undefined
  ) {
    delete AppStateController.surveyLinkLastClickedOrClosed;
  }

  return {
    ...state,
    AppStateController,
  };
}
