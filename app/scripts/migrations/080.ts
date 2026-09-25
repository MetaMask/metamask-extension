/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any -- Legacy migration state remains loosely typed during JS-to-TS conversion. */
import { cloneDeep } from 'lodash';

type LegacyState = Record<string, any>;
type VersionedData = { meta: { version?: number }; data?: LegacyState };

const version = 80;

/**
 * The portfolio tooltip has been moved to a button on the home screen so
 * this property is no longer needed in state
 */
const migration = {
  version,
  async migrate(originalVersionedData: VersionedData) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    const state = (versionedData.data ?? {}) as LegacyState;
    const newState = transformState(state);
    versionedData.data = newState;
    return versionedData;
  },
};

export default migration;

function transformState(state: LegacyState) {
  if (state?.metamask?.showPortfolioTooltip !== undefined) {
    delete state.metamask.showPortfolioTooltip;
  }

  return state;
}
