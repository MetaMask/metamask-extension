/**
 * MusdBuyGetCta Component
 *
 * Primary banner CTA that appears above the token list.
 * Shows "Buy mUSD" for empty wallets or "Get mUSD" for users with convertible tokens.
 *
 * Based on mobile's MusdConversionAssetListCta component.
 */

import React, { useCallback, useContext, useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { Hex } from '@metamask/utils';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  AvatarToken,
  BadgeWrapper,
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  Button,
  ButtonSize,
  ButtonVariant,
  FontWeight,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import type { ChainId } from '../../../../shared/constants/network';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useMusdConversion } from '../../../hooks/musd';
import { BuyGetMusdCtaVariant } from '../../../hooks/musd/useMusdCtaVisibility';
import {
  getMultichainNetworkConfigurationsByChainId,
  getImageForChainId,
} from '../../../selectors/multichain';
import { getAssetImageUrl } from '../../../../shared/lib/asset-utils';
import useRamps from '../../../hooks/ramps/useRamps/useRamps';
import { ASSET_CELL_HEIGHT } from '../assets/constants';
import {
  MUSD_CONVERSION_APY,
  MUSD_CONVERSION_DEFAULT_CHAIN_ID,
  MUSD_TOKEN_ADDRESS,
} from './constants';
import {
  createMusdCtaClickedEventProperties,
  MUSD_EVENTS_CONSTANTS,
  type MusdCtaClickedEventProperties,
} from './musd-events';

// ============================================================================
// Types
// ============================================================================

export type MusdBuyGetCtaProps = {
  /** CTA variant - 'buy' or 'get' */
  variant: BuyGetMusdCtaVariant | null;
  /** Selected chain ID (hex) */
  selectedChainId: Hex | null;
};

// ============================================================================
// Component
// ============================================================================

/**
 * Primary banner CTA for mUSD acquisition
 *
 * Shows different content based on variant:
 * - BUY: For empty wallets, routes to Ramp to buy mUSD
 * - GET: For users with convertible tokens, routes to conversion flow
 *
 * @param options0
 * @param options0.variant
 * @param options0.selectedChainId
 */
export const MusdBuyGetCta: React.FC<MusdBuyGetCtaProps> = ({
  variant,
  selectedChainId,
}) => {
  const t = useI18nContext();
  const { trackEvent } = useContext(MetaMetricsContext);
  const { startConversionFlow, educationSeen } = useMusdConversion();
  const { openBuyCryptoInPdapp } = useRamps();

  // Get network configuration for icon
  const networkConfigurationsByChainId = useSelector(
    getMultichainNetworkConfigurationsByChainId,
  );

  const networkConfig = selectedChainId
    ? networkConfigurationsByChainId[selectedChainId]
    : null;
  const networkName = networkConfig?.name ?? 'Unknown Network';
  const networkIcon = selectedChainId
    ? getImageForChainId(selectedChainId)
    : null;

  const musdIconUrl = useMemo(
    () =>
      getAssetImageUrl(
        MUSD_TOKEN_ADDRESS,
        selectedChainId ?? MUSD_CONVERSION_DEFAULT_CHAIN_ID,
      ) ?? '',
    [selectedChainId],
  );

  /**
   * CTA text based on variant
   */
  const ctaText = useMemo(() => {
    switch (variant) {
      case BuyGetMusdCtaVariant.BUY:
        return t('musdBuyMusd');
      case BuyGetMusdCtaVariant.GET:
        return t('musdGetMusd');
      default:
        return '';
    }
  }, [variant, t]);

  /**
   * Subtitle text with bonus percentage
   */
  const subtitleText = t('musdEarnBonusPercentage', [
    String(MUSD_CONVERSION_APY),
  ]);

  /**
   * Handle CTA click
   */
  const handleClick = useCallback(() => {
    const { REDIRECT_DESTINATIONS } = MUSD_EVENTS_CONSTANTS;
    let redirectsTo: MusdCtaClickedEventProperties['redirects_to'];
    if (variant === BuyGetMusdCtaVariant.BUY) {
      redirectsTo = REDIRECT_DESTINATIONS.BUY_SCREEN;
    } else if (educationSeen) {
      redirectsTo = REDIRECT_DESTINATIONS.CUSTOM_AMOUNT_SCREEN;
    } else {
      redirectsTo = REDIRECT_DESTINATIONS.CONVERSION_EDUCATION_SCREEN;
    }

    trackEvent({
      event: MetaMetricsEventName.MusdConversionCtaClicked,
      category: MetaMetricsEventCategory.Tokens,
      properties: createMusdCtaClickedEventProperties({
        location: MUSD_EVENTS_CONSTANTS.EVENT_LOCATIONS.HOME_SCREEN,
        redirectsTo,
        ctaType: MUSD_EVENTS_CONSTANTS.MUSD_CTA_TYPES.PRIMARY,
        ctaText,
        chainId: selectedChainId,
        chainName: networkName,
        clickTarget: MUSD_EVENTS_CONSTANTS.CTA_CLICK_TARGETS.CTA_BUTTON,
      }),
    });

    if (variant === BuyGetMusdCtaVariant.BUY) {
      openBuyCryptoInPdapp((selectedChainId as ChainId) ?? undefined);
    } else if (variant === BuyGetMusdCtaVariant.GET) {
      startConversionFlow({
        entryPoint: 'home',
      });
    }
  }, [
    variant,
    selectedChainId,
    networkName,
    ctaText,
    educationSeen,
    trackEvent,
    openBuyCryptoInPdapp,
    startConversionFlow,
  ]);

  // Don't render if no variant
  if (!variant) {
    return null;
  }

  return (
    <Box
      onClick={(e?: React.MouseEvent) => {
        e?.preventDefault();
        handleClick();
      }}
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      paddingTop={2}
      paddingBottom={2}
      paddingLeft={4}
      paddingRight={4}
      className="musd-buy-get-cta hover:bg-hover cursor-pointer"
      style={{ height: ASSET_CELL_HEIGHT }}
      data-testid="multichain-token-list-button"
    >
      <BadgeWrapper
        badge={
          selectedChainId && networkIcon ? (
            <AvatarNetwork
              size={AvatarNetworkSize.Xs}
              name={networkName}
              src={networkIcon}
              className="musd-buy-get-cta__avatar-network"
            />
          ) : undefined
        }
        className="musd-buy-get-cta__badge"
        data-testid="musd-buy-get-cta-icon"
      >
        <AvatarToken name="mUSD" src={musdIconUrl} />
      </BadgeWrapper>

      <Box
        flexDirection={BoxFlexDirection.Column}
        className="musd-buy-get-cta__text"
      >
        <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
          {ctaText}
        </Text>
        <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
          {subtitleText}
        </Text>
      </Box>

      <Button
        variant={ButtonVariant.Primary}
        size={ButtonSize.Sm}
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          e.preventDefault();
          handleClick();
        }}
        className="musd-buy-get-cta__button"
      >
        {ctaText}
      </Button>
    </Box>
  );
};

export default MusdBuyGetCta;
