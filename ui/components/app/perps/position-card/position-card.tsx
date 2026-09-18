import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  twMerge,
  Box,
  BoxFlexDirection,
  BoxAlignItems,
  ButtonBase,
  Text,
  SensitiveText,
  TextVariant,
  TextColor,
  FontWeight,
  AvatarTokenSize,
} from '@metamask/design-system-react';
import { useNavigate } from 'react-router-dom';
import type { Position } from '@metamask/perps-controller';
import { useFormatters } from '../../../../hooks/useFormatters';
import { getIsPerpsShowFullAssetNamesEnabled } from '../../../../selectors/perps/feature-flags';
import { formatPnl } from '../../../../../shared/lib/perps-formatters';
import { getPreferences } from '../../../../../shared/lib/selectors/preferences';
import { formatPerpsFiatMinimal } from '../utils/formatPerpsDisplayPrice';
import { PerpsTokenLogo } from '../perps-token-logo';
import {
  getDisplaySymbol,
  getPositionDirection,
  getPrivacyAwareColor,
} from '../utils';
import { PERPS_MARKET_DETAIL_ROUTE } from '../../../../helpers/constants/routes';

export type PositionCardProps = {
  position: Position;
  onClick?: (position: Position) => void;
  /** Full asset name (e.g. 'Bitcoin'); falls back to the ticker when omitted */
  assetName?: string;
};

/**
 * PositionCard component displays individual position information
 * Two rows: coin/leverage/direction + size on left, position value + P&L on right
 * Clicking the card navigates to the market detail page for that symbol
 *
 * @param options0 - Component props
 * @param options0.position - The position data to display
 * @param options0.onClick
 * @param options0.assetName - Full asset name; falls back to the ticker when omitted
 */
export const PositionCard = ({
  position,
  onClick,
  assetName,
}: PositionCardProps) => {
  const navigate = useNavigate();
  const { privacyMode } = useSelector(getPreferences);
  const { formatPercentWithMinThreshold } = useFormatters();
  const showFullAssetNames = useSelector(getIsPerpsShowFullAssetNamesEnabled);
  const direction = getPositionDirection(position.size);
  const pnlNum = parseFloat(position.unrealizedPnl);
  const isProfit = pnlNum >= 0;
  const pnlColor = getPrivacyAwareColor(
    isProfit ? TextColor.SuccessDefault : TextColor.ErrorDefault,
    privacyMode,
  );
  const absSize = Math.abs(parseFloat(position.size)).toString();
  // Title uses the full asset name when enabled; the size line keeps the ticker
  // as its unit. When the flag is off, fall back to the ticker.
  const displayName = getDisplaySymbol(
    showFullAssetNames ? assetName || position.symbol : position.symbol,
  );
  const displaySymbol = getDisplaySymbol(position.symbol);
  const formattedPnl = formatPnl(pnlNum);
  const roeNum = Number.parseFloat(position.returnOnEquity);
  const formattedRoe = Number.isNaN(roeNum)
    ? null
    : formatPercentWithMinThreshold(roeNum);

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick(position);
    } else {
      // TODO: Add Metrics tracking
      navigate(
        `${PERPS_MARKET_DETAIL_ROUTE}/${encodeURIComponent(position.symbol)}`,
      );
    }
  }, [navigate, position, onClick]);

  return (
    <ButtonBase
      className={twMerge(
        // Reset ButtonBase defaults for card layout
        'justify-start rounded-none min-w-0',
        // Card styles (matches tokens tab: 62px height, 8px v-padding, 16px h-padding, 16px gap)
        'gap-4 text-left cursor-pointer',
        'bg-default pt-2 pb-2 px-4 h-[62px]',
        'hover:bg-hover active:bg-pressed',
        '[container-name:list-item] [container-type:inline-size]',
      )}
      isFullWidth
      onClick={handleClick}
      data-testid={`position-card-${position.symbol}`}
    >
      {/* Token Logo */}
      <PerpsTokenLogo
        symbol={position.symbol}
        size={AvatarTokenSize.Md}
        className="shrink-0"
      />

      {/* Left side: Coin info and size */}
      <Box
        className="min-w-0 flex-1"
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Start}
        gap={1}
      >
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          gap={1}
        >
          <Text
            fontWeight={FontWeight.Medium}
            className="text-s-body-md @compact:text-s-body-sm"
          >
            {displayName}
          </Text>
          <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
            {position.leverage.value}x {direction}
          </Text>
        </Box>
        <SensitiveText
          variant={TextVariant.BodySm}
          color={TextColor.TextAlternative}
          isHidden={privacyMode}
        >
          {`${absSize} ${displaySymbol}`}
        </SensitiveText>
      </Box>

      {/* Right side: Position value and P&L */}
      <Box
        className="shrink-0"
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.End}
        gap={1}
      >
        <SensitiveText
          fontWeight={FontWeight.Medium}
          className="text-s-body-md @compact:text-s-body-sm"
          isHidden={privacyMode}
        >
          {formatPerpsFiatMinimal(parseFloat(position.positionValue))}
        </SensitiveText>
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Baseline}
          gap={1}
        >
          <SensitiveText
            variant={TextVariant.BodySm}
            color={pnlColor}
            isHidden={privacyMode}
          >
            {formattedPnl}
          </SensitiveText>
          {formattedRoe !== null && (
            <SensitiveText
              variant={TextVariant.BodySm}
              color={pnlColor}
              isHidden={privacyMode}
              data-testid={`position-card-roe-${position.symbol}`}
            >
              ({formattedRoe})
            </SensitiveText>
          )}
        </Box>
      </Box>
    </ButtonBase>
  );
};

export default PositionCard;
