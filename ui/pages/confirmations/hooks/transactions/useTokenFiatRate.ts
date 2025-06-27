import { shallowEqual, useSelector } from "react-redux";
import { getConfirmationExchangeRates, getCurrencyRates, getMarketData, getTokenExchangeRates } from "../../../../selectors";
import { Hex, Json } from "@metamask/utils";
import { getConversionRate } from "../../../../ducks/metamask/metamask";
import { getNetworkConfigurationsByChainId } from "../../../../../shared/modules/selectors/networks";
import { isEqualCaseInsensitive } from "../../../../../shared/modules/string-utils";
import BigNumber from "bignumber.js";

export function useTokenFiatRate(tokenAddress: Hex, chainId: Hex) {
  const allMarketData = useSelector(getMarketData);

  const contractExchangeRates = useSelector(
    getTokenExchangeRates,
    shallowEqual,
  );

  const contractMarketData =
    chainId && allMarketData[chainId]
      ? Object.entries(allMarketData[chainId]).reduce<Record<string, Json>>(
          (acc, [address, marketData]) => {
            acc[address] = (marketData as any)?.price ?? null;
            return acc;
          },
          {},
        )
      : null;

  const tokenMarketData = chainId ? contractMarketData : contractExchangeRates;
  const confirmationExchangeRates = useSelector(getConfirmationExchangeRates);

  const mergedRates = {
    ...tokenMarketData,
    ...confirmationExchangeRates,
  };

  const currencyRates = useSelector(getCurrencyRates);
  const conversionRate = useSelector(getConversionRate);

  const networkConfigurationsByChainId = useSelector(
    getNetworkConfigurationsByChainId,
  );

  const tokenConversionRate = chainId
    ? currencyRates?.[networkConfigurationsByChainId[chainId]?.nativeCurrency]
        ?.conversionRate
    : conversionRate;

  const contractExchangeTokenKey = Object.keys(mergedRates).find((key) =>
    isEqualCaseInsensitive(key, tokenAddress),
  );

  const tokenExchangeRate =
    contractExchangeTokenKey && mergedRates[contractExchangeTokenKey];

  if (!tokenExchangeRate || !tokenConversionRate) {
    return undefined;
  }

  return new BigNumber(tokenExchangeRate.toString()).mul(tokenConversionRate);
}
