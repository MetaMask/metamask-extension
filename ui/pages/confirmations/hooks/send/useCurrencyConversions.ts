import { CaipAssetType, Hex } from '@metamask/utils';
import { ERC1155, ERC721 } from '@metamask/controller-utils';
import { isAddress as isEvmAddress } from 'ethers/lib/utils';
import { isNativeAddress } from '@metamask/bridge-controller';
import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

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
import { useSendType } from './useSendType';

type ConversionArgs = {
  asset?: Asset;
  amount?: string;
  conversionRate: number;
  currentCurrency?: string;
};

const getFiatValueFn = ({ amount, conversionRate }: ConversionArgs) => {
  if (!amount?.length) {
    return '0.00';
  }
  return convertedCurrency(amount, conversionRate, 2) ?? '0.00';
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

const getNativeValueFn = ({
  asset,
  amount,
  conversionRate,
}: ConversionArgs) => {
  if (!amount?.length) {
    return '0';
  }
  return convertedCurrency(amount, 1 / conversionRate, asset?.decimals) ?? '0';
};

const getNativeDisplayValueFn = ({
  asset,
  amount,
  conversionRate,
}: ConversionArgs) => {
  return `${asset?.symbol} ${formatToFixedDecimals(
    getNativeValueFn({
      asset,
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
  const { isEvmSendType } = useSendType();
  const conversionRateEvm = useMemo((): number => {
    if (!isEvmSendType) {
      return 0;
    }
    const { nativeCurrency } = allNetworks[chainId as Hex];
    return currencyRates[nativeCurrency]?.conversionRate;
  }, [allNetworks, asset, chainId, currencyRates]);

  const contractExchangeRates = useSelector(
    getCrossChainTokenExchangeRates,
  ) as Record<Hex, Record<Hex, number>>;

  const multichainAssetsRates = useSelector(getAssetsRates);

  const conversionRate = useMemo(() => {
    if (
      !asset?.address ||
      asset.standard === ERC1155 ||
      asset.standard === ERC721
    ) {
      return 0;
    }
    if ((asset as Asset)?.fiat?.conversionRate) {
      return (asset as Asset)?.fiat?.conversionRate ?? 0;
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
        )?.[asset.address as Hex] * (conversionRateEvm ?? 0)
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
    [conversionRate, currentCurrency],
  );

  const getNativeValue = useCallback(
    (amount: string) =>
      getNativeValueFn({
        asset,
        amount,
        conversionRate,
      }),
    [asset, conversionRate],
  );

  const getNativeDisplayValue = useCallback(
    (amount: string) =>
      getNativeDisplayValueFn({
        asset,
        amount,
        conversionRate,
      }),
    [asset, conversionRate],
  );

  return {
    fiatCurrencySymbol: getCurrencySymbol(currentCurrency),
    getFiatValue,
    getFiatDisplayValue,
    getNativeValue,
    getNativeDisplayValue,
  };
};
