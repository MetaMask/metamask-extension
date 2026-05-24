/**
 * MusdBuyGetCta Component
 *
 * Primary banner CTA that appears above the token list.
 * Headline shows the MetaMask USD product name; the button shows "Buy mUSD" or "Get mUSD" by variant.
 *
 * Based on mobile's MusdConversionAssetListCta component.
 */

import React, { useCallback, useContext, useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { Hex } from '@metamask/utils';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  Button,
  ButtonSize,
  ButtonVariant,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  AvatarToken,
  BadgeWrapper,
} from '../../component-library';
import { BackgroundColor } from '../../../helpers/constants/design-system';
import type { ChainId } from '../../../../shared/constants/network';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  useMusdConversion,
  useMusdConversionTokens,
} from '../../../hooks/musd';
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
  resolveMusdConversionCtaRedirectsTo,
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
 * Shows different button labels and destinations based on variant:
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
  const { defaultPaymentToken } = useMusdConversionTokens();
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
  const ctaButtonText = useMemo(() => {
    switch (variant) {
      case BuyGetMusdCtaVariant.BUY:
        return t('musdBuyMusd');
      case BuyGetMusdCtaVariant.GET:
        return t('musdGetMusd');
      default:
        return '';
    }
  }, [variant, t]);

  // Product name line (same for BUY and GET); action copy is ctaButtonText.
  const ctaText = t('musdMetaMaskUsd');

  /**
   * Handle CTA click
   */
  const handleClick = useCallback(() => {
    const redirectsTo = resolveMusdConversionCtaRedirectsTo(
      variant === BuyGetMusdCtaVariant.BUY
        ? { intent: 'buy' }
        : { intent: 'conversion', educationSeen },
    );

    const eventProperties = createMusdCtaClickedEventProperties({
      location: MUSD_EVENTS_CONSTANTS.EVENT_LOCATIONS.HOME_SCREEN,
      redirectsTo,
      ctaType: MUSD_EVENTS_CONSTANTS.MUSD_CTA_TYPES.PRIMARY,
      ctaText: ctaButtonText,
      chainId: selectedChainId,
      chainName: networkName,
      clickTarget: MUSD_EVENTS_CONSTANTS.CTA_CLICK_TARGETS.CTA_BUTTON,
    });

    trackEvent({
      event: MetaMetricsEventName.MusdConversionCtaClicked,
      category: MetaMetricsEventCategory.Tokens,
      properties: eventProperties,
    });

    if (variant === BuyGetMusdCtaVariant.BUY) {
      openBuyCryptoInPdapp((selectedChainId as ChainId) ?? undefined);
    } else if (variant === BuyGetMusdCtaVariant.GET) {
      if (!defaultPaymentToken) {
        console.error(
          '[MUSD] No default payment token was found for conversion',
        );
        return;
      }
      startConversionFlow({
        entryPoint: 'home',
        preferredToken: {
          address: defaultPaymentToken.address,
          chainId: defaultPaymentToken.chainId,
        },
      });
    }
  }, [
    variant,
    selectedChainId,
    networkName,
    ctaButtonText,
    educationSeen,
    trackEvent,
    openBuyCryptoInPdapp,
    startConversionFlow,
    defaultPaymentToken,
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
              backgroundColor={BackgroundColor.backgroundDefault}
              borderWidth={2}
            />
          ) : undefined
        }
        marginRight={4}
        style={{ alignSelf: 'center' }}
        data-testid="musd-buy-get-cta-icon"
      >
        <AvatarToken name="mUSD" src={musdIconUrl} />
      </BadgeWrapper>

      <Box
        flexDirection={BoxFlexDirection.Column}
        className="musd-buy-get-cta__text"
      >
        <Text variant={TextVariant.BodyMd} color={TextColor.TextDefault}>
          {ctaText}
        </Text>
        <Text variant={TextVariant.BodySm} color={TextColor.PrimaryDefault}>
          {t('musdEarnBonusPercentage', [String(MUSD_CONVERSION_APY)])}
        </Text>
      </Box>

      <Button
        variant={ButtonVariant.Secondary}
        size={ButtonSize.Sm}
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          e.preventDefault();
          handleClick();
        }}
        className="musd-buy-get-cta__button"
      >
        {ctaButtonText}
      </Button>
    </Box>
  );
};

export default MusdBuyGetCta;
