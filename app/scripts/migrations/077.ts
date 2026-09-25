import { cloneDeep } from 'lodash';
import log from 'loglevel';
import { hasProperty, isObject } from '@metamask/utils';
import transformState077For082 from './077-supplements/077-supplement-for-082';
import transformState077For084 from './077-supplements/077-supplement-for-084';
import transformState077For086 from './077-supplements/077-supplement-for-086';
import transformState077For088 from './077-supplements/077-supplement-for-088';
import type { LegacyMigration, MigrationState } from '../lib/migrator';
import type { LegacyState } from './legacy-migration-utils';
const version = 77;

/**
 * Prior to token detection v2 the data property in tokensChainsCache was an array,
 * and in v2 we changed that to an object. In this migration we are converting
 * the data from an array to an object.
 */
export default {
  version,
  async migrate(originalVersionedData: MigrationState) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    const state = versionedData.data as LegacyState;
    let newState = transformState(state);

    newState = transformState077For082(newState);
    newState = transformState077For084(newState);
    newState = transformState077For086(newState);
    newState = transformState077For088(newState);

    versionedData.data = newState;
    return versionedData;
  },
} satisfies LegacyMigration;

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

  let dataCache: Record<string, unknown> | unknown[];
  let dataObject: Record<string, Record<string, unknown>>;
  // eslint-disable-next-line
  for (const chainId in tokensChainsCache) {
    const cacheEntry = tokensChainsCache[chainId]?.data;
    dataCache = Array.isArray(cacheEntry)
      ? cacheEntry
      : isObject(cacheEntry)
        ? cacheEntry
        : {};
    dataObject = {};
    // if the data is array convert that to object
    if (Array.isArray(dataCache)) {
      for (const token of dataCache) {
        if (
          isObject(token) &&
          typeof token.address === 'string' &&
          token.address
        ) {
          dataObject[token.address] = token as Record<string, unknown>;
        }
      }
    } else if (!Array.isArray(dataCache)) {
      const firstCacheKey = Object.keys(dataCache)[0];
      const firstCacheEntry = firstCacheKey
        ? dataCache[firstCacheKey]
        : undefined;
      const firstTokenAddress =
        isObject(firstCacheEntry) && typeof firstCacheEntry.address === 'string'
          ? firstCacheEntry.address.toLowerCase()
          : undefined;
      if (firstCacheKey?.toLowerCase() !== firstTokenAddress) {
        // for the users who already updated to the recent version
        // and the dataCache is already an object keyed with 0,1,2,3 etc
        // eslint-disable-next-line
        for (const tokenAddress in dataCache) {
          const token = dataCache[tokenAddress];
          if (
            isObject(token) &&
            typeof token.address === 'string' &&
            token.address
          ) {
            dataObject[token.address] = token;
          }
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
