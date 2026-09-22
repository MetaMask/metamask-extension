import { useSelector } from 'react-redux';
import { useMemo } from 'react';
import type { Hex } from '@metamask/utils';
import { getMarketData, getCurrencyRates } from '../../../../selectors';
import { getNetworkConfigurationsByChainId } from '../../../../../shared/lib/selectors/networks';
import { toChecksumHexAddress } from '../../../../../shared/lib/hexstring-utils';
import { getCurrentCurrency } from '../../../../ducks/metamask/metamask';
import { selectStablecoins } from '../../selectors/feature-flags';
import { useDeepMemo } from '../useDeepMemo';

export type TokenFiatRateRequest = {
  address: Hex;
  chainId: Hex;
  currency?: string;
};

export function useTokenFiatRates(
  requests: TokenFiatRateRequest[],
): (number | undefined)[] {
  const selectedCurrency = useSelector(getCurrentCurrency);
  const marketData = useSelector(getMarketData);
  const currencyRates = useSelector(getCurrencyRates);
  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);
  const stablecoins = useSelector(selectStablecoins);
  const safeRequests = useDeepMemo(() => requests, [requests]);

  const result = useMemo(
    () =>
      safeRequests.map(({ address, chainId, currency: currencyOverride }) => {
        const currency = currencyOverride ?? selectedCurrency;
        const isUsd = currency.toLowerCase() === 'usd';

        // USD-pegged tokens are worth exactly $1, so skip market data entirely.
        // Deriving their rate as `priceInNative * nativeUsdRate` lands a few
        // hundredths of a cent off (e.g. $0.99987 for USDC), and MM Pay divides
        // by that rate to size amounts — the drift makes Max quote for more than
        // the balance covers. Only applies to USD; other display currencies
        // still need a real conversion.
        const isStablecoin = stablecoins[chainId]?.includes(
          address.toLowerCase() as Hex,
        );

        if (isUsd && isStablecoin) {
          return 1;
        }

        const chainTokens = marketData?.[chainId] ?? {};
        const token = chainTokens[toChecksumHexAddress(address) as Hex];
        const networkConfiguration = networkConfigurations[chainId];

        const conversionRates =
          currencyRates?.[networkConfiguration?.nativeCurrency];

        const conversionRate = isUsd
          ? conversionRates?.usdConversionRate
          : conversionRates?.conversionRate;

        if (!conversionRate || !networkConfiguration) {
          return undefined;
        }

        return (token?.price ?? 1) * conversionRate;
      }),
    [
      safeRequests,
      currencyRates,
      networkConfigurations,
      selectedCurrency,
      marketData,
      stablecoins,
    ],
  );

  return useDeepMemo(() => result, [result]);
}

export function useTokenFiatRate(
  tokenAddress: Hex,
  chainId: Hex,
  currency?: string,
): number | undefined {
  const rates = useTokenFiatRates([
    { address: tokenAddress, chainId, currency },
  ]);
  return rates[0];
}
