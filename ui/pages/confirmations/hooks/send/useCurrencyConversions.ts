import { Hex } from '@metamask/utils';
import { ERC1155, ERC721 } from '@metamask/controller-utils';
import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { getCrossChainTokenExchangeRates } from '../../../../selectors';
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
    return '0';
  }
  return convertedCurrency(amount, conversionRate, 2) ?? '0';
};

const getFiatDisplayValueFn = ({
  amount,
  conversionRate,
  currentCurrency,
}: ConversionArgs) => {
  if (!amount) {
    return `${getCurrencySymbol(currentCurrency)} 0.00`;
  }
  const amt = amount
    ? formatToFixedDecimals(
        getFiatValueFn({ amount, conversionRate }),
        2,
        false,
      )
    : '0.00';
  return `${getCurrencySymbol(currentCurrency)} ${amt}`;
};

const getNativeValueFn = ({
  asset,
  amount,
  conversionRate,
}: ConversionArgs) => {
  if (!amount) {
    return '0';
  }
  return (
    convertedCurrency(
      amount,
      conversionRate === 0 ? 0 : 1 / conversionRate,
      asset?.decimals,
    ) ?? '0'
  );
};

export const useCurrencyConversions = () => {
  const { asset, fromAccount } = useSendContext();
  const currentCurrency = useMultichainSelector(
    getMultichainCurrentCurrency,
    fromAccount,
  );

  const contractExchangeRates = useSelector(
    getCrossChainTokenExchangeRates,
  ) as Record<Hex, Record<Hex, number>>;

  const exchangeRate = useMemo(() => {
    if (!asset) {
      return 1;
    }
    return (
      (
        Object.values(contractExchangeRates).find(
          (rate) => rate[asset.address as Hex] !== undefined,
        ) as Record<Hex, number>
      )?.[asset.address as Hex] ?? 1
    );
  }, [asset, contractExchangeRates]);

  const conversionRate = useMemo(() => {
    const assetAddress = asset?.address ?? asset?.assetId;
    if (
      !asset ||
      !assetAddress ||
      asset.standard === ERC1155 ||
      asset.standard === ERC721
    ) {
      return 0;
    }
    return ((asset as Asset)?.fiat?.conversionRate ?? 0) * exchangeRate;
  }, [asset, exchangeRate]);

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

  return {
    conversionSupportedForAsset:
      conversionRate !== 0 &&
      asset?.standard !== ERC1155 &&
      asset?.standard !== ERC721,
    fiatCurrencySymbol: getCurrencySymbol(currentCurrency),
    getFiatValue,
    getFiatDisplayValue,
    getNativeValue,
  };
};
