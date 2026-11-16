import React, { useCallback, useMemo, useState } from 'react';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  Icon,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
  FontWeight,
} from '@metamask/design-system-react';
import type { MarketInsightsReport } from '@metamask/ai-controllers';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { SlidingTextCarousel } from './sliding-text-carousel';

export const MARKET_INSIGHTS_ENTRY_CARD_TEST_ID = 'market-insights-entry-card';
export const MARKET_INSIGHTS_INFO_BUTTON_TEST_ID =
  'market-insights-info-button';

export type MarketInsightsEntryCardProps = {
  /** The market insights report to render. */
  report: MarketInsightsReport;
  /** Relative time since the report was generated (e.g., "3m ago"). */
  timeAgo: string;
  /** Called when the card is pressed. */
  onPress?: () => void;
  /** Called when the footer info icon is pressed. */
  onDisclaimerPress: () => void;
};

/**
 * MarketInsightsEntryCard is the entry point card shown on the asset details
 * page. Pressing it opens the full Market Insights view.
 */
export const MarketInsightsEntryCard = ({
  report,
  timeAgo,
  onPress,
  onDisclaimerPress,
}: MarketInsightsEntryCardProps) => {
  const t = useI18nContext();
  const [borderAnimationKey, setBorderAnimationKey] = useState(0);

  // Derive a stable key from actual text content so the memo doesn't bust
  // when the parent passes a new report object with identical data.
  const trendsKey = report.trends.map((trend) => trend.description).join('\0');
  const displayTexts = useMemo(() => {
    const descriptions = report.trends
      .map((trend) => trend.description)
      .filter(Boolean);
    return descriptions.length > 0 ? descriptions : [report.summary];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trendsKey, report.summary]);

  const handleSlideStart = useCallback(() => {
    setBorderAnimationKey((key) => key + 1);
  }, []);

  return (
    <Box
      className="relative flex flex-col gap-1 rounded-xl bg-background-alternative p-4"
      data-testid={MARKET_INSIGHTS_ENTRY_CARD_TEST_ID}
    >
      <Box
        aria-hidden
        className="pointer-events-none absolute inset-0"
        key={borderAnimationKey}
      >
        <svg className="h-full w-full overflow-visible">
          <defs>
            <linearGradient
              id="market-insights-chrome-gradient"
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              {/* eslint-disable-next-line @metamask/design-tokens/color-no-hex -- AI-branding gradient chrome, not yet available as design tokens */}
              <stop offset="0%" stopColor="#ED666E" />
              {/* eslint-disable-next-line @metamask/design-tokens/color-no-hex -- AI-branding gradient chrome, not yet available as design tokens */}
              <stop offset="100%" stopColor="#D86FCF" />
            </linearGradient>
          </defs>
          <rect
            x="1.25"
            y="1.25"
            rx="10.75"
            pathLength={100}
            fill="none"
            stroke="url(#market-insights-chrome-gradient)"
            strokeWidth={2.5}
            strokeLinecap="round"
            width="calc(100% - 2.5px)"
            height="calc(100% - 2.5px)"
            className="market-insights-border-sweep"
          />
        </svg>
      </Box>
      {onPress && (
        <button
          type="button"
          aria-label={t('marketInsightsTitle')}
          onClick={onPress}
          className="absolute inset-0 z-0 cursor-pointer rounded-xl"
          data-testid="market-insights-entry-card-button"
        />
      )}
      <Box
        className={
          onPress
            ? 'pointer-events-none relative z-10 flex flex-col gap-1'
            : 'relative flex flex-col gap-1'
        }
      >
        <Box className="flex items-center gap-1">
          <Text
            variant={TextVariant.BodyMd}
            fontWeight={FontWeight.Medium}
            className="market-insights-chrome-text"
          >
            {t('marketInsightsTitle')}
          </Text>
          <Icon
            name={IconName.ArrowRight}
            size={IconSize.Sm}
            className="market-insights-chrome-icon"
          />
        </Box>
        <SlidingTextCarousel
          texts={displayTexts}
          onSlideStart={handleSlideStart}
        />
        <Box className="mt-0.5 flex items-center gap-1">
          <Icon
            name={IconName.Ai}
            size={IconSize.Md}
            className="market-insights-chrome-icon"
          />
          <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
            {t('marketInsightsFooterDisclaimer')} • {timeAgo}
          </Text>
          <Box className="pointer-events-auto">
            <ButtonIcon
              iconName={IconName.Info}
              ariaLabel={t('marketInsightsDisclaimerTitle')}
              size={ButtonIconSize.Xs}
              onClick={onDisclaimerPress}
              data-testid={MARKET_INSIGHTS_INFO_BUTTON_TEST_ID}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
