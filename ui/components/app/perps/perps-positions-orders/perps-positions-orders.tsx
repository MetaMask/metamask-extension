import React from 'react';
import {
  Box,
  BoxFlexDirection,
  BoxJustifyContent,
  BoxAlignItems,
  SensitiveText,
  Text,
  TextVariant,
  TextColor,
  FontWeight,
  ButtonBase,
  ButtonBaseSize,
} from '@metamask/design-system-react';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useFormatters } from '../../../../hooks/useFormatters';
import { usePerpsAssetNames } from '../../../../hooks/perps/stream';
import { getPreferences } from '../../../../../shared/lib/selectors/preferences';
import {
  formatPerpsFiat,
  PRICE_RANGES_MINIMAL_VIEW,
} from '../../../../../shared/lib/perps-formatters';
import { PositionCard } from '../position-card';
import { OrderCard } from '../order-card';
import { getPrivacyAwareColor } from '../utils';
import type { AccountState, Position, Order } from '../types';

export type PerpsPositionsOrdersProps = {
  positions: Position[];
  orders: Order[];
  /**
   * Account snapshot used to render the aggregate unrealized P&L row under
   * the "Your positions" header (mobile parity). When omitted, the P&L row
   * is not rendered.
   */
  account?: AccountState | null;
  onCloseAllPositions?: () => void;
  onCancelAllOrders?: () => void;
  isCloseAllPending?: boolean;
  isCancelAllPending?: boolean;
};

