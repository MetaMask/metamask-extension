import { cloneDeep } from 'lodash';

const version = 78;

/**
 * Fixes an issue with 077.js: tokensChainsCache should default to `{}` not `undefined`
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
  const TokenListController = state?.TokenListController || {};

  TokenListController.tokensChainsCache = TokenListController.tokensChainsCache || {};

  return {
    ...state,
    TokenListController: {
      ...TokenListController,
    },
  };
}
