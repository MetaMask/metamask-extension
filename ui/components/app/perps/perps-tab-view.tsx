import React from 'react';
import { mockPositions, mockOrders } from './mocks';
import { PositionCard } from './position-card';
import { OrderCard } from './order-card';
import { PerpsTabControlBar } from './perps-tab-control-bar';

/**
 * PerpsTabView component displays the perpetuals trading tab
 * with positions and orders sections using mock data
 */
export const PerpsTabView: React.FC = () => {
  const hasPositions = mockPositions.length > 0;
  const hasOrders = mockOrders.length > 0;
  const hasNoPositionsOrOrders = !hasPositions && !hasOrders;

  const handleManageBalancePress = () => {
    // TODO: Navigate to manage balance screen
    console.log('Navigate to manage balance');
  };

  return (
    <div className="perps-tab-view" data-testid="perps-tab-view">
      {/* Control Bar with Balance and P&L */}
      <PerpsTabControlBar
        onManageBalancePress={handleManageBalancePress}
        hasPositions={hasPositions}
      />

      {/* Empty State */}
      {hasNoPositionsOrOrders && (
        <div
          className="perps-tab-view__empty-state"
          data-testid="perps-empty-state"
        >
          <span>No positions or orders</span>
        </div>
      )}

      {/* Positions Section */}
      {hasPositions && (
        <div
          className="perps-tab-view__section"
          data-testid="perps-positions-section"
        >
          <div className="perps-tab-view__section-header">
            <span className="perps-tab-view__section-title">Positions</span>
          </div>
          <div className="perps-tab-view__cards-container">
            {mockPositions.map((position) => (
              <PositionCard key={position.coin} position={position} />
            ))}
          </div>
        </div>
      )}

      {/* Orders Section */}
      {hasOrders && (
        <div
          className="perps-tab-view__section"
          data-testid="perps-orders-section"
        >
          <div className="perps-tab-view__section-header">
            <span className="perps-tab-view__section-title">Open Orders</span>
          </div>
          <div className="perps-tab-view__cards-container">
            {mockOrders.map((order) => (
              <OrderCard key={order.orderId} order={order} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PerpsTabView;
