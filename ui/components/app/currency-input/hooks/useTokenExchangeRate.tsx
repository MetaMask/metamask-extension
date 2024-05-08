import { useMemo, useState } from 'react';
import { toChecksumAddress } from 'ethereumjs-util';
import { shallowEqual, useSelector } from 'react-redux';
import {
  getCurrentChainId,
  getTokenExchangeRates,
} from '../../../../selectors';
import { Numeric } from '../../../../../shared/modules/Numeric';
import {
  getConversionRate,
  getNativeCurrency,
} from '../../../../ducks/metamask/metamask';
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
  const nativeCurrency = useSelector(getNativeCurrency);
  const chainId = useSelector(getCurrentChainId);

  const selectedNativeConversionRate = useSelector(getConversionRate);
  const nativeConversionRate = new Numeric(selectedNativeConversionRate, 10);

  const contractExchangeRates = useSelector(
    getTokenExchangeRates,
    shallowEqual,
  );

  const [exchangeRates, setExchangeRates] = useState<
    Record<string, number | undefined>
  >({});

  const [loadingExchangeRates, setLoadingExchangeRates] = useState<
    Record<string, boolean>
  >({});

  return useMemo(() => {
    if (!tokenAddress) {
      return nativeConversionRate;
    }

    const contractExchangeRate =
      contractExchangeRates[tokenAddress] || exchangeRates[tokenAddress];

    if (!contractExchangeRate && !loadingExchangeRates[tokenAddress]) {
      const setLoadingState = (value: boolean) => {
        setLoadingExchangeRates((prev) => ({
          ...prev,
          [tokenAddress]: value,
        }));
      };

      setLoadingState(true);
      fetchTokenExchangeRates(nativeCurrency, [tokenAddress], chainId)
        .then((addressToExchangeRate) => {
          setLoadingState(false);
          setExchangeRates((prev) => ({
            ...prev,
            ...addressToExchangeRate,
          }));
        })
        .catch(() => {
          setLoadingState(false);
        });
      return undefined;
    }

    return new Numeric(contractExchangeRate, 10).times(nativeConversionRate);
  }, [
    exchangeRates,
    chainId,
    nativeCurrency,
    tokenAddress,
    nativeConversionRate,
    contractExchangeRates,
    loadingExchangeRates,
  ]);
}
