import React, { useMemo, useState } from 'react';
import {
  Box,
  BoxFlexDirection,
  FontWeight,
  Text,
  TextColor,
  TextVariant,
  twMerge,
} from '@metamask/design-system-react';
import { Skeleton } from '../../../component-library/skeleton';
import { TabEmptyState } from '../../../ui/tab-empty-state';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { OrderCard } from '../order-card';
import { PositionCard } from '../position-card';
import type { Order, Position } from '../types';
import { filterExpandedOpenOrders } from './utils';

const BOTTOM_PANEL_HEIGHT = 'clamp(160px, 32vh, 280px)';

export type PerpsExpandedBottomTab = 'positions' | 'orders';

export type PerpsMarketExpandedBottomPanelProps = {
  positions: Position[];
  orders: Order[];
  isPositionsLoading?: boolean;
  isOrdersLoading?: boolean;
  onPositionTPSL: (position: Position) => void;
  onPositionAddMargin: (position: Position) => void;
  onPositionReverse: (position: Position) => void;
  onPositionClose: (position: Position) => void;
  onOrderClick: (order: Order) => void;
};

const BottomPanelEmptyState: React.FC = () => {
  const t = useI18nContext();

  return (
    <TabEmptyState
      description={t('perpsEmptyDescription')}
      data-testid="perps-expanded-bottom-empty-state"
      className="mx-auto my-6 max-w-64"
    />
  );
};

const RowSkeletons: React.FC = () => (
  <Box
    flexDirection={BoxFlexDirection.Column}
    data-testid="perps-expanded-bottom-skeleton"
  >
    {Array.from({ length: 3 }).map((_, index) => (
      <Box
        key={index}
        className="flex min-h-[72px] items-center gap-4 border-b border-border-muted px-4 py-2"
      >
        <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
        <Box flexDirection={BoxFlexDirection.Column} gap={1} className="flex-1">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-20" />
        </Box>
        <Skeleton className="h-9 w-28 shrink-0" />
        <Skeleton className="h-9 w-28 shrink-0" />
        <Skeleton className="h-9 w-36 shrink-0" />
        <Skeleton className="h-9 w-24 shrink-0" />
        <Skeleton className="h-9 w-20 shrink-0" />
      </Box>
    ))}
  </Box>
);

export const PerpsMarketExpandedBottomPanel: React.FC<
  PerpsMarketExpandedBottomPanelProps
> = ({
  positions,
  orders,
  isPositionsLoading = false,
  isOrdersLoading = false,
  onPositionTPSL,
  onPositionAddMargin,
  onPositionReverse,
  onPositionClose,
  onOrderClick,
}) => {
  const t = useI18nContext();
  const [activeTab, setActiveTab] =
    useState<PerpsExpandedBottomTab>('positions');
  const openOrders = useMemo(() => filterExpandedOpenOrders(orders), [orders]);

  const renderTabButton = (tab: PerpsExpandedBottomTab, label: string) => (
    <Text
      asChild
      variant={TextVariant.BodyMd}
      fontWeight={FontWeight.Medium}
      color={
        activeTab === tab ? TextColor.TextDefault : TextColor.TextAlternative
      }
      className={twMerge(
        'rounded-md px-0 py-1 hover:enabled:text-default',
        activeTab === tab && 'text-default',
      )}
    >
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === tab}
        tabIndex={activeTab === tab ? 0 : -1}
        onClick={() => setActiveTab(tab)}
      >
        {label}
      </button>
    </Text>
  );

  const renderPositions = () => {
    if (isPositionsLoading) {
      return <RowSkeletons />;
    }

    if (positions.length === 0) {
      return <BottomPanelEmptyState />;
    }

    return (
      <Box flexDirection={BoxFlexDirection.Column}>
        {positions.map((position) => (
          <PositionCard
            key={position.symbol}
            position={position}
            variant="expanded"
            onOpenTPSL={onPositionTPSL}
            onAddMargin={onPositionAddMargin}
            onReverse={onPositionReverse}
            onClose={onPositionClose}
          />
        ))}
      </Box>
    );
  };

  const renderOrders = () => {
    if (isOrdersLoading) {
      return <RowSkeletons />;
    }

    if (openOrders.length === 0) {
      return <BottomPanelEmptyState />;
    }

    return (
      <Box flexDirection={BoxFlexDirection.Column}>
        {openOrders.map((order) => (
          <OrderCard
            key={order.orderId}
            order={order}
            onClick={onOrderClick}
            variant="muted"
          />
        ))}
      </Box>
    );
  };

  const content =
    activeTab === 'positions' ? renderPositions() : renderOrders();

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      className="shrink-0 overflow-hidden border-t border-border-muted"
      style={{
        flexBasis: BOTTOM_PANEL_HEIGHT,
        height: BOTTOM_PANEL_HEIGHT,
        maxHeight: BOTTOM_PANEL_HEIGHT,
      }}
      data-testid="perps-expanded-bottom-panel"
    >
      <Box
        role="tablist"
        flexDirection={BoxFlexDirection.Row}
        className="shrink-0 gap-6 px-4 py-2"
      >
        {renderTabButton('positions', t('perpsPositions'))}
        {renderTabButton('orders', t('perpsOpenOrders'))}
      </Box>
      <Box
        role="tabpanel"
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
        data-testid="perps-expanded-bottom-tabpanel"
      >
        {content}
      </Box>
    </Box>
  );
};
