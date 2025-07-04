import { shallowEqual, useSelector } from 'react-redux';
import { Hex, Json } from '@metamask/utils';
import { BigNumber } from 'bignumber.js';
import { useMemo } from 'react';
import {
  getConfirmationExchangeRates,
  getCurrencyRates,
  getMarketData,
  getTokenExchangeRates,
} from '../../../../selectors';
// eslint-disable-next-line no-restricted-syntax
import { getConversionRate } from '../../../../ducks/metamask/metamask';
import { getNetworkConfigurationsByChainId } from '../../../../../shared/modules/selectors/networks';
import { isEqualCaseInsensitive } from '../../../../../shared/modules/string-utils';
import { NATIVE_TOKEN_ADDRESS } from '../../../../helpers/constants/intents';

export function useTokenFiatRates(tokenAddresses?: Hex[], chainId?: Hex) {
  const allMarketData = useSelector(getMarketData);

  const contractExchangeRates = useSelector(
    getTokenExchangeRates,
    shallowEqual,
  );

  const contractMarketData =
    chainId && allMarketData[chainId]
      ? Object.entries(allMarketData[chainId]).reduce<Record<string, Json>>(
          (acc, [address, marketData]) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  return useMemo(() => {
    if (!tokenAddresses || !chainId) {
      return undefined;
    }

    return tokenAddresses?.map((tokenAddress) => {
      const contractExchangeTokenKey = Object.keys(mergedRates).find((key) =>
        isEqualCaseInsensitive(key, tokenAddress),
      );

      const tokenExchangeRate =
        contractExchangeTokenKey && mergedRates[contractExchangeTokenKey];

      if (tokenAddress === NATIVE_TOKEN_ADDRESS) {
        return new BigNumber(tokenConversionRate);
      }

      if (!tokenExchangeRate || !tokenConversionRate) {
        return undefined;
      }

      return new BigNumber(tokenExchangeRate.toString()).mul(
        tokenConversionRate,
      );
    });
  }, [
    JSON.stringify(tokenAddresses),
    chainId,
    JSON.stringify(mergedRates),
    tokenConversionRate,
  ]);
}
