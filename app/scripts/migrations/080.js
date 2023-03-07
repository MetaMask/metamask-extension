import { cloneDeep } from 'lodash';

const version = 80;

/**
 * The portfolio tooltip has been moved to a button on the home screen so
 * this property is no longer needed in state
 */
export default {
  version,
  async migrate(originalVersionedData) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    const state = versionedData.data;
    const newState = transformState(state);
    versionedData.data = newState;
    return versionedData;
  },
};

function transformState(state) {
  if (state?.metamask?.showPortfolioTooltip !== undefined) {
    delete state.metamask.showPortfolioTooltip;
  }

  return state;
}
