import { useCallback } from 'react';
import { Numeric } from '../../../../../shared/modules/Numeric';

const MAX_DECIMALS_TOKEN_SECONDARY = 6;

/**
 * A hook that creates a function which processes a new decimal value and returns the new fiat and token decimal values
 *
 * @param assetDecimals - The number of decimals that asset supports
 * @param isTokenPrimary - If the token is the input currency
 * @param tokenToFiatConversionRate - The conversion rate from the asset to the user's fiat currency
 * @returns A function that processes a new decimal value and returns the new fiat and token decimal values
 */
export default function useProcessNewDecimalValue(
  assetDecimals: number,
  isTokenPrimary: boolean,
  tokenToFiatConversionRate: Numeric | undefined,
) {
  return useCallback(
    (newDecimalValue: string, isTokenPrimaryOverride?: boolean) => {
      let newFiatDecimalValue, newTokenDecimalValue;

      const truncateToDecimals = (
        numeric: Numeric,
        maxDecimals = assetDecimals,
      ) => {
        const digitsAfterDecimal = numeric.toString().split('.')[1] || '';

        const maxPossibleDecimals = Math.min(maxDecimals, assetDecimals);

        const digitsCutoff = Math.min(
          digitsAfterDecimal.length,
          maxPossibleDecimals,
        );

        return numeric.toFixed(digitsCutoff);
      };

      const numericDecimalValue = new Numeric(newDecimalValue, 10);

      if (isTokenPrimaryOverride ?? isTokenPrimary) {
        newFiatDecimalValue = tokenToFiatConversionRate
          ? numericDecimalValue.times(tokenToFiatConversionRate).toFixed(2)
          : undefined;
        newTokenDecimalValue = truncateToDecimals(numericDecimalValue);
      } else {
        newFiatDecimalValue = numericDecimalValue.toFixed(2);
        newTokenDecimalValue = tokenToFiatConversionRate
          ? truncateToDecimals(
              numericDecimalValue.divide(tokenToFiatConversionRate),
              MAX_DECIMALS_TOKEN_SECONDARY,
            )
          : undefined;
      }

      return { newFiatDecimalValue, newTokenDecimalValue };
    },
    [tokenToFiatConversionRate?.toString(), isTokenPrimary, assetDecimals],
  );
}
