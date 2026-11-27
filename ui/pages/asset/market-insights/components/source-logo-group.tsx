import React from 'react';
import {
  Box,
  BoxFlexDirection,
  Icon,
  IconColor,
  IconName,
  IconSize,
} from '@metamask/design-system-react';
import type { MarketInsightsSource } from '@metamask/ai-controllers';
import {
  getFaviconUrl,
  isXSourceUrl,
} from '../utils/market-insights-formatting';

const MAX_VISIBLE_SOURCE_LOGOS = 3;

export const SOURCE_LOGO_GROUP_TEST_ID = 'market-insights-source-logo-group';

type SourceLogoGroupProps = {
  /** Pre-deduplicated sources; only the first three are shown. */
  sources: MarketInsightsSource[];
};

/**
 * Renders a stacked row of up to three circular source logos. X (Twitter)
 * sources render the X icon instead of a favicon.
 *
 * @param props - Component props.
 * @param props.sources - Pre-deduplicated sources to render.
 * @returns The logo row, or null when there are no sources.
 */
export const SourceLogoGroup = ({ sources }: SourceLogoGroupProps) => {
  const visibleLogos = sources.slice(0, MAX_VISIBLE_SOURCE_LOGOS);

  if (visibleLogos.length === 0) {
    return null;
  }

  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      data-testid={SOURCE_LOGO_GROUP_TEST_ID}
    >
      {visibleLogos.map((source, index) => (
        <Box
          key={`${source.name}-${source.url}`}
          className={`h-4 w-4 overflow-hidden rounded-full border border-muted bg-default ${
            index > 0 ? '-ml-1' : ''
          }`}
        >
          {isXSourceUrl(source.url) ? (
            <Box className="flex h-4 w-4 items-center justify-center rounded-full">
              <Icon
                name={IconName.X}
                size={IconSize.Xs}
                color={IconColor.IconDefault}
              />
            </Box>
          ) : (
            <img
              src={getFaviconUrl(source.url)}
              alt=""
              className="h-4 w-4 rounded-full"
            />
          )}
        </Box>
      ))}
    </Box>
  );
};
