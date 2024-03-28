import { useCallback } from 'react';
import { Numeric } from '../../../../../shared/modules/Numeric';

const MAX_DECIMALS_TOKEN_SECONDARY = 6;

const getNumDigitsAfterDecimal = (value: string) => {
  const digitsAfterDecimal = String(value).split('.')[1] || '';

  return digitsAfterDecimal.length;
};

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
    (newDecimalValue) => {
      let newFiatDecimalValue, newTokenDecimalValue;

      const truncateToDecimals = (
        numeric: Numeric,
        numDigitsAfterDecimal: number,
      ) => {
        const digitsCutoff = Math.min(numDigitsAfterDecimal, assetDecimals);

        return numeric.toFixed(digitsCutoff);
      };

      const numericDecimalValue = new Numeric(newDecimalValue, 10);

      if (isTokenPrimary) {
        newFiatDecimalValue = tokenToFiatConversionRate
          ? numericDecimalValue.times(tokenToFiatConversionRate).toFixed(2)
          : undefined;
        newTokenDecimalValue = truncateToDecimals(
          numericDecimalValue,
          getNumDigitsAfterDecimal(newDecimalValue),
        );
      } else {
        newFiatDecimalValue = numericDecimalValue.toFixed(2);

        const exactTokenValue = numericDecimalValue.divide(
          tokenToFiatConversionRate,
        );
        newTokenDecimalValue = tokenToFiatConversionRate
          ? truncateToDecimals(
              exactTokenValue,
              Math.min(
                getNumDigitsAfterDecimal(exactTokenValue.toString()),
                MAX_DECIMALS_TOKEN_SECONDARY,
              ),
            )
          : undefined;
      }

      return { newFiatDecimalValue, newTokenDecimalValue };
    },
    [tokenToFiatConversionRate, isTokenPrimary, assetDecimals],
  );
}
