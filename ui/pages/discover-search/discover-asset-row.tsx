import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { TrendingAsset } from '@metamask/assets-controllers';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  AvatarToken,
  AvatarTokenSize,
  BadgeWrapper,
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  ButtonBase,
  FontWeight,
  IconName,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { isCaipAssetType, parseCaipAssetType } from '@metamask/utils';

import { getCaipAssetImageUrl } from '../../../shared/lib/asset-utils';
import { CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP } from '../../../shared/constants/network';
import { formatCompactCurrency } from '../../helpers/utils/token-insights';
import { useFormatters } from '../../hooks/useFormatters';
import { useI18nContext } from '../../hooks/useI18nContext';
import { getCurrentCurrency } from '../../ducks/metamask/metamask';
import { getCurrencyRates } from '../../selectors';
import { getChangeColor } from '../../components/app/perps/utils';
import {
  getSecurityTrustBadgeConfig,
  SecurityTrustInlineBadge,
  type SecurityTrustTranslate,
} from '../../components/app/security-trust';

const ROW_STYLES =
  'justify-start rounded-none min-w-0 h-auto min-h-[72px] gap-3 text-left cursor-pointer bg-default px-4 py-3 hover:bg-hover active:bg-pressed';
const USD_CURRENCY = 'USD';
type SecurityResultType = NonNullable<
  TrendingAsset['securityData']
>['resultType'];
type CurrencyRate = {
  conversionRate?: number | null;
  usdConversionRate?: number | null;
};
type CurrencyRates = Record<string, CurrencyRate>;

export type DiscoverAssetRowProps = {
  asset: TrendingAsset;
  onPress?: (asset: TrendingAsset) => void;
  'data-testid'?: string;
};

const getAssetPrice = (price: string | undefined) => {
  const value = Number(price);
  if (!Number.isFinite(value) || value === 0) {
    return null;
  }

  return value;
};

const getUsdToCurrentCurrencyRate = (currencyRates?: CurrencyRates) => {
  const currencyRate = Object.values(currencyRates ?? {}).find(
    ({ conversionRate, usdConversionRate }) =>
      typeof conversionRate === 'number' &&
      typeof usdConversionRate === 'number' &&
      Number.isFinite(conversionRate) &&
      Number.isFinite(usdConversionRate) &&
      conversionRate > 0 &&
      usdConversionRate > 0,
  );

  return currencyRate?.conversionRate && currencyRate.usdConversionRate
    ? currencyRate.conversionRate / currencyRate.usdConversionRate
    : null;
};

const convertUsdValue = (
  value: number,
  shouldConvert: boolean,
  usdToCurrentCurrencyRate: number | null,
) =>
  shouldConvert && usdToCurrentCurrencyRate
    ? value * usdToCurrentCurrencyRate
    : value;

const getNetworkImageMapKey = ({
  namespace,
  reference,
}: {
  namespace: string;
  reference: string;
}) => {
  if (namespace === 'eip155') {
    return `0x${BigInt(reference).toString(16)}`;
  }

  return `${namespace}:${reference}`;
};

/**
 * Formats 24h % change like mobile Explore: sign + `toFixed(2)` + `%`.
 *
 * @param value - Raw percentage from the API
 * @returns Display label, or null when non-numeric
 */
const formatPriceChangePercent = (value: string): string | null => {
  const numericValue = Number.parseFloat(value.replace('%', ''));
  if (!Number.isFinite(numericValue)) {
    return null;
  }

  if (numericValue === 0) {
    return '0.00%';
  }

  const sign = numericValue > 0 ? '+' : '';
  return `${sign}${numericValue.toFixed(2)}%`;
};

const getSecurityResultType = (securityData: TrendingAsset['securityData']) =>
  securityData?.resultType ??
  (securityData as { type?: SecurityResultType } | undefined)?.type;

const getDiscoverSearchSecurityBadge = (
  resultType: SecurityResultType | undefined,
  t: SecurityTrustTranslate,
) => {
  const badge = getSecurityTrustBadgeConfig(resultType, t);

  if (badge && (resultType === 'Warning' || resultType === 'Spam')) {
    return {
      ...badge,
      icon: IconName.Danger,
    };
  }

  return badge;
};

/**
 * Discover row for crypto / stocks: icon, name, security badge, cap·vol, price, 24h %.
 * @param options0
 * @param options0.asset
 * @param options0.onPress
 * @param options0.'data-testid'
 */
