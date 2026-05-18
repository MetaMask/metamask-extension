import React, { useCallback } from 'react';
import {
  twMerge,
  Box,
  BoxFlexDirection,
  BoxAlignItems,
  BoxJustifyContent,
  ButtonBase,
  Text,
  TextVariant,
  TextColor,
  FontWeight,
  AvatarTokenSize,
  Icon,
  IconColor,
  IconName,
  IconSize,
} from '@metamask/design-system-react';
import { useNavigate } from 'react-router-dom';
import type { Position } from '@metamask/perps-controller';
import { useFormatters } from '../../../../hooks/useFormatters';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { formatPnl } from '../../../../../shared/lib/perps-formatters';
import {
  formatPerpsFiatMinimal,
  formatPerpsFiatUniversal,
} from '../utils/formatPerpsDisplayPrice';
import { PerpsTokenLogo } from '../perps-token-logo';
import { getDisplayName, getPositionDirection } from '../utils';
import { PERPS_MARKET_DETAIL_ROUTE } from '../../../../helpers/constants/routes';

export type PositionCardProps = {
  position: Position;
  onClick?: (position: Position) => void;
  variant?: 'default' | 'expanded';
  onOpenTPSL?: (position: Position) => void;
  onAddMargin?: (position: Position) => void;
  onReverse?: (position: Position) => void;
  onClose?: (position: Position) => void;
};

/**
 * PositionCard component displays individual position information
 * Two rows: coin/leverage/direction + size on left, position value + P&L on right
 * Clicking the card navigates to the market detail page for that symbol
 *
 * @param options0 - Component props
 * @param options0.position - The position data to display
 * @param options0.onClick
 * @param options0.variant
 * @param options0.onOpenTPSL
 * @param options0.onAddMargin
 * @param options0.onReverse
 * @param options0.onClose
 */
