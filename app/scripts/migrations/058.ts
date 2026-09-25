/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any -- Legacy migration state remains loosely typed during JS-to-TS conversion. */
import { cloneDeep } from 'lodash';

type LegacyState = Record<string, any>;
type VersionedData = { meta: { version?: number }; data?: LegacyState };

const version = 58;

/**
 * Deletes the swapsWelcomeMessageHasBeenShown property from state
 */
const migration = {
  version,
  async migrate(originalVersionedData: VersionedData) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    const state = (versionedData.data ?? {}) as LegacyState;
    versionedData.data = transformState(state);
    return versionedData;
  },
};

export default migration;

function transformState(state: LegacyState) {
  delete state.AppStateController?.swapsWelcomeMessageHasBeenShown;

  return state;
}
