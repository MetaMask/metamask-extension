///: BEGIN:ONLY_INCLUDE_IF(musd-conversion)
/**
 * MusdConvertLink Component
 *
 * An inline CTA link that appears next to token names in the token list.
 * Shows "Get X% bonus" text and navigates to the mUSD conversion flow.
 *
 * Follows the StakeableLink pattern from:
 * ui/components/multichain/token-list-item/stakeable-link.tsx
 */

import React, { useCallback, useContext } from 'react';
import type { Hex } from '@metamask/utils';
import {
  BackgroundColor,
  FontWeight,
  TextColor,
} from '../../../helpers/constants/design-system';
import { Box, Text } from '../../component-library';
import { MetaMetricsEventCategory } from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useMusdConversion } from '../../../hooks/musd';
import { MUSD_CONVERSION_APY } from '../../../../shared/constants/musd';
import {
  MUSD_EVENT_NAMES,
  MUSD_EVENTS_CONSTANTS,
} from '../../../helpers/constants/musd-events';

// ============================================================================
// Types
// ============================================================================

export type MusdConvertLinkProps = {
  /** Token address */
  tokenAddress: string;
  /** Chain ID (hex string) */
  chainId: string;
  /** Token symbol for analytics */
  tokenSymbol: string;
  /** Optional custom CTA text to display */
  ctaText?: string;
  /** Entry point for analytics tracking */
  entryPoint?: 'token_list' | 'asset_overview';
};

// ============================================================================
// Component
// ============================================================================

/**
 * Inline CTA link for mUSD conversion
 *
 * Displays as: • Get X% bonus
 * Clicking initiates the mUSD conversion flow
 *
 * @param options0
 * @param options0.tokenAddress
 * @param options0.chainId
 * @param options0.tokenSymbol
 * @param options0.ctaText
 * @param options0.entryPoint
 */
export const MusdConvertLink: React.FC<MusdConvertLinkProps> = ({
  tokenAddress,
  chainId,
  tokenSymbol,
  ctaText,
  entryPoint = 'token_list',
}) => {
  const t = useI18nContext();
  const { trackEvent } = useContext(MetaMetricsContext);
  const { startConversionFlow } = useMusdConversion();
  console.log('[MUSD CTA Debug] MusdConvertLink', {
    tokenAddress,
    chainId,
    tokenSymbol,
    ctaText,
    entryPoint,
  });
  /**
   * Default CTA text with APY percentage
   */
  const displayText =
    ctaText ?? t('musdGetBonusPercentage', [String(MUSD_CONVERSION_APY)]);

  /**
   * Handle click - start conversion flow with this token
   */
  const handleClick = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      // Prevent parent row click
      e.preventDefault();
      e.stopPropagation();

      // Track analytics event
      trackEvent({
        event: MUSD_EVENT_NAMES.MUSD_CONVERSION_CTA_CLICKED,
        category: MetaMetricsEventCategory.Tokens,
        properties: {
          location: MUSD_EVENTS_CONSTANTS.EVENT_LOCATIONS.TOKEN_LIST_ITEM,
          cta_type: MUSD_EVENTS_CONSTANTS.MUSD_CTA_TYPES.SECONDARY,
          cta_text: displayText,
          cta_click_target:
            MUSD_EVENTS_CONSTANTS.CTA_CLICK_TARGETS.CTA_TEXT_LINK,
          chain_id: chainId,
          token_symbol: tokenSymbol,
        },
      });

      console.log('[MUSD CTA Debug] Starting conversion flow', {
        tokenAddress,
        chainId,
        tokenSymbol,
        entryPoint,
      });
      // Start conversion flow with preferred token
      await startConversionFlow({
        preferredToken: {
          address: tokenAddress as Hex,
          chainId: chainId as Hex,
          symbol: tokenSymbol,
          // These will be filled by the conversion flow
          name: tokenSymbol,
          decimals: 6, // Default, will be updated
          balance: '0',
          fiatBalance: '0',
        },
        entryPoint,
      });
    },
    [
      chainId,
      tokenAddress,
      tokenSymbol,
      displayText,
      entryPoint,
      trackEvent,
      startConversionFlow,
    ],
  );

  return (
    <Box
      as="button"
      backgroundColor={BackgroundColor.transparent}
      data-testid={`musd-convert-link-${chainId}`}
      gap={1}
      paddingInline={0}
      paddingInlineStart={1}
      paddingInlineEnd={1}
      tabIndex={0}
      onClick={handleClick}
      className="musd-convert-link"
    >
      {/* Bullet separator */}
      <Text as="span" color={TextColor.textMuted}>
        {'\u2022'}
      </Text>
      {/* CTA text */}
      <Text
        as="span"
        color={TextColor.primaryDefault}
        paddingInlineStart={1}
        paddingInlineEnd={1}
        fontWeight={FontWeight.Medium}
      >
        {displayText}
      </Text>
    </Box>
  );
};

export default MusdConvertLink;
///: END:ONLY_INCLUDE_IF
