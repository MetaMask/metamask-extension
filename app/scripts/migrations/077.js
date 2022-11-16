import { cloneDeep } from 'lodash';

const version = 77;

/**
 * Prior to token detection v2 the data property in tokensChainsCache was an array,
 * in v2 we changes that to an object. In this migration we are converting the data as array to object.
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

  const { tokensChainsCache } = TokenListController;

  let dataCache;
  let dataObject;
  // eslint-disable-next-line
  for (const chainId in tokensChainsCache) {
    dataCache = tokensChainsCache[chainId].data;
    dataObject = {};
    // if the data is array conver that to object
    if (Array.isArray(dataCache)) {
      for (const token of dataCache) {
        dataObject[token.address] = token;
      }
    } else if (
      Object.keys(dataCache)[0].toLowerCase() !==
      dataCache[Object.keys(dataCache)[0]].address.toLowerCase()
    ) {
      // for the users who already updated to the recent version
      // and the dataCache is already an object keyed with 0,1,2,3 etc
      // eslint-disable-next-line
      for (const tokenAddress in dataCache) {
        dataObject[dataCache[tokenAddress].address] = dataCache[tokenAddress];
      }
    }
    tokensChainsCache[chainId].data =
      Object.keys(dataObject).length > 0 ? dataObject : dataCache;
  }
  TokenListController.tokensChainsCache = tokensChainsCache;

  return {
    ...state,
    TokenListController: {
      ...TokenListController,
    },
  };
}