export const PerpsPositionsOrders = ({
  positions,
  orders,
  account,
  onCloseAllPositions,
  onCancelAllOrders,
  isCloseAllPending = false,
  isCancelAllPending = false,
}: PerpsPositionsOrdersProps) => {
  const t = useI18nContext();
  const { resolveAssetName } = usePerpsAssetNames();
  const { formatPercentWithMinThreshold } = useFormatters();
  const { privacyMode } = useSelector(getPreferences);
  const hasPositions = positions.length > 0;
  const hasOrders = orders.length > 0;

  if (!hasPositions && !hasOrders) {
    return null;
  }

  // Aggregate P&L rendered under "Your positions" (mirrors mobile).
  // - Amount comes from the account snapshot so it stays consistent with the
  //   HL accountValue used elsewhere (positions sum can drift when orders
  //   are mid-fill).
  // - RoE mirrors the single position's card RoE when there is exactly one
  //   position (so the header and the card agree); for zero/multi we fall
  //   back to the account aggregate. account.returnOnEquity is a percent
  //   (e.g. "42" for 42%), position.returnOnEquity is a decimal fraction.
  const unrealizedPnl = account?.unrealizedPnl ?? '0';
  const pnlNum = Number.parseFloat(unrealizedPnl);
  const isProfit = pnlNum >= 0;
  const pnlPrefix = isProfit ? '+' : '-';
  const pnlColor = getPrivacyAwareColor(
    isProfit ? TextColor.SuccessDefault : TextColor.ErrorDefault,
    privacyMode,
  );
  const formattedPnl = `${pnlPrefix}${formatPerpsFiat(Math.abs(pnlNum), {
    ranges: PRICE_RANGES_MINIMAL_VIEW,
  })}`;
  const singlePositionReturnOnEquity =
    positions.length === 1 ? positions[0]?.returnOnEquity : undefined;
  const accountReturnOnEquity = account?.returnOnEquity ?? '0';
  const formattedRoe =
    singlePositionReturnOnEquity === undefined
      ? formatPercentWithMinThreshold(
          Number.parseFloat(accountReturnOnEquity) / 100,
        )
      : formatPercentWithMinThreshold(
          Number.parseFloat(singlePositionReturnOnEquity),
        );
  const showPnlRow = hasPositions && account !== undefined && account !== null;

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      gap={2}
      data-testid="perps-positions-orders-section"
    >
      {hasPositions && (
        <Box
          flexDirection={BoxFlexDirection.Column}
          gap={2}
          data-testid="perps-positions-section"
        >
          <Box
            flexDirection={BoxFlexDirection.Column}
            paddingLeft={4}
            paddingRight={4}
            paddingTop={4}
            marginBottom={2}
          >
            <Box
              flexDirection={BoxFlexDirection.Row}
              justifyContent={BoxJustifyContent.Between}
              alignItems={BoxAlignItems.Center}
            >
              <Text fontWeight={FontWeight.Medium}>{t('perpsPositions')}</Text>
              <ButtonBase
                size={ButtonBaseSize.Sm}
                disabled={isCloseAllPending || !onCloseAllPositions}
                onClick={onCloseAllPositions}
                data-testid="perps-close-all-positions"
                className="min-w-0 rounded-md border-0 bg-transparent px-1 py-0.5 -mr-1 shadow-none hover:bg-transparent active:bg-transparent focus-visible:bg-transparent disabled:opacity-50"
                textProps={{
                  variant: TextVariant.BodySm,
                  color: TextColor.TextAlternative,
                }}
              >
                {t('perpsCloseAll')}
              </ButtonBase>
            </Box>
            {showPnlRow && (
              <Box
                flexDirection={BoxFlexDirection.Row}
                alignItems={BoxAlignItems.Baseline}
                gap={2}
                marginTop={1}
                data-testid="perps-positions-pnl"
              >
                <Box
                  flexDirection={BoxFlexDirection.Row}
                  alignItems={BoxAlignItems.Baseline}
                  gap={1}
                >
                  <SensitiveText
                    variant={TextVariant.BodySm}
                    fontWeight={FontWeight.Medium}
                    color={pnlColor}
                    isHidden={privacyMode}
                    data-testid="perps-positions-pnl-value"
                  >
                    {formattedPnl}
                  </SensitiveText>
                  <SensitiveText
                    variant={TextVariant.BodySm}
                    fontWeight={FontWeight.Medium}
                    color={pnlColor}
                    isHidden={privacyMode}
                    data-testid="perps-positions-roe-value"
                  >
                    {`(${formattedRoe})`}
                  </SensitiveText>
                </Box>
                <Text
                  variant={TextVariant.BodySm}
                  color={TextColor.TextAlternative}
                >
                  {t('perpsUnrealizedPnl')}
                </Text>
              </Box>
            )}
          </Box>
          <Box flexDirection={BoxFlexDirection.Column}>
            {positions.map((position) => (
              <PositionCard
                key={position.symbol}
                position={position}
                assetName={resolveAssetName(position.symbol)}
              />
            ))}
          </Box>
        </Box>
      )}

      {hasOrders && (
        <Box
          flexDirection={BoxFlexDirection.Column}
          gap={2}
          data-testid="perps-orders-section"
        >
          <Box
            flexDirection={BoxFlexDirection.Row}
            justifyContent={BoxJustifyContent.Between}
            alignItems={BoxAlignItems.Center}
            paddingLeft={4}
            paddingRight={4}
            paddingTop={hasPositions ? 0 : 4}
            marginBottom={2}
          >
            <Text fontWeight={FontWeight.Medium}>{t('perpsOpenOrders')}</Text>
            {/* TODO: TAT-2852 - Unhide when batch close/cancel is implemented */}
            {/* <ButtonBase
              size={ButtonBaseSize.Sm}
              disabled={isCancelAllPending || !onCancelAllOrders}
              onClick={onCancelAllOrders}
              data-testid="perps-cancel-all-orders"
              className="min-w-0 rounded-md border-0 bg-transparent px-1 py-0.5 -mr-1 shadow-none hover:bg-transparent active:bg-transparent focus-visible:bg-transparent disabled:opacity-50"
              textProps={{
                variant: TextVariant.BodySm,
                color: TextColor.TextAlternative,
              }}
            >
              {t('perpsCancelAllOrders')}
            </ButtonBase> */}
          </Box>
          <Box flexDirection={BoxFlexDirection.Column}>
            {orders.map((order) => (
              <OrderCard
                key={order.orderId}
                order={order}
                assetName={resolveAssetName(order.symbol)}
              />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};
