/**
 * MusdConvertLink Component
 *
 * A CTA link that appears in the token list footer-right slot.
 * Shows "Get X% bonus" text and navigates to the mUSD conversion flow.
 */

import React, { useCallback, useContext } from 'react';
import type { Hex } from '@metamask/utils';
import {
  FontWeight,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { Text } from '../../component-library';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useMusdConversion } from '../../../hooks/musd';
import { MUSD_CONVERSION_APY } from './constants';
import { MUSD_EVENTS_CONSTANTS } from './musd-events';

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
 * CTA link for mUSD conversion, rendered in the token cell footer-right.
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

  const displayText =
    ctaText ?? t('musdGetBonusPercentage', [String(MUSD_CONVERSION_APY)]);

  const handleClick = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      e.preventDefault();
      e.stopPropagation();

      trackEvent({
        event: MetaMetricsEventName.MusdConversionCtaClicked,
        category: MetaMetricsEventCategory.Tokens,
        properties: {
          location: MUSD_EVENTS_CONSTANTS.EVENT_LOCATIONS.TOKEN_LIST_ITEM,
          /* eslint-disable @typescript-eslint/naming-convention */
          cta_type: MUSD_EVENTS_CONSTANTS.MUSD_CTA_TYPES.SECONDARY,
          cta_text: displayText,
          cta_click_target:
            MUSD_EVENTS_CONSTANTS.CTA_CLICK_TARGETS.CTA_TEXT_LINK,
          chain_id: chainId,
          token_symbol: tokenSymbol,
          /* eslint-enable @typescript-eslint/naming-convention */
        },
      });

      await startConversionFlow({
        preferredToken: {
          address: tokenAddress as Hex,
          chainId: chainId as Hex,
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
    <button
      type="button"
      onClick={handleClick}
      data-testid={`musd-convert-link-${chainId}`}
      style={{
        cursor: 'pointer',
        background: 'none',
        border: 'none',
        padding: 0,
        margin: 0,
        font: 'inherit',
      }}
    >
      <Text
        variant={TextVariant.bodySmMedium}
        color={TextColor.primaryDefault}
        fontWeight={FontWeight.Medium}
        data-testid="musd-convert-link-text"
      >
        {displayText}
      </Text>
    </button>
  );
};

export default MusdConvertLink;
