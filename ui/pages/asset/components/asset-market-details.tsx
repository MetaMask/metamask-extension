import React, { ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { CaipAssetType, Hex } from '@metamask/utils';
import { BigNumber } from 'bignumber.js';
import {
  Box,
  BoxBorderColor,
  BoxFlexDirection,
  BoxJustifyContent,
  FontWeight,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { formatCurrency } from '../../../helpers/utils/confirm-tx.util';

import { getPricePrecision } from '../util';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  getCurrencyRateControllerCurrentCurrency as getCurrentCurrency,
  getMultichainAssetsRatesControllerConversionRates as getAssetsRates,
  getCurrencyRateControllerCurrencyRates as getCurrencyRates,
  getTokenRatesControllerMarketData as getMarketData,
} from '../../../../shared/lib/selectors/assets-migration';
import { useMultichainSelector } from '../../../hooks/useMultichainSelector';
import {
  getMultichainConversionRate,
  getMultichainNativeCurrency,
} from '../../../selectors/multichain';
import { AssetType } from '../../../../shared/constants/transaction';
import { Asset } from '../types/asset';
import { getConversionRatesForNativeAsset } from '../../../../shared/lib/asset-conversion-rates';
import { isEvmChainId } from '../../../../shared/lib/asset-utils';
import { useFormatters } from '../../../hooks/useFormatters';
import { AssetMarketData } from '../hooks/useCurrentPrice';

export const AssetMarketDetails = ({
  asset,
  address,
  fallbackMarketData,
}: {
  asset: Asset;
  address: string;
  /**
   * Market data fetched from the Price API, already in the selected fiat
   * currency. Used for assets the wallet does not track, which have no cached
   * market data in redux.
   */
  fallbackMarketData?: AssetMarketData;
}) => {
  const t = useI18nContext();
  const currency = useSelector(getCurrentCurrency);
  const conversionRate = useMultichainSelector(getMultichainConversionRate);
  const evmMarketData = useSelector(getMarketData);
  const currencyRates = useSelector(getCurrencyRates);
  const nonEvmConversionRates = useSelector(getAssetsRates);
  const {
    formatCurrencyCompact,
    formatCompact,
    formatPercentWithMinThreshold,
  } = useFormatters();

  const isEvm = isEvmChainId(asset.chainId);
  const nativeCurrency = useMultichainSelector(getMultichainNativeCurrency);

  const { type, symbol, chainId } = asset;

  const evmTokenExchangeRate =
    type === AssetType.native
      ? currencyRates[symbol]?.conversionRate
      : currencyRates[nativeCurrency]?.conversionRate || 0;

  const nonEvmExchangeRate =
    nonEvmConversionRates?.[address as CaipAssetType]?.rate || 0;

  const tokenExchangeRate = Number(
    isEvm ? evmTokenExchangeRate : nonEvmExchangeRate,
  );

  const conversionRateForNativeToken = getConversionRatesForNativeAsset({
    conversionRates: nonEvmConversionRates,
    chainId,
  });

  const nonEvmMarketData =
    type === AssetType.native
      ? conversionRateForNativeToken?.marketData
      : nonEvmConversionRates?.[address as CaipAssetType]?.marketData;

  const cachedMarketDetails = isEvm
    ? evmMarketData[chainId]?.[address as Hex]
    : nonEvmMarketData;

  // Cached EVM values are stored in native units and are converted below, while
  // the fallback arrives from the Price API already in the selected currency.
  const isCachedMarketData = Boolean(cachedMarketDetails);
  const tokenMarketDetails = cachedMarketDetails ?? fallbackMarketData;

  const rawDilutedMarketCap = (
    tokenMarketDetails as { dilutedMarketCap?: string | number } | undefined
  )?.dilutedMarketCap;

  const shouldDisplayMarketData =
    Number(conversionRate) > 0 &&
    tokenMarketDetails &&
    (Number(tokenMarketDetails.marketCap) > 0 ||
      Number(tokenMarketDetails.totalVolume) > 0 ||
      Number(tokenMarketDetails.circulatingSupply) > 0 ||
      Number(tokenMarketDetails.allTimeHigh) > 0 ||
      Number(tokenMarketDetails.allTimeLow) > 0 ||
      Number(rawDilutedMarketCap) > 0);

  if (!shouldDisplayMarketData) {
    return null;
  }

  const toNumber = (value: string | number | undefined) =>
    value
      ? new BigNumber(
          typeof value === 'string' ? value : value.toString(),
        ).toNumber()
      : 0;

  let marketCap = toNumber(tokenMarketDetails.marketCap);
  let totalVolume = toNumber(tokenMarketDetails.totalVolume);
  const circulatingSupply = toNumber(tokenMarketDetails.circulatingSupply);
  let allTimeHigh = toNumber(tokenMarketDetails.allTimeHigh);
  let allTimeLow = toNumber(tokenMarketDetails.allTimeLow);
  let fullyDiluted = toNumber(rawDilutedMarketCap);

  if (isEvm && isCachedMarketData) {
    marketCap *= tokenExchangeRate;
    totalVolume *= tokenExchangeRate;
    allTimeHigh *= tokenExchangeRate;
    allTimeLow *= tokenExchangeRate;
    fullyDiluted *= tokenExchangeRate;
  }

  const volumeToMarketCap =
    marketCap > 0 && totalVolume > 0 ? totalVolume / marketCap : 0;

  return (
    <Box>
      <Box
        className="mx-4 border border-solid"
        marginBottom={2}
        borderColor={BoxBorderColor.BorderMuted}
        style={{ height: '1px', borderBottomWidth: 0 }}
      ></Box>
      <Box paddingLeft={4} paddingRight={4} paddingTop={2} paddingBottom={2}>
        <Text variant={TextVariant.HeadingSm}>{t('marketDetails')}</Text>
      </Box>
      <Box
        className="flex px-4"
        flexDirection={BoxFlexDirection.Column}
        gap={2}
      >
        {marketCap > 0 &&
          renderRow(
            t('marketCap'),
            <Text
              variant={TextVariant.BodyMd}
              fontWeight={FontWeight.Medium}
              data-testid="asset-market-cap"
            >
              {formatCurrencyCompact(marketCap, currency)}
            </Text>,
          )}
        {totalVolume > 0 &&
          renderRow(
            t('totalVolume'),
            <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
              {formatCurrencyCompact(totalVolume, currency)}
            </Text>,
          )}
        {volumeToMarketCap > 0 &&
          renderRow(
            t('volumeToMarketCap'),
            <Text
              variant={TextVariant.BodyMd}
              fontWeight={FontWeight.Medium}
              data-testid="asset-volume-to-market-cap"
            >
              {formatPercentWithMinThreshold(volumeToMarketCap)}
            </Text>,
          )}
        {circulatingSupply > 0 &&
          renderRow(
            t('circulatingSupply'),
            <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
              {formatCompact(circulatingSupply)}
            </Text>,
          )}
        {allTimeHigh > 0 &&
          renderRow(
            t('allTimeHigh'),
            <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
              {formatCurrency(
                `${allTimeHigh}`,
                currency,
                getPricePrecision(allTimeHigh),
              )}
            </Text>,
          )}
        {allTimeLow > 0 &&
          renderRow(
            t('allTimeLow'),
            <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
              {formatCurrency(
                `${allTimeLow}`,
                currency,
                getPricePrecision(allTimeLow),
              )}
            </Text>,
          )}
        {fullyDiluted > 0 &&
          renderRow(
            t('fullyDiluted'),
            <Text
              variant={TextVariant.BodyMd}
              fontWeight={FontWeight.Medium}
              data-testid="asset-fully-diluted"
            >
              {formatCurrencyCompact(fullyDiluted, currency)}
            </Text>,
          )}
      </Box>
    </Box>
  );
};

function renderRow(leftColumn: string, rightColumn: ReactNode) {
  return (
    <Box className="flex" justifyContent={BoxJustifyContent.Between}>
      <Text
        color={TextColor.TextAlternative}
        variant={TextVariant.BodyMd}
        fontWeight={FontWeight.Medium}
      >
        {leftColumn}
      </Text>
      {rightColumn}
    </Box>
  );
}
