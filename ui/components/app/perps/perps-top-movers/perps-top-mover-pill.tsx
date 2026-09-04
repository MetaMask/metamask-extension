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

// A content-width lozenge: logo, ticker and change sit inline on one row,
// matching mobile's `ExplorePill` (`rounded-full`, muted background, p-2).
// `w-auto`/`shrink-0` override ButtonBase's full-width default so each pill
// hugs its label the way mobile's do; `h-auto` prevents the fixed `h-12` from
// stretching the capsule.
const PILL_STYLES =
  'w-auto shrink-0 h-auto justify-center gap-1.5 rounded-full bg-muted px-2 py-1.5 cursor-pointer hover:bg-hover active:bg-pressed';

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
        className="whitespace-nowrap"
      >
        {displaySymbol}
      </Text>
      <Text
        variant={TextVariant.BodySm}
        fontWeight={FontWeight.Medium}
        color={changeColor}
        className="whitespace-nowrap"
      >
        {changeLabel}
      </Text>
    </ButtonBase>
  );
};

export default PerpsTopMoverPill;
