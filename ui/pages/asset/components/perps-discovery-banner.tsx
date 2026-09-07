import React, { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
  ButtonBase,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { PERPS_MARKET_DETAIL_ROUTE } from '../../../helpers/constants/routes';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getUseExternalServices } from '../../../selectors';
import {
  type PerpsState,
  selectPerpsMarketForAsset,
  selectPerpsPositionForMarket,
} from '../../../selectors/perps-controller';
import { AssetType } from '../../../../shared/constants/transaction';
import type { Asset } from '../types/asset';

const PERPS_MIN_AGGREGATORS_FOR_TRUST = 2;

type PerpsDiscoveryBannerProps = {
  asset: Asset;
};

/**
 * Promotes the Perps market matching a trustworthy spot asset.
 *
 * @param options0 - Component props.
 * @param options0.asset - Spot asset shown on the asset page.
 * @returns The discovery banner when the asset is eligible, otherwise null.
 */
export const PerpsDiscoveryBanner = ({ asset }: PerpsDiscoveryBannerProps) => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const isBasicFunctionalityEnabled = useSelector(getUseExternalServices);
  const selectMarket = useMemo(
    () => (state: PerpsState) => selectPerpsMarketForAsset(state, asset.symbol),
    [asset.symbol],
  );
  const market = useSelector(selectMarket);
  const selectPosition = useMemo(
    () => (state: PerpsState) =>
      market ? selectPerpsPositionForMarket(state, market.symbol) : null,
    [market],
  );
  const position = useSelector(selectPosition);
  const isTrustworthy =
    asset.type === AssetType.native ||
    (asset.aggregators?.length ?? 0) >= PERPS_MIN_AGGREGATORS_FOR_TRUST;

  const handleClick = useCallback(() => {
    if (!market) {
      return;
    }
    navigate(
      `${PERPS_MARKET_DETAIL_ROUTE}/${encodeURIComponent(market.symbol)}`,
    );
  }, [market, navigate]);

  if (!isBasicFunctionalityEnabled || !market || position || !isTrustworthy) {
    return null;
  }

  const title = t('perpsDiscoveryBannerTitle', [asset.symbol]);
  const subtitle = t('perpsDiscoveryBannerSubtitle', [market.maxLeverage]);

  return (
    <ButtonBase
      isFullWidth
      className="mt-2 h-auto justify-start rounded-lg bg-muted px-4 py-4 text-left hover:bg-muted-hover active:bg-muted-pressed"
      onClick={handleClick}
      aria-label={`${title} ${subtitle}`}
      data-testid="perps-discovery-banner"
    >
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        gap={3}
      >
        <Box
          backgroundColor={BoxBackgroundColor.BackgroundDefault}
          className="rounded-full"
          padding={2}
        >
          <Icon
            name={IconName.TrendUp}
            size={IconSize.Md}
            color={IconColor.IconAlternative}
          />
        </Box>
        <Box flexDirection={BoxFlexDirection.Column} className="min-w-0">
          <Text variant={TextVariant.BodyMd}>{title}</Text>
          <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
            {subtitle}
          </Text>
        </Box>
      </Box>
    </ButtonBase>
  );
};
