/**
 * MusdConvertLink Component
 *
 * A CTA link that appears in the token list footer-right slot.
 * Shows "Get X% bonus" text and navigates to the mUSD conversion flow.
 */

import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useSelector } from 'react-redux';
import type { Hex } from '@metamask/utils';
import {
  FontWeight,
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
import { getMultichainNetworkConfigurationsByChainId } from '../../../selectors/multichain';
import { MUSD_CONVERSION_APY } from './constants';
import {
  createMusdCtaClickedEventProperties,
  musdConversionFlowEntryPointToCtaEventLocation,
  MUSD_EVENTS_CONSTANTS,
  resolveMusdConversionCtaRedirectsTo,
  type MusdConvertLinkEntryPoint,
} from './musd-events';

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
  entryPoint?: MusdConvertLinkEntryPoint;
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
  const { startConversionFlow, educationSeen } = useMusdConversion();
  const networkConfigurationsByChainId = useSelector(
    getMultichainNetworkConfigurationsByChainId,
  );
  const networkName =
    networkConfigurationsByChainId[chainId as Hex]?.name ?? 'Unknown Network';
  const [isLoading, setIsLoading] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const displayText =
    ctaText ?? t('musdGetBonusPercentage', [String(MUSD_CONVERSION_APY)]);

  const handleClick = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      e.preventDefault();
      e.stopPropagation();

      if (isLoading) {
        return;
      }

      setIsLoading(true);

      const redirectsTo = resolveMusdConversionCtaRedirectsTo({
        intent: 'conversion',
        educationSeen,
      });
      const eventLocation =
        musdConversionFlowEntryPointToCtaEventLocation(entryPoint);

      trackEvent({
        event: MetaMetricsEventName.MusdConversionCtaClicked,
        category: MetaMetricsEventCategory.Tokens,
        properties: createMusdCtaClickedEventProperties({
          location: eventLocation,
          redirectsTo,
          ctaType: MUSD_EVENTS_CONSTANTS.MUSD_CTA_TYPES.SECONDARY,
          ctaText: displayText,
          chainId,
          chainName: networkName,
          assetSymbol: tokenSymbol,
          clickTarget: MUSD_EVENTS_CONSTANTS.CTA_CLICK_TARGETS.CTA_TEXT_LINK,
        }),
      });

      try {
        await startConversionFlow({
          preferredToken: {
            address: tokenAddress as Hex,
            chainId: chainId as Hex,
          },
          entryPoint,
        });
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    },
    [
      isLoading,
      chainId,
      tokenAddress,
      tokenSymbol,
      displayText,
      entryPoint,
      educationSeen,
      networkName,
      trackEvent,
      startConversionFlow,
    ],
  );

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      data-testid={`musd-convert-link-${chainId}`}
      className="musd-convert-link"
    >
      <Text
        variant={TextVariant.BodySm}
        color={TextColor.PrimaryDefault}
        fontWeight={FontWeight.Medium}
        data-testid="musd-convert-link-text"
        style={isLoading ? { opacity: 0.5 } : undefined}
      >
        {displayText}
      </Text>
    </button>
  );
};

export default MusdConvertLink;
