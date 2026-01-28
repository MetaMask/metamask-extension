import { useSelector } from 'react-redux';
import { useMemo } from 'react';
import type { Hex } from '@metamask/utils';
import { getMarketData, getCurrencyRates } from '../../../../selectors';
import { getNetworkConfigurationsByChainId } from '../../../../../shared/modules/selectors/networks';
import { toChecksumHexAddress } from '../../../../../shared/modules/hexstring-utils';
import { getCurrentCurrency } from '../../../../ducks/metamask/metamask';
import { useDeepMemo } from '../useDeepMemo';

export type TokenFiatRateRequest = {
  address: Hex;
  chainId: Hex;
  currency?: string;
};

// eslint-disable-next-line @typescript-eslint/naming-convention
export function useTokenFiatRates(
  requests: TokenFiatRateRequest[],
): (number | undefined)[] {
  const selectedCurrency = useSelector(getCurrentCurrency);
  const marketData = useSelector(getMarketData);
  const currencyRates = useSelector(getCurrencyRates);
  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);
  const safeRequests = useDeepMemo(() => requests, [requests]);

  const result = useMemo(
    () =>
      safeRequests.map(({ address, chainId, currency: currencyOverride }) => {
        const currency = currencyOverride ?? selectedCurrency;
        const isUsd = currency.toLowerCase() === 'usd';

        const chainTokens = marketData?.[chainId] ?? {};
        const token = chainTokens[toChecksumHexAddress(address)];
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
    ],
  );

  return useDeepMemo(() => result, [result]);
}

// eslint-disable-next-line @typescript-eslint/naming-convention
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
