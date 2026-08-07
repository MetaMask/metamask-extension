import { useEffect, useMemo, useRef, useState } from 'react';
import { toChecksumAddress } from 'ethereumjs-util';
import { shallowEqual, useSelector } from 'react-redux';
import { Hex } from '@metamask/utils';
import {
  getCurrentChainId,
  selectNetworkConfigurationByChainId,
  type NetworkConfigurationsByChainIdState,
} from '../../../../../shared/lib/selectors/networks';
import {
  getCrossChainTokenExchangeRates,
  selectConversionRateByChainId,
} from '../../../../selectors';
import { Numeric } from '../../../../../shared/lib/Numeric';
import { fetchTokenExchangeRates } from '../../../../helpers/utils/util';

type ExchangeRate = number | typeof FAILED | undefined;

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

  const networkConfig = useSelector(
    (state: NetworkConfigurationsByChainIdState) =>
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

  // Track in-flight fetches to avoid duplicate requests and synchronous setState in effects
  const fetchingKeys = useRef<Set<string>>(new Set());

  // Cache key includes chainId to prevent cross-chain rate contamination
  const cacheKey = tokenAddress ? `${chainId}-${tokenAddress}` : undefined;

  const contractExchangeRates = crossChainTokenExchangeRates[chainId] ?? {};
  const contractExchangeRate =
    tokenAddress &&
    (contractExchangeRates[tokenAddress] ||
      (cacheKey ? exchangeRates[cacheKey] : undefined));

  const isUnavailable =
    cacheKey && (exchangeRates[cacheKey] as ExchangeRate) === FAILED;

  useEffect(() => {
    if (
      !tokenAddress ||
      !cacheKey ||
      contractExchangeRate ||
      isUnavailable ||
      fetchingKeys.current.has(cacheKey)
    ) {
      return undefined;
    }

    let cancelled = false;
    const { current: inFlightKeys } = fetchingKeys;
    inFlightKeys.add(cacheKey);

    fetchTokenExchangeRates(nativeCurrency, [tokenAddress], chainId)
      .then((addressToExchangeRate) => {
        if (!cancelled) {
          setExchangeRates((prev) => ({
            ...prev,
            [cacheKey]: addressToExchangeRate[tokenAddress] || FAILED,
          }));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setExchangeRates((prev) => ({
            ...prev,
            [cacheKey]: FAILED,
          }));
        }
      })
      .finally(() => {
        inFlightKeys.delete(cacheKey);
      });

    return () => {
      cancelled = true;
      inFlightKeys.delete(cacheKey);
    };
  }, [
    tokenAddress,
    cacheKey,
    contractExchangeRate,
    isUnavailable,
    nativeCurrency,
    chainId,
  ]);

  return useMemo(() => {
    if (!selectedNativeConversionRate) {
      return undefined;
    }

    const nativeConversionRate = new Numeric(
      String(selectedNativeConversionRate),
      10,
    );

    if (!tokenAddress) {
      return nativeConversionRate;
    }

    if (isUnavailable || !contractExchangeRate) {
      return undefined;
    }

    return new Numeric(String(contractExchangeRate), 10).times(
      nativeConversionRate,
    );
  }, [
    selectedNativeConversionRate,
    tokenAddress,
    isUnavailable,
    contractExchangeRate,
  ]);
}
