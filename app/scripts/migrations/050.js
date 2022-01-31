import { cloneDeep } from 'lodash';

const version = 50;

const LEGACY_LOCAL_STORAGE_KEYS = [
  'METASWAP_GAS_PRICE_ESTIMATES_LAST_RETRIEVED',
  'METASWAP_GAS_PRICE_ESTIMATES',
  'cachedFetch',
  'BASIC_PRICE_ESTIMATES_LAST_RETRIEVED',
  'BASIC_PRICE_ESTIMATES',
  'BASIC_GAS_AND_TIME_API_ESTIMATES',
  'BASIC_GAS_AND_TIME_API_ESTIMATES_LAST_RETRIEVED',
  'GAS_API_ESTIMATES_LAST_RETRIEVED',
  'GAS_API_ESTIMATES',
];

/**
 * Migrate metaMetrics state to the new MetaMetrics controller
 */
export default {
  version,
  async migrate(originalVersionedData) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;

    LEGACY_LOCAL_STORAGE_KEYS.forEach((key) =>
      window.localStorage?.removeItem(key),
    );

    return versionedData;
  },
};
