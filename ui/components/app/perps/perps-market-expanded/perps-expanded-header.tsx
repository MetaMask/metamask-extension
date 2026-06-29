import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  Text,
  TextVariant,
  TextColor,
  FontWeight,
  AvatarTokenSize,
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { DEFAULT_ROUTE } from '../../../../helpers/constants/routes';
import { usePerpsLivePrices } from '../../../../hooks/perps/stream';
import { PerpsTokenLogo } from '../perps-token-logo';
import {
  getChangeColor,
  formatSignedChangePercent,
  getDisplayName,
} from '../utils';
import { formatPerpsFiatUniversal } from '../utils/formatPerpsDisplayPrice';

export type PerpsExpandedHeaderProps = {
  /** Market symbol being traded (e.g. 'BTC'). */
  symbol: string;
  /** Max leverage label for the market (e.g. '40x'), if known. */
  maxLeverageLabel?: string;
};

/**
 * Header for the expanded perps trading view.
 *
 * This is the single owner of the live price stream for the active market
 * (`activateStream: true`); other panels read the same shared channel without
 * re-activating it. Subscribing here — rather than at the page level — means a
 * price tick only re-renders the header, not the chart, order book, or trade
 * ticket.
 */
export const PerpsExpandedHeader = React.memo(
  ({ symbol, maxLeverageLabel }: PerpsExpandedHeaderProps) => {
    const t = useI18nContext();
    const navigate = useNavigate();

    const symbols = useMemo(() => [symbol], [symbol]);
    const { prices } = usePerpsLivePrices({
      symbols,
      activateStream: true,
      includeMarketData: true,
    });
    const livePrice = prices[symbol];

    const displayPrice = formatPerpsFiatUniversal(livePrice?.price ?? '0');
    const displayChange = formatSignedChangePercent(
      livePrice?.percentChange24h ?? '',
    );
    const displayName = getDisplayName(symbol);

    return (
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        gap={3}
        paddingLeft={4}
        paddingRight={4}
        paddingTop={3}
        paddingBottom={3}
        className="shrink-0 border-b border-muted bg-background-default"
        data-testid="perps-expanded-header"
      >
        <ButtonIcon
          iconName={IconName.ArrowLeft}
          size={ButtonIconSize.Md}
          ariaLabel={t('back')}
          onClick={() =>
            navigate({ pathname: DEFAULT_ROUTE, search: 'tab=perps' })
          }
          data-testid="perps-expanded-back-button"
        />
        <PerpsTokenLogo symbol={symbol} size={AvatarTokenSize.Md} />
        <Box flexDirection={BoxFlexDirection.Column}>
          <Box
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Center}
            gap={1}
          >
            <Text variant={TextVariant.HeadingMd}>{displayName}-USD</Text>
            {maxLeverageLabel && (
              <Box className="shrink-0 rounded-md bg-background-muted px-1.5">
                <Text
                  variant={TextVariant.BodyXs}
                  color={TextColor.TextAlternative}
                >
                  {maxLeverageLabel}
                </Text>
              </Box>
            )}
          </Box>
          <Box
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Baseline}
            gap={1}
          >
            <Text
              variant={TextVariant.HeadingSm}
              fontWeight={FontWeight.Medium}
              data-testid="perps-expanded-price"
            >
              {displayPrice}
            </Text>
            <Text
              variant={TextVariant.BodySm}
              fontWeight={FontWeight.Medium}
              color={getChangeColor(displayChange)}
              data-testid="perps-expanded-change"
            >
              {displayChange}
            </Text>
          </Box>
        </Box>
      </Box>
    );
  },
);

PerpsExpandedHeader.displayName = 'PerpsExpandedHeader';
