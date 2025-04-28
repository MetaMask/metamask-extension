import { CaipAssetType, assert } from '@metamask/utils';
import { chain } from 'lodash';
import { Duration } from 'luxon';
import { useSelector } from 'react-redux';
import { getHistoricalPrices } from '../../../selectors/assets';
import { getMultichainIsEvm } from '../../../selectors/multichain';

/**
 * Returns the list of time ranges (as ISO 8601 durations) to display in the historical prices chart for a given asset.
 *
 * On EVM, time ranges are hardcoded.
 * On non-EVM, time ranges are dynamically read from the historicalPrices object.
 *
 * @param caipAssetType - The caipAssetType of the asset. Only used on non-EVM chains.
 * @param currency - The currency of the asset. Only used on non-EVM chains.
 * @returns The time ranges available for the given asset, for instance: `['P1D', 'P7D', 'P1M', 'P3M', 'P1Y', 'P1000Y']`
 */
export const useChartTimeRanges = (
  caipAssetType?: CaipAssetType,
  currency?: string,
): string[] => {
  const isEvm = useSelector(getMultichainIsEvm);
  const historicalPricesNonEvm = useSelector(getHistoricalPrices);

  if (isEvm) {
    // On EVM, time ranges are hardcoded
    return ['P1D', 'P1W', 'P1M', 'P3M', 'P1Y', 'P1000Y'];
  }

  assert(caipAssetType, 'caipAssetType is required on non-EVM chains');
  assert(currency, 'currency is required on non-EVM chains');

  // On non-EVM, time ranges are the intervals defined in the the historicalPrices state
  const intervals =
    historicalPricesNonEvm[caipAssetType]?.[currency]?.intervals ?? {};

  return chain(intervals)
    .keys()
    .map((duration) => Duration.fromISO(duration)) // Convert to Duration object
    .filter((duration) => duration.isValid) // Filter out invalid durations
    .sortBy((duration) => duration.toMillis()) // Sort from shortest to longest
    .map((duration) => duration.toISO()) // Convert back to ISO string
    .uniq() // Remove duplicates
    .value();
};
