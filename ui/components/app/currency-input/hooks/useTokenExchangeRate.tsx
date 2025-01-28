import { useMemo, useState } from 'react';
import { toChecksumAddress } from 'ethereumjs-util';
import { shallowEqual, useSelector } from 'react-redux';
import { getCurrentChainId } from '../../../../../shared/modules/selectors/networks';
import { getTokenExchangeRates } from '../../../../selectors';
import { Numeric } from '../../../../../shared/modules/Numeric';
import {
  getConversionRate,
  getNativeCurrency,
} from '../../../../ducks/metamask/metamask';
import { fetchTokenExchangeRates } from '../../../../helpers/utils/util';

type ExchangeRate = number | typeof LOADING | typeof FAILED | undefined;

const LOADING = 'loading';
const FAILED = 'failed';

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

  const contractExchangeRates: Record<string, number> = useSelector(
    getTokenExchangeRates,
    shallowEqual,
  );

  const [exchangeRates, setExchangeRates] = useState<
    Record<string, ExchangeRate>
  >({});

  return useMemo(() => {
    if (!selectedNativeConversionRate) {
      return undefined;
    }

    const nativeConversionRate = new Numeric(selectedNativeConversionRate, 10);

    if (!tokenAddress) {
      return nativeConversionRate;
    }

    const isLoadingOrUnavailable = tokenAddress
      ? ([LOADING, FAILED] as ExchangeRate[]).includes(
          exchangeRates[tokenAddress],
        )
      : false;

    if (isLoadingOrUnavailable) {
      return undefined;
    }

    const contractExchangeRate =
      contractExchangeRates[tokenAddress] || exchangeRates[tokenAddress];

    if (!contractExchangeRate) {
      setExchangeRates((prev) => ({
        ...prev,
        [tokenAddress]: LOADING,
      }));
      fetchTokenExchangeRates(nativeCurrency, [tokenAddress], chainId)
        .then((addressToExchangeRate) => {
          setExchangeRates((prev) => ({
            ...prev,
            [tokenAddress]: addressToExchangeRate[tokenAddress] || FAILED,
          }));
        })
        .catch(() => {
          setExchangeRates((prev) => ({
            ...prev,
            [tokenAddress]: FAILED,
          }));
        });
      return undefined;
    }

    return new Numeric(contractExchangeRate, 10).times(nativeConversionRate);
  }, [
    exchangeRates,
    chainId,
    nativeCurrency,
    tokenAddress,
    selectedNativeConversionRate,
    contractExchangeRates,
  ]);
}
