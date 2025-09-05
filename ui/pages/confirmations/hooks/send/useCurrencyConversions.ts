import { CaipAssetType, Hex } from '@metamask/utils';
import { useSelector } from 'react-redux';
import { isAddress as isEvmAddress } from 'ethers/lib/utils';
import { isNativeAddress } from '@metamask/bridge-controller';
import { toHex } from '@metamask/controller-utils';
import { useCallback, useMemo } from 'react';

import { getNetworkConfigurationsByChainId } from '../../../../../shared/modules/selectors/networks';
import { getAssetsRates } from '../../../../selectors/assets';
import {
  getCrossChainTokenExchangeRates,
  getCurrencyRates,
} from '../../../../selectors';
import { getCurrencySymbol } from '../../../../helpers/utils/common.util';
import { getMultichainCurrentCurrency } from '../../../../selectors/multichain';
import { useMultichainSelector } from '../../../../hooks/useMultichainSelector';
import { useSendContext } from '../../context/send';
import { convertedCurrency } from '../../utils/send';

type ConversionArgs = {
  amount?: string;
  conversionRate: number;
};

const getFiatValueFn = ({ amount, conversionRate }: ConversionArgs) => {
  if (!amount) {
    return '0.00';
  }
  return convertedCurrency(amount, conversionRate);
};

const getNativeValueFn = ({ amount, conversionRate }: ConversionArgs) => {
  if (!amount) {
    return '0';
  }
  return convertedCurrency(amount, 1 / conversionRate);
};

export const useCurrencyConversions = () => {
  const { asset, fromAccount } = useSendContext();
  const currentCurrency = useMultichainSelector(
    getMultichainCurrentCurrency,
    fromAccount,
  );
  const currencyRates = useSelector(getCurrencyRates);
  const allNetworks = useSelector(getNetworkConfigurationsByChainId);

  const conversionRateEvm = useMemo((): number => {
    if (!asset?.address || !asset?.chainId || !isEvmAddress(asset?.address)) {
      return 0;
    }
    const { nativeCurrency } = allNetworks[toHex(asset?.chainId)];
    return currencyRates[nativeCurrency]?.conversionRate;
  }, [allNetworks, asset, currencyRates]);

  const contractExchangeRates = useSelector(
    getCrossChainTokenExchangeRates,
  ) as Record<Hex, Record<Hex, number>>;

  const multichainAssetsRates = useSelector(getAssetsRates);

  const conversionRate = useMemo(() => {
    if (!asset?.address) {
      return 0;
    }
    if (isEvmAddress(asset?.address)) {
      if (isNativeAddress(asset?.address)) {
        return conversionRateEvm;
      }
      return (
        (
          Object.values(contractExchangeRates).find(
            (rate) => rate[asset.address as Hex] !== undefined,
          ) as Record<Hex, number>
        )[asset.address as Hex] * (conversionRateEvm ?? 0)
      );
    }
    return parseFloat(
      multichainAssetsRates[asset?.address as CaipAssetType]?.rate ?? 0,
    );
  }, [
    asset?.address,
    contractExchangeRates,
    conversionRateEvm,
    multichainAssetsRates,
  ]);

  const getFiatValue = useCallback(
    (amount: string) =>
      getFiatValueFn({
        amount,
        conversionRate,
      }),
    [conversionRate],
  );

  const getNativeValue = useCallback(
    (amount: string) =>
      getNativeValueFn({
        amount,
        conversionRate,
      }),
    [conversionRate],
  );

  return {
    fiatCurrencySymbol: getCurrencySymbol(currentCurrency),
    getFiatValue,
    getNativeValue,
  };
};
