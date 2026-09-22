import React, { useCallback } from 'react';
import {
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

// A lozenge filling its grid cell: logo, ticker and change sit inline on one
// row, matching mobile's `ExplorePill` (`rounded-full`, muted background, p-2).
// Unlike mobile's content-width pill, this one takes the full cell so the two
// columns line up; `min-w-0` lets the ticker truncate rather than push the
// change out of the cell, and `h-auto` prevents ButtonBase's fixed `h-12` from
// stretching the capsule.
const PILL_STYLES =
  'w-full min-w-0 h-auto justify-start gap-1.5 rounded-full bg-muted px-2 py-1.5 cursor-pointer hover:bg-hover active:bg-pressed';

/**
 * PerpsTopMoverPill renders one ranked market as a horizontal pill: token
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
  // Plain string derivations over primitives — cheaper to recompute than to memoize.
  const displaySymbol = getDisplaySymbol(market.symbol);
  const changeLabel = formatSignedChangePercent(market.change24hPercent);
  const changeColor = getChangeColor(market.change24hPercent);

  const handleClick = useCallback(() => {
    onPress(market);
  }, [onPress, market]);

  return (
    <ButtonBase
      className={PILL_STYLES}
      onClick={handleClick}
      data-testid={`perps-top-movers-pill-${market.symbol.replace(/:/gu, '-')}`}
    >
      <PerpsTokenLogo
        symbol={market.symbol}
        size={AvatarTokenSize.Sm}
        className="shrink-0"
      />
      <Text
        variant={TextVariant.BodySm}
        fontWeight={FontWeight.Medium}
        className="min-w-0 truncate"
      >
        {displaySymbol}
      </Text>
      <Text
        variant={TextVariant.BodySm}
        fontWeight={FontWeight.Medium}
        color={changeColor}
        className="shrink-0 whitespace-nowrap"
      >
        {changeLabel}
      </Text>
    </ButtonBase>
  );
};

export default PerpsTopMoverPill;
