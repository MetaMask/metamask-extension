///: BEGIN:ONLY_INCLUDE_IF(musd-conversion)
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
  AlignItems,
  BackgroundColor,
  BorderColor,
  BorderRadius,
  Display,
  FlexDirection,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Text,
} from '../../component-library';
import { MetaMetricsEventCategory } from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useMusdConversion } from '../../../hooks/musd';
import { addDismissedCtaKey } from '../../../ducks/musd/musd';
import { MUSD_CONVERSION_APY } from '../../../../shared/constants/musd';
import {
  MUSD_EVENT_NAMES,
  MUSD_EVENTS_CONSTANTS,
} from '../../../helpers/constants/musd-events';

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
      event: MUSD_EVENT_NAMES.MUSD_CONVERSION_CTA_CLICKED,
      category: MetaMetricsEventCategory.Tokens,
      properties: {
        location: MUSD_EVENTS_CONSTANTS.EVENT_LOCATIONS.ASSET_OVERVIEW,
        cta_type: MUSD_EVENTS_CONSTANTS.MUSD_CTA_TYPES.TERTIARY,
        cta_text: t('musdBoostTitle', [String(MUSD_CONVERSION_APY)]),
        cta_click_target: MUSD_EVENTS_CONSTANTS.CTA_CLICK_TARGETS.CTA_BUTTON,
        chain_id: token.chainId,
        token_symbol: token.symbol,
      },
    });

    // Start conversion flow with this token
    await startConversionFlow({
      preferredToken: {
        address: token.address as Hex,
        chainId: token.chainId as Hex,
        symbol: token.symbol,
        name: token.symbol,
        decimals: 6, // Default, will be updated
        balance: token.balance,
        fiatBalance: token.fiatBalance,
      },
      entryPoint: 'asset_overview',
    });
  }, [token, trackEvent, startConversionFlow, t]);

  /**
   * Handle dismiss button click
   */
  const handleDismiss = useCallback(() => {
    // Dispatch action to track dismissal
    dispatch(addDismissedCtaKey(ctaKey));

    // Call optional callback
    onDismiss?.();
  }, [dispatch, ctaKey, onDismiss]);

  // Inline variant - simplified version
  if (variant === 'inline') {
    return (
      <Box
        data-testid="musd-asset-cta-inline"
        display={Display.Flex}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.spaceBetween}
        paddingLeft={4}
        paddingRight={4}
        paddingTop={2}
        paddingBottom={2}
        onClick={handleConvert}
        className="musd-asset-cta-inline"
        style={{ cursor: 'pointer' }}
      >
        <Text
          variant={TextVariant.bodyMdMedium}
          color={TextColor.primaryDefault}
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
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      alignItems={AlignItems.center}
      borderRadius={BorderRadius.LG}
      borderColor={BorderColor.borderMuted}
      backgroundColor={BackgroundColor.backgroundDefault}
      className="musd-asset-cta"
      onClick={handleConvert}
      onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleConvert();
        }
      }}
      tabIndex={0}
      style={{
        borderWidth: '1px',
        borderStyle: 'solid',
        paddingLeft: '16px',
        paddingRight: '12px',
        gap: '16px',
        cursor: 'pointer',
      }}
    >
      {/* mUSD Icon Container - Left section */}
      <Box
        display={Display.Flex}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.center}
        backgroundColor={BackgroundColor.backgroundMuted}
        borderRadius={BorderRadius.LG}
        style={{
          width: '60px',
          height: '60px',
          minWidth: '60px',
          overflow: 'hidden',
        }}
      >
        <img
          src={MUSD_EDUCATION_COIN_IMAGE}
          alt="mUSD"
          style={{
            width: '60px',
            height: '60px',
            objectFit: 'cover',
          }}
        />
      </Box>

      {/* Text Content - Center section */}
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        style={{
          flex: 1,
          gap: '4px',
          paddingTop: '16px',
          paddingBottom: '16px',
        }}
      >
        <Text variant={TextVariant.bodyMdMedium}>
          {t('musdBoostTitle', [String(MUSD_CONVERSION_APY)])}
        </Text>
        <Text variant={TextVariant.bodySm} color={TextColor.textAlternative}>
          {t('musdBoostDescription', [String(MUSD_CONVERSION_APY)])}
        </Text>
      </Box>

      {/* Dismiss Button - Right section (aligned to top) */}
      <Box style={{ alignSelf: 'flex-start', marginTop: '16px' }}>
        <ButtonIcon
          data-testid="musd-asset-cta-dismiss"
          iconName={IconName.Close}
          size={ButtonIconSize.Sm}
          onClick={(e) => {
            e.stopPropagation();
            handleDismiss();
          }}
          ariaLabel={t('dismiss')}
        />
      </Box>
    </Box>
  );
};

export default MusdAssetCta;
///: END:ONLY_INCLUDE_IF
