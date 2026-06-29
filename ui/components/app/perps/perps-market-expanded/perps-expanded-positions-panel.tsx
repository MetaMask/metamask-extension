import React, { useMemo } from 'react';
import {
  Box,
  BoxFlexDirection,
  Text,
  TextVariant,
  TextColor,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  usePerpsLiveOrders,
  usePerpsLivePositions,
} from '../../../../hooks/perps/stream';
import { PerpsPositionsOrders } from '../perps-positions-orders';

export type PerpsExpandedPositionsPanelProps = {
  /** When set, only this market's positions/orders are shown. */
  symbol?: string;
};

/**
 * Bottom panel listing the account's open positions and orders.
 *
 * Owns the positions and orders subscriptions locally so a positions/orders
 * tick re-renders only this panel, not the chart, order book, or trade ticket.
 */
export const PerpsExpandedPositionsPanel = React.memo(
  ({ symbol }: PerpsExpandedPositionsPanelProps) => {
    const t = useI18nContext();
    const { positions } = usePerpsLivePositions();
    const { orders } = usePerpsLiveOrders();

    const filteredPositions = useMemo(() => {
      if (!symbol) {
        return positions;
      }
      const target = symbol.toLowerCase();
      return positions.filter((p) => p.symbol.toLowerCase() === target);
    }, [positions, symbol]);

    const filteredOrders = useMemo(() => {
      if (!symbol) {
        return orders;
      }
      const target = symbol.toLowerCase();
      return orders.filter((o) => o.symbol.toLowerCase() === target);
    }, [orders, symbol]);

    const isEmpty =
      filteredPositions.length === 0 && filteredOrders.length === 0;

    return (
      <Box
        flexDirection={BoxFlexDirection.Column}
        className="shrink-0 overflow-y-auto border-t border-muted"
        data-testid="perps-expanded-positions-panel"
      >
        {isEmpty ? (
          <Box
            paddingLeft={4}
            paddingRight={4}
            paddingTop={4}
            paddingBottom={4}
          >
            <Text
              variant={TextVariant.BodySm}
              color={TextColor.TextAlternative}
            >
              {t('perpsNoOpenPositions')}
            </Text>
          </Box>
        ) : (
          <PerpsPositionsOrders
            positions={filteredPositions}
            orders={filteredOrders}
          />
        )}
      </Box>
    );
  },
);

PerpsExpandedPositionsPanel.displayName = 'PerpsExpandedPositionsPanel';