export const PositionCard: React.FC<PositionCardProps> = ({
  position,
  onClick,
  variant = 'default',
  onOpenTPSL,
  onAddMargin,
  onReverse,
  onClose,
}) => {
  const navigate = useNavigate();
  const t = useI18nContext();
  const { formatPercentWithMinThreshold } = useFormatters();
  const direction = getPositionDirection(position.size);
  const pnlNum = parseFloat(position.unrealizedPnl);
  const isProfit = pnlNum >= 0;
  const absSize = Math.abs(parseFloat(position.size)).toString();
  const displayName = getDisplayName(position.symbol);
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

  if (variant === 'expanded') {
    const isLong = parseFloat(position.size) >= 0;
    const positionValue = formatPerpsFiatMinimal(position.positionValue);
    const marginValue = formatPerpsFiatMinimal(position.marginUsed);
    const formattedPnlWithRoe =
      formattedRoe === null
        ? formattedPnl
        : `${formattedPnl} (${formattedRoe})`;
    const takeProfitPrice = position.takeProfitPrice
      ? formatPerpsFiatUniversal(position.takeProfitPrice)
      : '-';
    const stopLossPrice = position.stopLossPrice
      ? formatPerpsFiatUniversal(position.stopLossPrice)
      : '-';

    return (
      <Box
        className={twMerge(
          'min-h-[72px] gap-4 border-b border-border-muted bg-default px-4 py-2 last:border-b-0',
          'items-center text-left hover:bg-hover',
        )}
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        data-testid={`perps-expanded-position-row-${position.symbol}`}
      >
        <PerpsTokenLogo
          symbol={position.symbol}
          size={AvatarTokenSize.Md}
          className="shrink-0"
        />

        <Box
          flexDirection={BoxFlexDirection.Column}
          alignItems={BoxAlignItems.Start}
          className="min-w-0 flex-1"
          gap={1}
        >
          <Box
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Center}
            gap={1}
            className="min-w-0"
          >
            <Text fontWeight={FontWeight.Medium} className="truncate">
              {displayName}
            </Text>
            <Text
              variant={TextVariant.BodySm}
              color={TextColor.TextAlternative}
              className="shrink-0"
            >
              {position.leverage.value}x {direction}
            </Text>
          </Box>
          <Text
            variant={TextVariant.BodySm}
            color={TextColor.TextAlternative}
            className="truncate"
          >
            {absSize} {displayName}
          </Text>
        </Box>

        <Box
          flexDirection={BoxFlexDirection.Column}
          alignItems={BoxAlignItems.End}
          className="min-w-[104px] shrink-0"
          gap={1}
        >
          <Text
            variant={TextVariant.BodySm}
            fontWeight={FontWeight.Medium}
            className="truncate tabular-nums"
          >
            {positionValue}
          </Text>
          <Text
            variant={TextVariant.BodySm}
            color={TextColor.TextAlternative}
            className="truncate"
          >
            {t('perpsEntryPrice')} {position.entryPrice}
          </Text>
        </Box>

        <Box
          flexDirection={BoxFlexDirection.Column}
          alignItems={BoxAlignItems.End}
          className="min-w-[116px] shrink-0"
          gap={1}
        >
          <Text
            variant={TextVariant.BodyXs}
            color={TextColor.TextAlternative}
            className="truncate"
          >
            {t('perpsPnl')}
          </Text>
          <Text
            variant={TextVariant.BodySm}
            fontWeight={FontWeight.Medium}
            color={isProfit ? TextColor.SuccessDefault : TextColor.ErrorDefault}
            className="truncate tabular-nums"
            data-testid={`perps-expanded-position-pnl-${position.symbol}`}
          >
            {formattedPnlWithRoe}
          </Text>
        </Box>

        <Box
          flexDirection={BoxFlexDirection.Column}
          alignItems={BoxAlignItems.Center}
          className="min-w-[136px] shrink-0"
          gap={1}
        >
          <Text
            variant={TextVariant.BodyXs}
            color={TextColor.TextAlternative}
            className="truncate"
          >
            {t('perpsAutoClose')}
          </Text>
          <Box
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Center}
            justifyContent={BoxJustifyContent.Center}
            gap={1}
          >
            <Text
              variant={TextVariant.BodySm}
              fontWeight={FontWeight.Medium}
              className="truncate"
              data-testid={`perps-expanded-position-tpsl-value-${position.symbol}`}
            >
              TP {takeProfitPrice}, SL {stopLossPrice}
            </Text>
            <button
              type="button"
              className="rounded bg-transparent p-0 leading-none hover:text-default focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
              disabled={!onOpenTPSL}
              onClick={() => onOpenTPSL?.(position)}
              aria-label={t('perpsAutoClose')}
              data-testid={`perps-expanded-position-tpsl-edit-${position.symbol}`}
            >
              <Icon
                name={IconName.Edit}
                size={IconSize.Xs}
                color={IconColor.IconAlternative}
              />
            </button>
          </Box>
        </Box>

        <Box
          flexDirection={BoxFlexDirection.Column}
          alignItems={BoxAlignItems.End}
          className="min-w-[96px] shrink-0"
          gap={1}
        >
          <Text
            variant={TextVariant.BodyXs}
            color={TextColor.TextAlternative}
            className="truncate"
          >
            {t('perpsMargin')}
          </Text>
          <Box
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Center}
            justifyContent={BoxJustifyContent.End}
            gap={1}
          >
            <Text
              variant={TextVariant.BodySm}
              fontWeight={FontWeight.Medium}
              className="truncate tabular-nums"
              data-testid={`perps-expanded-position-margin-value-${position.symbol}`}
            >
              {marginValue}
            </Text>
            <button
              type="button"
              className="rounded bg-transparent p-0 leading-none hover:text-default focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
              disabled={!onAddMargin}
              onClick={() => onAddMargin?.(position)}
              aria-label={t('perpsAddMargin')}
              data-testid={`perps-expanded-position-margin-edit-${position.symbol}`}
            >
              <Icon
                name={IconName.Edit}
                size={IconSize.Xs}
                color={IconColor.IconAlternative}
              />
            </button>
          </Box>
        </Box>

        <Box
          flexDirection={BoxFlexDirection.Column}
          justifyContent={BoxJustifyContent.Center}
          alignItems={BoxAlignItems.End}
          gap={1}
          className="min-w-[148px] shrink-0"
        >
          <Text
            variant={TextVariant.BodyXs}
            color={TextColor.TextAlternative}
            className="truncate"
          >
            Actions
          </Text>
          <Box
            flexDirection={BoxFlexDirection.Row}
            justifyContent={BoxJustifyContent.End}
            alignItems={BoxAlignItems.Center}
            gap={2}
          >
            <Text
              asChild
              variant={TextVariant.BodyXs}
              color={TextColor.TextDefault}
            >
              <button
                type="button"
                className="rounded px-1 text-right hover:text-default focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                disabled={!onReverse}
                onClick={() => onReverse?.(position)}
                data-testid={`perps-expanded-position-reverse-${position.symbol}`}
              >
                {t('perpsReversePosition')}
              </button>
            </Text>
            <Text
              asChild
              variant={TextVariant.BodyXs}
              color={TextColor.TextDefault}
            >
              <button
                type="button"
                className="rounded px-1 text-right hover:text-default focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                disabled={!onClose}
                onClick={() => onClose?.(position)}
                data-testid={`perps-expanded-position-close-${position.symbol}`}
              >
                {isLong ? t('perpsCloseLong') : t('perpsCloseShort')}
              </button>
            </Text>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <ButtonBase
      className={twMerge(
        // Reset ButtonBase defaults for card layout
        'justify-start rounded-none min-w-0',
        // Card styles (matches tokens tab: 62px height, 8px v-padding, 16px h-padding, 16px gap)
        'gap-4 text-left cursor-pointer',
        'bg-default pt-2 pb-2 px-4 h-[62px]',
        'hover:bg-hover active:bg-pressed',
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
          <Text fontWeight={FontWeight.Medium}>{displayName}</Text>
          <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
            {position.leverage.value}x {direction}
          </Text>
        </Box>
        <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
          {absSize} {displayName}
        </Text>
      </Box>

      {/* Right side: Position value and P&L */}
      <Box
        className="shrink-0"
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.End}
        gap={1}
      >
        <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium}>
          {formatPerpsFiatMinimal(parseFloat(position.positionValue))}
        </Text>
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Baseline}
          gap={1}
        >
          <Text
            variant={TextVariant.BodySm}
            color={isProfit ? TextColor.SuccessDefault : TextColor.ErrorDefault}
          >
            {formattedPnl}
          </Text>
          {formattedRoe !== null && (
            <Text
              variant={TextVariant.BodySm}
              color={
                isProfit ? TextColor.SuccessDefault : TextColor.ErrorDefault
              }
              data-testid={`position-card-roe-${position.symbol}`}
            >
              ({formattedRoe})
            </Text>
          )}
        </Box>
      </Box>
    </ButtonBase>
  );
};

export default PositionCard;
