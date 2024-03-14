import { useMemo } from 'react';
import { toChecksumAddress } from 'ethereumjs-util';
import { shallowEqual, useSelector } from 'react-redux';
import { getTokenExchangeRates } from '../../../../selectors';
import { Numeric } from '../../../../../shared/modules/Numeric';
import { getConversionRate } from '../../../../ducks/metamask/metamask';

/**
 * A hook that returns the exchange rate of the given token –– assumes native if no token address is passed.
 *
 * @param tokenAddress - the address of the token. If not provided, the function will return the native exchange rate.
 * @returns the exchange rate of the token
 */
export default function useTokenExchangeRate(
  tokenAddress?: string,
): Numeric | undefined {
  const selectedNativeConversionRate = useSelector(getConversionRate);
  const nativeConversionRate = new Numeric(selectedNativeConversionRate, 10);

  const contractExchangeRates = useSelector(
    getTokenExchangeRates,
    shallowEqual,
  );

  return useMemo(() => {
    if (!tokenAddress) {
      return nativeConversionRate;
    }

    const contractExchangeRate =
      contractExchangeRates[toChecksumAddress(tokenAddress)];

    if (!contractExchangeRate) {
      return undefined;
    }

    return new Numeric(contractExchangeRate, 10).times(nativeConversionRate);
  }, [tokenAddress, nativeConversionRate, contractExchangeRates]);
}