export const DiscoverAssetRow = ({
  asset,
  onPress,
  'data-testid': dataTestId,
}: DiscoverAssetRowProps) => {
  const t = useI18nContext() as SecurityTrustTranslate;
  const { formatCurrencyWithMinThreshold } = useFormatters();
  const currentCurrency = useSelector(getCurrentCurrency);
  const currencyRates = useSelector(getCurrencyRates) as CurrencyRates;
  const usdToCurrentCurrencyRate = getUsdToCurrentCurrencyRate(currencyRates);
  const shouldConvertUsd =
    currentCurrency.toUpperCase() !== USD_CURRENCY &&
    usdToCurrentCurrencyRate !== null;
  const displayCurrency = shouldConvertUsd ? currentCurrency : USD_CURRENCY;

  const imageUrl = useMemo(() => {
    if (!isCaipAssetType(asset.assetId)) {
      return undefined;
    }
    return getCaipAssetImageUrl(asset.assetId);
  }, [asset.assetId]);

  const network = useMemo(() => {
    if (!isCaipAssetType(asset.assetId)) {
      return undefined;
    }

    const parsedAssetId = parseCaipAssetType(asset.assetId);
    const imageMapKey = getNetworkImageMapKey(parsedAssetId.chain);

    return {
      name: parsedAssetId.chainId,
      imageUrl: CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[imageMapKey],
    };
  }, [asset.assetId]);

  const secondaryText = useMemo(() => {
    const cap = formatCompactCurrency(
      convertUsdValue(
        asset.marketCap,
        shouldConvertUsd,
        usdToCurrentCurrencyRate,
      ),
      displayCurrency,
    );
    const vol = formatCompactCurrency(
      convertUsdValue(
        asset.aggregatedUsdVolume,
        shouldConvertUsd,
        usdToCurrentCurrencyRate,
      ),
      displayCurrency,
    );
    return `${cap} ${t('discoverSearchCap')} \u00B7 ${vol} ${t('discoverSearchVol')}`;
  }, [
    asset.aggregatedUsdVolume,
    asset.marketCap,
    displayCurrency,
    shouldConvertUsd,
    t,
    usdToCurrentCurrencyRate,
  ]);

  const price = getAssetPrice(asset.price);
  const formattedPrice =
    price === null
      ? '—'
      : formatCurrencyWithMinThreshold(
          convertUsdValue(price, shouldConvertUsd, usdToCurrentCurrencyRate),
          displayCurrency,
        );
  const changePct = asset.priceChangePct?.h24 ?? '';
  const formattedChange = changePct
    ? formatPriceChangePercent(changePct)
    : null;
  const changeColor = formattedChange
    ? getChangeColor(formattedChange)
    : TextColor.TextAlternative;

  const securityBadge = useMemo(
    () =>
      getDiscoverSearchSecurityBadge(
        getSecurityResultType(asset.securityData),
        t,
      ),
    [asset.securityData, t],
  );

  const handleClick = () => {
    onPress?.(asset);
  };

  const testId =
    dataTestId ??
    `discover-asset-row-${
      isCaipAssetType(asset.assetId)
        ? parseCaipAssetType(asset.assetId).assetReference
        : asset.symbol
    }`;

  return (
    <ButtonBase
      className={ROW_STYLES}
      isFullWidth={true}
      data-testid={testId}
      onClick={handleClick}
    >
      <BadgeWrapper
        className="shrink-0"
        badge={
          network?.imageUrl ? (
            <AvatarNetwork
              name={network.name}
              src={network.imageUrl}
              size={AvatarNetworkSize.Xs}
              className="h-4 w-4 min-w-4 rounded-md border-2 border-background-default bg-background-default"
              data-testid={`${testId}-network`}
            />
          ) : null
        }
      >
        <AvatarToken
          name={asset.symbol}
          src={imageUrl}
          size={AvatarTokenSize.Lg}
        />
      </BadgeWrapper>
      <Box
        className="min-w-0 flex-1 overflow-hidden"
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Start}
        gap={0}
      >
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          gap={1}
          className="min-w-0 max-w-full"
        >
          <Text fontWeight={FontWeight.Medium} className="min-w-0 truncate">
            {asset.name || asset.symbol}
          </Text>
          {securityBadge ? (
            <Box className="flex shrink-0 items-center leading-none">
              <SecurityTrustInlineBadge
                badge={securityBadge}
                testId={
                  securityBadge.label === null
                    ? 'security-badge-icon'
                    : undefined
                }
              />
            </Box>
          ) : null}
        </Box>
        <Text
          variant={TextVariant.BodySm}
          color={TextColor.TextAlternative}
          className="block max-w-full truncate"
        >
          {secondaryText}
        </Text>
      </Box>
      <Box
        className="w-24 shrink-0 overflow-hidden"
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.End}
        gap={1}
      >
        <Text
          variant={TextVariant.BodySm}
          fontWeight={FontWeight.Medium}
          className="block max-w-full truncate text-right"
        >
          {formattedPrice}
        </Text>
        <Text
          variant={TextVariant.BodySm}
          color={changeColor}
          className="block max-w-full truncate text-right"
        >
          {formattedChange ?? '—'}
        </Text>
      </Box>
    </ButtonBase>
  );
};
