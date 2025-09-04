import React, { ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { CaipAssetType, isCaipChainId } from '@metamask/utils';
import { BigNumber } from 'bignumber.js';
import { formatCurrency } from '../../../helpers/utils/confirm-tx.util';

import { getPricePrecision, localizeLargeNumber } from '../util';

import { Box, Text } from '../../../components/component-library';
import {
  BorderColor,
  Display,
  FlexDirection,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getCurrentCurrency } from '../../../ducks/metamask/metamask';
import { useMultichainSelector } from '../../../hooks/useMultichainSelector';
import {
  getMultichainConversionRate,
  getMultichainNativeCurrency,
} from '../../../selectors/multichain';
import { getAssetsRates } from '../../../selectors/assets';
import { getCurrencyRates, getMarketData } from '../../../selectors/selectors';
import { AssetType } from '../../../../shared/constants/transaction';
import { Asset } from '../types/asset';
// eslint-disable-next-line import/no-restricted-paths
import { getConversionRatesForNativeAsset } from '../../../../app/scripts/lib/util';

export const AssetMarketDetails = ({
  asset,
  address,
}: {
  asset: Asset;
  address: string;
}) => {
  const t = useI18nContext();
  const currency = useSelector(getCurrentCurrency);
  const conversionRate = useMultichainSelector(getMultichainConversionRate);
  const evmMarketData = useSelector(getMarketData);
  const currencyRates = useSelector(getCurrencyRates);
  const nonEvmConversionRates = useSelector(getAssetsRates);

  const isEvm = !isCaipChainId(asset.chainId);
  const nativeCurrency = useMultichainSelector(getMultichainNativeCurrency);

  const { type, symbol, chainId } = asset;

  const evmTokenExchangeRate =
    type === AssetType.native
      ? currencyRates[symbol]?.conversionRate
      : currencyRates[nativeCurrency]?.conversionRate || 0;

  const nonEvmExchangeRate =
    nonEvmConversionRates?.[address as CaipAssetType]?.rate || 0;

  const tokenExchangeRate = isEvm ? evmTokenExchangeRate : nonEvmExchangeRate;

  const conversionRateForNativeToken = getConversionRatesForNativeAsset({
    conversionRates: nonEvmConversionRates,
    chainId,
  });

  const nonEvmMarketData =
    type === AssetType.native
      ? conversionRateForNativeToken?.marketData
      : nonEvmConversionRates?.[address as CaipAssetType]?.marketData;

  const tokenMarketDetails = isEvm
    ? evmMarketData[chainId]?.[address]
    : nonEvmMarketData;

  const shouldDisplayMarketData =
    conversionRate > 0 &&
    tokenMarketDetails &&
    (tokenMarketDetails.marketCap > 0 ||
      tokenMarketDetails.totalVolume > 0 ||
      tokenMarketDetails.circulatingSupply > 0 ||
      tokenMarketDetails.allTimeHigh > 0 ||
      tokenMarketDetails.allTimeLow > 0);

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
  let circulatingSupply = toNumber(tokenMarketDetails.circulatingSupply);
  let allTimeHigh = toNumber(tokenMarketDetails.allTimeHigh);
  let allTimeLow = toNumber(tokenMarketDetails.allTimeLow);

  if (isEvm) {
    marketCap *= tokenExchangeRate;
    totalVolume *= tokenExchangeRate;
    circulatingSupply *= tokenExchangeRate;
    allTimeHigh *= tokenExchangeRate;
    allTimeLow *= tokenExchangeRate;
  }

  return (
    <Box>
      <Box
        marginBottom={2}
        borderColor={BorderColor.borderMuted}
        marginInline={4}
        style={{ height: '1px', borderBottomWidth: 0 }}
      ></Box>
      <Text
        variant={TextVariant.headingSm}
        paddingInline={4}
        paddingTop={2}
        paddingBottom={2}
      >
        {t('marketDetails')}
      </Text>
      <Box
        paddingInline={4}
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        gap={2}
      >
        {marketCap > 0 &&
          renderRow(
            t('marketCap'),
            <Text
              variant={TextVariant.bodyMdMedium}
              data-testid="asset-market-cap"
            >
              {localizeLargeNumber(t, marketCap)}
            </Text>,
          )}
        {totalVolume > 0 &&
          renderRow(
            t('totalVolume'),
            <Text variant={TextVariant.bodyMdMedium}>
              {localizeLargeNumber(t, totalVolume)}
            </Text>,
          )}
        {circulatingSupply > 0 &&
          renderRow(
            t('circulatingSupply'),
            <Text variant={TextVariant.bodyMdMedium}>
              {localizeLargeNumber(t, circulatingSupply)}
            </Text>,
          )}
        {allTimeHigh > 0 &&
          renderRow(
            t('allTimeHigh'),
            <Text variant={TextVariant.bodyMdMedium}>
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
            <Text variant={TextVariant.bodyMdMedium}>
              {formatCurrency(
                `${allTimeLow}`,
                currency,
                getPricePrecision(allTimeLow),
              )}
            </Text>,
          )}
      </Box>
    </Box>
  );
};

function renderRow(leftColumn: string, rightColumn: ReactNode) {
  return (
    <Box display={Display.Flex} justifyContent={JustifyContent.spaceBetween}>
      <Text
        color={TextColor.textAlternative}
        variant={TextVariant.bodyMdMedium}
      >
        {leftColumn}
      </Text>
      {rightColumn}
    </Box>
  );
}
