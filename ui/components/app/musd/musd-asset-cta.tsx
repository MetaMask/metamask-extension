/**
 * MusdAssetCta Component
 *
 * A dismissible card CTA that appears on eligible token detail pages.
 * Shows information about mUSD conversion bonus and provides a convert action.
 *
 * Design ported from mobile's MusdConversionAssetOverviewCta component:
 * - Horizontal row layout with mUSD icon, text content, and dismiss button
 * - Entire card is clickable to trigger conversion
 * - Dismiss button aligned to top-right
 */

import React, { useCallback, useContext } from 'react';
import { useDispatch } from 'react-redux';
import type { Hex } from '@metamask/utils';
import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxBorderColor,
  BoxFlexDirection,
  BoxJustifyContent,
  ButtonIcon,
  ButtonIconSize,
  FontWeight,
  IconName,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useMusdConversion } from '../../../hooks/musd';
import { addMusdConversionDismissedCtaKey } from '../../../store/actions';
import { MUSD_CONVERSION_APY } from './constants';
import { MUSD_EVENTS_CONSTANTS } from './musd-events';

// Runtime path: app/images/ is copied to images/ in the build (see development/build/static.js)
const MUSD_EDUCATION_COIN_IMAGE = './images/musd-icon-no-background-2x.png';

// ============================================================================
// Types
// ============================================================================

export type MusdAssetCtaToken = {
  /** Token address */
  address: string;
  /** Chain ID (hex string) */
  chainId: string;
  /** Token symbol */
  symbol: string;
  /** Token balance */
  balance: string;
  /** Fiat balance */
  fiatBalance: string;
};

export type MusdAssetCtaProps = {
  /** Token being viewed */
  token: MusdAssetCtaToken;
  /** Callback when CTA is dismissed */
  onDismiss?: () => void;
  /** Show as a card (true) or inline link (false) */
  variant?: 'card' | 'inline';
};

// ============================================================================
// Component
// ============================================================================

/**
 * Asset overview CTA for mUSD conversion
 *
 * Shows a promotional card encouraging users to convert their stablecoins
 * to mUSD for a bonus. Can be dismissed by the user.
 *
 * @param options0
 * @param options0.token
 * @param options0.onDismiss
 * @param options0.variant
 */
export const MusdAssetCta: React.FC<MusdAssetCtaProps> = ({
  token,
  onDismiss,
  variant = 'card',
}) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { trackEvent } = useContext(MetaMetricsContext);
  const { startConversionFlow } = useMusdConversion();

  /**
   * Generate CTA key for dismissal tracking
   */
  const ctaKey = `${token.chainId.toLowerCase()}-${token.address.toLowerCase()}`;

  /**
   * Handle convert button click
   */
  const handleConvert = useCallback(async () => {
    // Track analytics event
    trackEvent({
      event: MetaMetricsEventName.MusdConversionCtaClicked,
      category: MetaMetricsEventCategory.Tokens,
      properties: {
        location: MUSD_EVENTS_CONSTANTS.EVENT_LOCATIONS.ASSET_OVERVIEW,
        /* eslint-disable @typescript-eslint/naming-convention */
        cta_type: MUSD_EVENTS_CONSTANTS.MUSD_CTA_TYPES.TERTIARY,
        cta_text: t('musdBoostTitle', [String(MUSD_CONVERSION_APY)]),
        cta_click_target: MUSD_EVENTS_CONSTANTS.CTA_CLICK_TARGETS.CTA_BUTTON,
        chain_id: token.chainId,
        token_symbol: token.symbol,
        /* eslint-enable @typescript-eslint/naming-convention */
      },
    });

    // Start conversion flow with this token
    await startConversionFlow({
      preferredToken: {
        address: token.address as Hex,
        chainId: token.chainId as Hex,
      },
      entryPoint: 'asset_overview',
    });
  }, [token, trackEvent, startConversionFlow, t]);

  /**
   * Handle dismiss button click
   */
  const handleDismiss = useCallback(() => {
    dispatch(addMusdConversionDismissedCtaKey(ctaKey));
    onDismiss?.();
  }, [dispatch, ctaKey, onDismiss]);

  // Inline variant - simplified version
  if (variant === 'inline') {
    return (
      <Box
        data-testid="musd-asset-cta-inline"
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        justifyContent={BoxJustifyContent.Between}
        paddingLeft={4}
        paddingRight={4}
        paddingTop={2}
        paddingBottom={2}
        onClick={handleConvert}
        className="musd-asset-cta-inline"
      >
        <Text
          variant={TextVariant.BodyMd}
          fontWeight={FontWeight.Medium}
          color={TextColor.PrimaryDefault}
        >
          {t('musdBoostTitle', [String(MUSD_CONVERSION_APY)])}
        </Text>
      </Box>
    );
  }

  // Card variant - horizontal layout matching mobile design
  return (
    <Box
      data-testid="musd-asset-cta"
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      borderColor={BoxBorderColor.BorderMuted}
      backgroundColor={BoxBackgroundColor.BackgroundDefault}
      className="musd-asset-cta"
      onClick={handleConvert}
      onKeyPress={(e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleConvert();
        }
      }}
      tabIndex={0}
    >
      {/* mUSD Icon Container - Left section */}
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        justifyContent={BoxJustifyContent.Center}
        backgroundColor={BoxBackgroundColor.BackgroundMuted}
        className="musd-asset-cta__icon"
      >
        <img src={MUSD_EDUCATION_COIN_IMAGE} alt="mUSD" />
      </Box>

      {/* Text Content - Center section */}
      <Box
        flexDirection={BoxFlexDirection.Column}
        className="musd-asset-cta__content"
      >
        <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
          {t('musdBoostTitle', [String(MUSD_CONVERSION_APY)])}
        </Text>
        <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
          {t('musdBoostDescription', [String(MUSD_CONVERSION_APY)])}
        </Text>
      </Box>

      {/* Dismiss Button - Right section (aligned to top) */}
      <Box className="musd-asset-cta__dismiss">
        <ButtonIcon
          data-testid="musd-asset-cta-dismiss"
          iconName={IconName.Close}
          size={ButtonIconSize.Sm}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            handleDismiss();
          }}
          ariaLabel={t('dismiss') as string}
        />
      </Box>
    </Box>
  );
};

export default MusdAssetCta;
