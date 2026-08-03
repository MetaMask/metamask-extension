import React, { useMemo } from 'react';
import type { TrendingAsset } from '@metamask/assets-controllers';
import {
  AvatarToken,
  AvatarTokenSize,
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  ButtonBase,
  FontWeight,
  Text,
  TextColor,
  TextVariant,
  twMerge,
} from '@metamask/design-system-react';
import { isCaipAssetType, parseCaipAssetType } from '@metamask/utils';

import { getCaipAssetImageUrl } from '../../../shared/lib/asset-utils';
import { formatCompactCurrency } from '../../helpers/utils/token-insights';
import { useI18nContext } from '../../hooks/useI18nContext';
import {
  formatSignedChangePercent,
  getChangeColor,
} from '../../components/app/perps/utils';

const ROW_STYLES =
  'justify-start rounded-none min-w-0 h-auto min-h-[72px] gap-3 text-left cursor-pointer bg-default px-4 py-3 hover:bg-hover active:bg-pressed';
const USD_CURRENCY = 'USD';

export type DiscoverAssetRowProps = {
  asset: TrendingAsset;
  onPress?: (asset: TrendingAsset) => void;
  'data-testid'?: string;
};

const formatAssetPrice = (price: string | undefined) => {
  const value = Number(price);
  if (!Number.isFinite(value) || value === 0) {
    return '—';
  }

  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: USD_CURRENCY,
    maximumFractionDigits: value < 1 ? 6 : 2,
  }).format(value);
};

/**
 * Discover row for crypto / stocks: icon, name, cap·vol, price, 24h %.
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
  const t = useI18nContext();

  const imageUrl = useMemo(() => {
    if (!isCaipAssetType(asset.assetId)) {
      return undefined;
    }
    return getCaipAssetImageUrl(asset.assetId);
  }, [asset.assetId]);

  const secondaryText = useMemo(() => {
    const cap = formatCompactCurrency(asset.marketCap, USD_CURRENCY);
    const vol = formatCompactCurrency(asset.aggregatedUsdVolume, USD_CURRENCY);
    return `${cap} ${t('discoverSearchCap')} \u00B7 ${vol} ${t('discoverSearchVol')}`;
  }, [asset.aggregatedUsdVolume, asset.marketCap, t]);

  const changePct = asset.priceChangePct?.h24 ?? '';
  const changeColor = changePct
    ? getChangeColor(changePct)
    : TextColor.TextAlternative;

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
      className={twMerge(ROW_STYLES)}
      isFullWidth={true}
      data-testid={testId}
      onClick={handleClick}
    >
      <AvatarToken
        name={asset.symbol}
        src={imageUrl}
        size={AvatarTokenSize.Md}
        className="shrink-0"
      />
      <Box
        className="min-w-0 flex-1"
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Start}
        gap={1}
      >
        <Text fontWeight={FontWeight.Medium} className="min-w-0 truncate">
          {asset.name || asset.symbol}
        </Text>
        <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
          {secondaryText}
        </Text>
      </Box>
      <Box
        className="shrink-0"
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.End}
        gap={1}
      >
        <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium}>
          {formatAssetPrice(asset.price)}
        </Text>
        <Text variant={TextVariant.BodySm} color={changeColor}>
          {changePct ? formatSignedChangePercent(changePct) : '—'}
        </Text>
      </Box>
    </ButtonBase>
  );
};
