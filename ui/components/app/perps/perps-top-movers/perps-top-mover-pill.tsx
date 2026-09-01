import React, { useCallback, useMemo } from 'react';
import {
  Box,
  BoxFlexDirection,
  BoxAlignItems,
  ButtonBase,
  Text,
  TextVariant,
  FontWeight,
  AvatarTokenSize,
} from '@metamask/design-system-react';
import { PerpsTokenLogo } from '../perps-token-logo';
import {
  getChangeColor,
  getDisplaySymbol,
  formatSignedChangePercent,
} from '../utils';
import type { PerpsMarketData } from '../types';

export type PerpsTopMoverPillProps = {
  /** Market to render in the pill */
  market: PerpsMarketData;
  /** Callback when the pill is pressed */
  onPress: (market: PerpsMarketData) => void;
};

// A pill is one grid cell: logo, ticker, and signed 24h change on a muted
// rounded surface. `h-auto`/`min-h-[48px]` overrides ButtonBase's fixed `h-12`
// so the label never clips when a long ticker wraps the row taller.
const PILL_STYLES =
  'w-full min-w-0 h-auto min-h-[48px] justify-start gap-2 rounded-xl bg-muted px-3 py-2 text-left cursor-pointer hover:bg-hover active:bg-pressed';

/**
 * PerpsTopMoverPill renders one ranked market in the Top movers grid: token
 * logo, display ticker, and its signed 24h price change coloured by direction.
 *
 * @param options0 - Component props.
 * @param options0.market - The market to render.
 * @param options0.onPress - Called with the market when the pill is pressed.
 */
export const PerpsTopMoverPill = ({
  market,
  onPress,
}: PerpsTopMoverPillProps) => {
  const displaySymbol = useMemo(
    () => getDisplaySymbol(market.symbol),
    [market.symbol],
  );
  const changeLabel = useMemo(
    () => formatSignedChangePercent(market.change24hPercent),
    [market.change24hPercent],
  );
  const changeColor = useMemo(
    () => getChangeColor(market.change24hPercent),
    [market.change24hPercent],
  );

  const handleClick = useCallback(() => {
    onPress(market);
  }, [onPress, market]);

  return (
    <ButtonBase
      className={PILL_STYLES}
      isFullWidth
      onClick={handleClick}
      data-testid={`perps-top-movers-pill-${market.symbol.replace(/:/gu, '-')}`}
    >
      <PerpsTokenLogo
        symbol={market.symbol}
        size={AvatarTokenSize.Sm}
        className="shrink-0"
      />
      <Box
        className="min-w-0 flex-1 overflow-hidden"
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Start}
        gap={0}
      >
        <Text
          variant={TextVariant.BodySm}
          fontWeight={FontWeight.Medium}
          className="block max-w-full truncate"
        >
          {displaySymbol}
        </Text>
        <Text
          variant={TextVariant.BodyXs}
          color={changeColor}
          className="block max-w-full truncate"
        >
          {changeLabel}
        </Text>
      </Box>
    </ButtonBase>
  );
};

export default PerpsTopMoverPill;
