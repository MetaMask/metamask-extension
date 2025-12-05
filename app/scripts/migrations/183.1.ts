import { getErrorMessage, hasProperty, isObject } from '@metamask/utils';
import { cloneDeep } from 'lodash';
import { captureException } from '../../../shared/lib/sentry';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 183.1;

/**
 * This migration rounds conversionRate and usdConversionRate values in CurrencyController
 * to a maximum of 9 decimal places to prevent precision issues.
 *
 * @param originalVersionedData - The original MetaMask extension state.
 * @returns Updated versioned MetaMask extension state.
 */
export async function migrate(
  originalVersionedData: VersionedData,
): Promise<VersionedData> {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;

  try {
    transformState(versionedData.data);
  } catch (error) {
    console.error(error);
    const newError = new Error(
      `Migration #${version}: ${getErrorMessage(error)}`,
    );
    captureException(newError);
    // Even though we encountered an error, we need the migration to pass for
    // the migrator tests to work
    versionedData.data = originalVersionedData.data;
  }

  return versionedData;
}

/**
 * Rounds a number to a specified precision (maximum decimal places)
 *
 * @param value - The number to round
 * @param precision - The maximum number of decimal places (default: 9)
 * @returns The rounded number
 */
function boundedPrecisionNumber(value: number, precision = 9): number {
  return Number(value.toFixed(precision));
}

function transformState(state: Record<string, unknown>) {
  if (!hasProperty(state, 'CurrencyController')) {
    console.warn(`Migration ${version}: CurrencyController not found.`);
    return state;
  }

  const currencyController = state.CurrencyController;
  if (!isObject(currencyController)) {
    captureException(
      new Error(
        `Migration ${version}: CurrencyController is not an object: ${typeof currencyController}`,
      ),
    );
    return state;
  }

  if (!hasProperty(currencyController, 'currencyRates')) {
    console.warn(
      `Migration ${version}: currencyRates not found in CurrencyController.`,
    );
    return state;
  }

  const { currencyRates } = currencyController;
  if (!isObject(currencyRates)) {
    captureException(
      new Error(
        `Migration ${version}: currencyRates is not an object: ${typeof currencyRates}`,
      ),
    );
    return state;
  }

  // Iterate through each currency and round conversionRate and usdConversionRate values
  Object.keys(currencyRates).forEach((currency) => {
    const rateData = currencyRates[currency];
    if (isObject(rateData)) {
      // Handle conversionRate
      if (hasProperty(rateData, 'conversionRate')) {
        const { conversionRate } = rateData;
        if (typeof conversionRate === 'number') {
          // Check if the number has more than 9 decimal places
          const decimalPlaces =
            conversionRate.toString().split('.')[1]?.length || 0;
          if (decimalPlaces > 9) {
            rateData.conversionRate = boundedPrecisionNumber(conversionRate);
          }
        }
      }

      // Handle usdConversionRate
      if (hasProperty(rateData, 'usdConversionRate')) {
        const { usdConversionRate } = rateData;
        if (typeof usdConversionRate === 'number') {
          // Check if the number has more than 9 decimal places
          const decimalPlaces =
            usdConversionRate.toString().split('.')[1]?.length || 0;
          if (decimalPlaces > 9) {
            rateData.usdConversionRate =
              boundedPrecisionNumber(usdConversionRate);
          }
        }
      }
    }
  });

  return state;
}
