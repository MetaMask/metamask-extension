import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
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

  const reduxTokenRate = tokenAddress
    ? crossChainTokenExchangeRates[chainId]?.[tokenAddress]
    : undefined;

  // Cache key includes chainId to prevent cross-chain rate contamination
  const cacheKey = ['tokenExchangeRate', chainId, tokenAddress, nativeCurrency];

  const { data: fetchedTokenRate } = useQuery({
    queryKey: cacheKey,
    queryFn: async () => {
      if (!tokenAddress || !nativeCurrency) {
        return null;
      }

      const exchangeRates = await fetchTokenExchangeRates(
        nativeCurrency,
        [tokenAddress],
        chainId,
      );
      return exchangeRates[tokenAddress] ?? null;
    },
    enabled: Boolean(
      tokenAddress && nativeCurrency && reduxTokenRate === undefined,
    ),
    retry: false,
    staleTime: Infinity,
  });

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

    const tokenRate = reduxTokenRate ?? fetchedTokenRate;
    if (tokenRate === undefined || tokenRate === null) {
      return undefined;
    }

    return new Numeric(String(tokenRate), 10).times(nativeConversionRate);
  }, [
    selectedNativeConversionRate,
    tokenAddress,
    reduxTokenRate,
    fetchedTokenRate,
  ]);
}
