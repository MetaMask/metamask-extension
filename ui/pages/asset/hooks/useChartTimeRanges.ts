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
  const DEFAULT_TIME_RANGES = ['P1D', 'P1W', 'P1M', 'P3M', 'P1Y', 'P1000Y'];
  const isEvm = useSelector(getMultichainIsEvm);
  const historicalPricesNonEvm = useSelector(getHistoricalPrices);

  if (isEvm) {
    // On EVM, time ranges are hardcoded
    return DEFAULT_TIME_RANGES;
  }

  assert(caipAssetType, 'caipAssetType is required on non-EVM chains');
  assert(currency, 'currency is required on non-EVM chains');

  // On non-EVM, time ranges are the intervals defined in the the historicalPrices state
  const intervals =
    historicalPricesNonEvm[caipAssetType]?.[currency]?.intervals;

  if (!intervals) {
    return DEFAULT_TIME_RANGES;
  }

  return chain(intervals)
    .keys()
    .map((iso8601String) => Duration.fromISO(iso8601String)) // Convert to Duration object
    .filter((duration) => duration.isValid) // Filter out invalid durations
    .sortBy((duration) => duration.toMillis()) // Sort from shortest to longest
    .map((duration) => duration.toISO()) // Convert back to ISO string
    .filter((iso8601String): iso8601String is string => iso8601String !== null) // Filter out nulls
    .uniq() // Remove duplicates
    .value();
};
