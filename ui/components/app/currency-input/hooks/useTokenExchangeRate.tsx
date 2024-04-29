import { useMemo, useState } from 'react';
import { toChecksumAddress } from 'ethereumjs-util';
import { shallowEqual, useSelector } from 'react-redux';
import {
  getCurrentChainId,
  getCurrentCurrency,
  getTokenExchangeRates,
} from '../../../../selectors';
import { Numeric } from '../../../../../shared/modules/Numeric';
import { getConversionRate } from '../../../../ducks/metamask/metamask';
import { fetchTokenExchangeRates } from '../../../../helpers/utils/util';

/**
 * A hook that returns the exchange rate of the given token –– assumes native if no token address is passed.
 *
 * @param uncheckedTokenAddress - the address of the token. If not provided, the function will return the native exchange rate.
 * @returns the exchange rate of the token
 */
export default function useTokenExchangeRate(
  uncheckedTokenAddress?: string,
): Numeric | undefined {
  const tokenAddress = uncheckedTokenAddress
    ? toChecksumAddress(uncheckedTokenAddress)
    : undefined;
  const currentCurrency = useSelector(getCurrentCurrency);
  const chainId = useSelector(getCurrentChainId);

  const selectedNativeConversionRate = useSelector(getConversionRate);
  const nativeConversionRate = new Numeric(selectedNativeConversionRate, 10);

  const contractExchangeRates = useSelector(
    getTokenExchangeRates,
    shallowEqual,
  );

  const [exchangeRate, setExchangeRate] = useState<number | undefined>();

  return useMemo(() => {
    if (!tokenAddress) {
      return nativeConversionRate;
    }

    const contractExchangeRate =
      contractExchangeRates[tokenAddress] || exchangeRate;

    if (!contractExchangeRate) {
      fetchTokenExchangeRates(currentCurrency, [tokenAddress], chainId).then(
        (addressToExchangeRate) => {
          setExchangeRate(addressToExchangeRate[tokenAddress]);
        },
      );
      return undefined;
    }

    return new Numeric(contractExchangeRate, 10).times(nativeConversionRate);
  }, [
    exchangeRate,
    chainId,
    currentCurrency,
    tokenAddress,
    nativeConversionRate,
    contractExchangeRates,
  ]);
}
