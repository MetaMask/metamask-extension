import { Hex } from '@metamask/utils';
import { isNativeAddress } from '@metamask/bridge-controller';
import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { getNetworkConfigurationsByChainId } from '../../../../../../../shared/modules/selectors/networks';
import {
  getCrossChainTokenExchangeRates,
  getCurrencyRates,
} from '../../../../../../selectors';

export const useConversionRate = () => {
  const currencyRates = useSelector(getCurrencyRates);
  const allNetworks = useSelector(getNetworkConfigurationsByChainId);

  const contractExchangeRates = useSelector(
    getCrossChainTokenExchangeRates,
  ) as Record<Hex, Record<Hex, number>>;
  console.log('contractExchangeRates', contractExchangeRates);

  const getConversionRateForToken = useCallback(
    (tokenAdddress: Hex, chainId: Hex): number => {
      if (!tokenAdddress) {
        return 0;
      }

      const { nativeCurrency } = allNetworks[chainId as Hex];
      const networkConversionRate =
        currencyRates[nativeCurrency]?.conversionRate;

      if (isNativeAddress(tokenAdddress)) {
        return networkConversionRate;
      }
      return (
        ((
          Object.values(contractExchangeRates).find(
            (rate) => rate[tokenAdddress] !== undefined,
          ) as Record<Hex, number>
        )?.[tokenAdddress] ?? 0) * (networkConversionRate ?? 0)
      );
    },
    [allNetworks, contractExchangeRates, currencyRates],
  );

  return {
    getConversionRateForToken,
  };
};
