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
  AlignItems,
  BackgroundColor,
  Display,
  FlexDirection,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  ButtonPrimary,
  ButtonPrimarySize,
  Text,
} from '../../component-library';
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
import useRamps from '../../../hooks/ramps/useRamps/useRamps';
import { MUSD_CONVERSION_APY } from './constants';
import { MUSD_EVENTS_CONSTANTS } from './musd-events';

// ============================================================================
// Types
// ============================================================================

export type MusdBuyGetCtaProps = {
  /** CTA variant - 'buy' or 'get' */
  variant: BuyGetMusdCtaVariant | null;
  /** Selected chain ID (hex) */
  selectedChainId: Hex | null;
  /** Whether to show the network icon */
  showNetworkIcon?: boolean;
  /** Custom className */
  className?: string;
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
 * @param options0.showNetworkIcon
 * @param options0.className
 */
export const MusdBuyGetCta: React.FC<MusdBuyGetCtaProps> = ({
  variant,
  selectedChainId,
  showNetworkIcon = false,
  className,
}) => {
  const t = useI18nContext();
  const { trackEvent } = useContext(MetaMetricsContext);
  const { startConversionFlow } = useMusdConversion();
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
    // Track analytics event
    trackEvent({
      event: MetaMetricsEventName.MusdConversionCtaClicked,
      category: MetaMetricsEventCategory.Tokens,
      properties: {
        location: MUSD_EVENTS_CONSTANTS.EVENT_LOCATIONS.HOME_SCREEN,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        cta_type: MUSD_EVENTS_CONSTANTS.MUSD_CTA_TYPES.PRIMARY,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        cta_text: ctaText,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        cta_click_target: MUSD_EVENTS_CONSTANTS.CTA_CLICK_TARGETS.CTA_BUTTON,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        chain_id: selectedChainId,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        network_name: networkName,
        variant,
      },
    });

    if (variant === BuyGetMusdCtaVariant.BUY) {
      // Open buy flow (Ramp) for the selected chain
      // This will open the Portfolio dApp buy page with the selected chain
      openBuyCryptoInPdapp(selectedChainId ?? undefined);
    } else if (variant === BuyGetMusdCtaVariant.GET) {
      // Start conversion flow
      startConversionFlow({
        entryPoint: 'home',
      });
    }
  }, [
    variant,
    selectedChainId,
    networkName,
    ctaText,
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
      data-testid="musd-buy-get-cta"
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      justifyContent={JustifyContent.spaceBetween}
      alignItems={AlignItems.center}
      padding={4}
      tabIndex={0}
      onClick={handleClick}
      onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
      className={className}
      style={{ cursor: 'pointer', minHeight: '64px' }}
    >
      {/* Left side: Icon and text */}
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        alignItems={AlignItems.center}
        gap={3}
      >
        {/* Network icon (conditional) */}
        {showNetworkIcon && selectedChainId && networkIcon && (
          <Box data-testid="musd-buy-get-cta-network-icon">
            <AvatarNetwork
              src={networkIcon}
              name={networkName}
              size={AvatarNetworkSize.Md}
            />
          </Box>
        )}

        {/* mUSD icon (when no network icon) */}
        {!showNetworkIcon && (
          <Box
            display={Display.Flex}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
            backgroundColor={BackgroundColor.primaryMuted}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
            }}
          >
            <Text
              variant={TextVariant.bodyMdMedium}
              color={TextColor.primaryDefault}
            >
              M
            </Text>
          </Box>
        )}

        {/* Text content */}
        <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
          <Text variant={TextVariant.bodyMdMedium}>{ctaText}</Text>
          <Text variant={TextVariant.bodySm} color={TextColor.textAlternative}>
            {subtitleText}
          </Text>
        </Box>
      </Box>

      {/* Right side: Action button */}
      <ButtonPrimary
        size={ButtonPrimarySize.Sm}
        onClick={(e) => {
          e.stopPropagation();
          handleClick();
        }}
      >
        {ctaText}
      </ButtonPrimary>
    </Box>
  );
};

export default MusdBuyGetCta;
