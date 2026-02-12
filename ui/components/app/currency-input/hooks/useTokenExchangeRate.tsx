import { useMemo, useState } from 'react';
import { toChecksumAddress } from 'ethereumjs-util';
import { shallowEqual, useSelector } from 'react-redux';
import { Hex } from '@metamask/utils';
import { getCurrentChainId } from '../../../../../shared/modules/selectors/networks';
import {
  getCrossChainTokenExchangeRates,
  selectConversionRateByChainId,
  selectNetworkConfigurationByChainId,
} from '../../../../selectors';
import { Numeric } from '../../../../../shared/modules/Numeric';
import { fetchTokenExchangeRates } from '../../../../helpers/utils/util';

type ExchangeRate = number | typeof LOADING | typeof FAILED | undefined;

const LOADING = 'loading';
const FAILED = 'failed';

/**
 * A hook that returns the exchange rate of the given token –– assumes native if no token address is passed.
 *
 * @param uncheckedTokenAddress - the address of the token. If not provided, the function will return the native exchange rate.
 * @param overrideChainId - optional chainId to use instead of the currently selected chain. Useful when displaying values for a transaction on a different chain.
 * @returns the exchange rate of the token
 */
export default function useTokenExchangeRate(
  uncheckedTokenAddress?: string,
  overrideChainId?: Hex,
): Numeric | undefined {
  const tokenAddress = uncheckedTokenAddress
    ? toChecksumAddress(uncheckedTokenAddress)
    : undefined;

  const currentChainId = useSelector(getCurrentChainId);
  const chainId = overrideChainId ?? currentChainId;

  const networkConfig = useSelector((state) =>
    selectNetworkConfigurationByChainId(state, chainId),
  );
  const nativeCurrency = networkConfig?.nativeCurrency;

  const selectedNativeConversionRate = useSelector((state) =>
    selectConversionRateByChainId(state, chainId),
  );

  const crossChainTokenExchangeRates: Record<
    Hex,
    Record<string, number>
  > = useSelector(getCrossChainTokenExchangeRates, shallowEqual);

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

    // Cache key includes chainId to prevent cross-chain rate contamination
    const cacheKey = `${chainId}-${tokenAddress}`;

    const isLoadingOrUnavailable = tokenAddress
      ? ([LOADING, FAILED] as ExchangeRate[]).includes(exchangeRates[cacheKey])
      : false;

    if (isLoadingOrUnavailable) {
      return undefined;
    }

    const contractExchangeRates = crossChainTokenExchangeRates[chainId] ?? {};
    const contractExchangeRate =
      contractExchangeRates[tokenAddress] || exchangeRates[cacheKey];

    if (!contractExchangeRate) {
      // TODO: Fix "Calling setState from useMemo may trigger an infinite loop"
      // eslint-disable-next-line react-compiler/react-compiler
      setExchangeRates((prev) => ({
        ...prev,
        [cacheKey]: LOADING,
      }));
      fetchTokenExchangeRates(nativeCurrency, [tokenAddress], chainId)
        .then((addressToExchangeRate) => {
          setExchangeRates((prev) => ({
            ...prev,
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
            [cacheKey]: addressToExchangeRate[tokenAddress] || FAILED,
          }));
        })
        .catch(() => {
          setExchangeRates((prev) => ({
            ...prev,
            [cacheKey]: FAILED,
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
    crossChainTokenExchangeRates,
  ]);
}
