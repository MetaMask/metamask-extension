import { CaipAssetType, Hex } from '@metamask/utils';
import { useSelector } from 'react-redux';
import { isAddress as isEvmAddress } from 'ethers/lib/utils';
import { isNativeAddress } from '@metamask/bridge-controller';
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
import { Asset } from '../../types/send';
import { convertedCurrency, formatToFixedDecimals } from '../../utils/send';
import { useSendContext } from '../../context/send';

type ConversionArgs = {
  asset?: Asset;
  amount?: string;
  conversionRate: number;
  currentCurrency?: string;
};

const getFiatValueFn = ({ amount, conversionRate }: ConversionArgs) => {
  if (!amount) {
    return '0.00';
  }
  return convertedCurrency(amount, conversionRate) ?? '0.00';
};

const getFiatDisplayValueFn = ({
  amount,
  conversionRate,
  currentCurrency,
}: ConversionArgs) => {
  const amt = amount
    ? formatToFixedDecimals(getFiatValueFn({ amount, conversionRate }), 2)
    : '0.00';
  return `${getCurrencySymbol(currentCurrency)} ${amt}`;
};

const getNativeValueFn = ({ amount, conversionRate }: ConversionArgs) => {
  if (!amount) {
    return '0';
  }
  return convertedCurrency(amount, 1 / conversionRate) ?? '0';
};

const getNativeDisplayValueFn = ({
  asset,
  amount,
  conversionRate,
}: ConversionArgs) => {
  return `${asset?.symbol} ${formatToFixedDecimals(
    getNativeValueFn({
      amount,
      conversionRate,
    }),
    5,
  )}`;
};

export const useCurrencyConversions = () => {
  const { asset, chainId, fromAccount } = useSendContext();
  const currentCurrency = useMultichainSelector(
    getMultichainCurrentCurrency,
    fromAccount,
  );
  const currencyRates = useSelector(getCurrencyRates);
  const allNetworks = useSelector(getNetworkConfigurationsByChainId);
  const conversionRateEvm = useMemo((): number => {
    if (!asset?.address || !chainId || !isEvmAddress(asset?.address)) {
      return 0;
    }
    const { nativeCurrency } = allNetworks[chainId as Hex];
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

  const getFiatDisplayValue = useCallback(
    (amount: string) =>
      getFiatDisplayValueFn({
        amount,
        conversionRate,
        currentCurrency,
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

  const getNativeDisplayValue = useCallback(
    (amount: string) =>
      getNativeDisplayValueFn({
        asset,
        amount,
        conversionRate,
      }),
    [conversionRate],
  );

  return {
    fiatCurrencySymbol: getCurrencySymbol(currentCurrency),
    getFiatValue,
    getFiatDisplayValue,
    getNativeValue,
    getNativeDisplayValue,
  };
};
