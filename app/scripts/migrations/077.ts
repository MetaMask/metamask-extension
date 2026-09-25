/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any -- Legacy migration state remains loosely typed during JS-to-TS conversion. */
import { cloneDeep } from 'lodash';
import log from 'loglevel';
import { hasProperty, isObject } from '@metamask/utils';
import transformState077For082 from './077-supplements/077-supplement-for-082';
import transformState077For084 from './077-supplements/077-supplement-for-084';
import transformState077For086 from './077-supplements/077-supplement-for-086';
import transformState077For088 from './077-supplements/077-supplement-for-088';

type LegacyState = Record<string, any>;
type VersionedData = { meta: { version?: number }; data?: LegacyState };

const version = 77;

/**
 * Prior to token detection v2 the data property in tokensChainsCache was an array,
 * and in v2 we changed that to an object. In this migration we are converting
 * the data from an array to an object.
 */
const migration = {
  version,
  async migrate(originalVersionedData: VersionedData) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    const state = (versionedData.data ?? {}) as LegacyState;
    let newState = transformState(state);

    newState = transformState077For082(newState);
    newState = transformState077For084(newState);
    newState = transformState077For086(newState);
    newState = transformState077For088(newState);

    versionedData.data = newState;
    return versionedData;
  },
};

export default migration;

function transformState(state: LegacyState) {
  if (!hasProperty(state, 'TokenListController')) {
    log.warn('Skipping migration, TokenListController state is missing');
    return state;
  } else if (!isObject(state.TokenListController)) {
    global.sentry?.captureException?.(
      new Error(
        `typeof state.TokenListController is ${typeof state.TokenListController}`,
      ),
    );
    return state;
  } else if (!hasProperty(state.TokenListController, 'tokensChainsCache')) {
    log.warn(
      'Skipping migration, TokenListController.tokensChainsCache state is missing',
    );
    return state;
  }
  const { TokenListController } = state;
  const { tokensChainsCache } = TokenListController;

  let dataCache;
  let dataObject;
  // eslint-disable-next-line
  for (const chainId in tokensChainsCache) {
    dataCache = tokensChainsCache[chainId].data || {};
    dataObject = {};
    // if the data is array convert that to object
    if (Array.isArray(dataCache)) {
      for (const token of dataCache) {
        if (token?.address) {
          dataObject[token.address] = token;
        }
      }
    } else if (
      Object.keys(dataCache)[0]?.toLowerCase() !==
      dataCache[Object.keys(dataCache)[0]]?.address?.toLowerCase()
    ) {
      // for the users who already updated to the recent version
      // and the dataCache is already an object keyed with 0,1,2,3 etc
      // eslint-disable-next-line
      for (const tokenAddress in dataCache) {
        const token = dataCache[tokenAddress];
        if (token?.address) {
          dataObject[token.address] = token;
        }
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
