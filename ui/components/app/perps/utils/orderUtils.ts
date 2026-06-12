import BigNumber from 'bignumber.js';
import { capitalize } from 'lodash';
import type { Order, OrderParams, Position } from '@metamask/perps-controller';

const FULL_POSITION_SIZE_TOLERANCE = new BigNumber('0.00000001');
const ORDER_PRICE_MATCH_TOLERANCE = new BigNumber('0.00000001');
const SYNTHETIC_TP_ID_SUFFIX = '-synthetic-tp';
const SYNTHETIC_SL_ID_SUFFIX = '-synthetic-sl';

/**
 * Safely creates a BigNumber, returning null for empty/invalid values.
 * bignumber.js v4.x throws on empty strings and non-numeric values.
 *
 * @param value - The string value to parse
 * @returns BigNumber or null
 */
const safeBigNumber = (value: string | undefined | null): BigNumber | null => {
  if (!value || value.trim() === '') {
    return null;
  }
  try {
    const bn = new BigNumber(value);
    return bn.isFinite() ? bn : null;
  } catch {
    return null;
  }
};

const getAbsoluteOrderSize = (order: Order): BigNumber | null => {
  const size = order.originalSize || order.size;
  const parsedSize = safeBigNumber(size);
  if (!parsedSize || parsedSize.lte(0)) {
    return null;
  }
  return parsedSize.abs();
};

const getAbsolutePositionSize = (position?: Position): BigNumber | null => {
  const parsedSize = safeBigNumber(position?.size);
  if (!parsedSize || parsedSize.isZero()) {
    return null;
  }
  return parsedSize.abs();
};

const getOrderTriggerPrice = (order: Order): BigNumber | null => {
  const rawPrice = order.triggerPrice || order.price;
  const parsedPrice = safeBigNumber(rawPrice);
  if (!parsedPrice || parsedPrice.lte(0)) {
    return null;
  }
  return parsedPrice;
};

const isClosingSideForPosition = (
  order: Order,
  position: Position,
): boolean => {
  const positionSize = safeBigNumber(position.size) ?? new BigNumber(0);
  if (!positionSize.isFinite() || positionSize.isZero()) {
    return false;
  }
  return positionSize.gt(0) ? order.side === 'sell' : order.side === 'buy';
};

const hasMatchingRealReduceOnlyTrigger = (
  orders: Order[],
  syntheticOrder: Order,
): boolean => {
  if (!syntheticOrder.parentOrderId) {
    return false;
  }

  const parentOrder = orders.find(
    (order) => order.orderId === syntheticOrder.parentOrderId,
  );

  return orders.some((order) => {
    if (order.isSynthetic) {
      return false;
    }

    const isSameParentByChildLink = Boolean(
      order.parentOrderId &&
      order.parentOrderId === syntheticOrder.parentOrderId,
    );
    const isSameParentByParentReference = Boolean(
      parentOrder &&
      (parentOrder.takeProfitOrderId === order.orderId ||
        parentOrder.stopLossOrderId === order.orderId),
    );

    if (!isSameParentByChildLink && !isSameParentByParentReference) {
      return false;
    }

    if (
      order.symbol !== syntheticOrder.symbol ||
      order.side !== syntheticOrder.side ||
      order.reduceOnly !== true ||
      order.isTrigger !== true
    ) {
      return false;
    }

    const existingOrderPrice = getOrderTriggerPrice(order);
    const syntheticOrderPrice = getOrderTriggerPrice(syntheticOrder);

    if (!existingOrderPrice || !syntheticOrderPrice) {
      return false;
    }

    return existingOrderPrice
      .minus(syntheticOrderPrice)
      .abs()
      .lte(ORDER_PRICE_MATCH_TOLERANCE);
  });
};

/**
 * Determines whether an order is associated with the full active position.
 *
 * Position association logic:
 * 1. Order must be reduce-only.
 * 2. Order and position must match symbol and closing side semantics.
 * 3. Prefer native isPositionTpsl flag when available.
 * 4. Fallback to full-size matching with decimal tolerance.
 *
 * @param order - The order to check
 * @param position - The current position (if any)
 * @returns Whether the order is associated with the full position
 */
export const isOrderAssociatedWithFullPosition = (
  order: Order,
  position?: Position,
): boolean => {
  if (!order.reduceOnly) {
    return false;
  }

  if (order.isPositionTpsl === true) {
    return true;
  }

  if (!position) {
    return false;
  }

  if (
    order.symbol !== position.symbol ||
    !isClosingSideForPosition(order, position)
  ) {
    return false;
  }

  // Only fall back to size matching when the provider did not send the flag.
  // An explicit `isPositionTpsl: false` (e.g. normalTpsl grouping from a
  // limit-order's TP/SL children) is authoritative — do not size-match,
  // otherwise a limit-order TP/SL whose size coincidentally equals the
  // current position would be misclassified as full-position.
  if (order.isPositionTpsl === false) {
    return false;
  }

  const orderSize = getAbsoluteOrderSize(order);
  const positionSize = getAbsolutePositionSize(position);

  // Hyperliquid positionTPSL trigger orders may also be placed with size 0
  // (the trigger acts on whatever the current position size is). When the
  // adapter cannot back-fill the size, treat a reduce-only trigger on a
  // matching position+closing-side as position-bound.
  if (!orderSize) {
    return order.isTrigger === true;
  }

  if (!positionSize) {
    return false;
  }

  return orderSize.minus(positionSize).abs().lte(FULL_POSITION_SIZE_TOLERANCE);
};

/**
 * Returns true when a non-reduce-only market order is large enough to flip the
 * current position (close the existing side and open the opposite side).
 * Mirrors `app/components/UI/Perps/utils/orderUtils.ts:willFlipPosition` on
 * mobile so the order-entry page can replicate the two-step market+TPSL
 * flow that yields `grouping: 'positionTpsl'` on Hyperliquid.
 *
 * @param currentPosition - The existing position
 * @param orderParams - The order about to be submitted
 * @returns Whether the order will flip the position
 */
export const willFlipPosition = (
  currentPosition: Position,
  orderParams: OrderParams,
): boolean => {
  if (orderParams.reduceOnly === true) {
    return false;
  }
  if (orderParams.orderType !== 'market') {
    return false;
  }
  // Hyperliquid position/order size strings can carry thousand separators
  // (e.g. `'1,234.5'`); strip commas before parseFloat so the magnitude
  // comparison stays correct for large positions.
  const currentPositionSize = parseFloat(
    currentPosition.size.replaceAll(',', ''),
  );
  // A zero-size position is not a position — short-circuit so a sell market
  // does not match the phantom `'short'` direction below and falsely report
  // "no flip". The caller also guards on size === 0, but keep this safe in
  // isolation.
  if (currentPositionSize === 0 || !Number.isFinite(currentPositionSize)) {
    return false;
  }
  const positionDirection = currentPositionSize > 0 ? 'long' : 'short';
  const orderDirection = orderParams.isBuy ? 'long' : 'short';
  if (positionDirection === orderDirection) {
    return false;
  }
  const orderSize = parseFloat(orderParams.size.replaceAll(',', ''));
  return orderSize > Math.abs(currentPositionSize);
};

/**
 * Derives the take-profit and stop-loss prices for the active position by
 * inspecting full-position reduce-only trigger orders. Used as a UI fallback
 * when the controller fails to populate `position.takeProfitPrice` /
 * `position.stopLossPrice` (e.g. Hyperliquid WebSocket order updates that
 * omit `isPositionTpsl`).
 *
 * @param orders - The orders to inspect
 * @param position - The current position
 * @returns Object with takeProfitPrice / stopLossPrice when discoverable
 */
export const derivePositionTpslPricesFromOrders = (
  orders: Order[],
  position?: Position,
): { takeProfitPrice?: string; stopLossPrice?: string } => {
  if (!position) {
    return {};
  }

  const result: { takeProfitPrice?: string; stopLossPrice?: string } = {};
  for (const order of orders) {
    if (
      !order.isTrigger ||
      !isOrderAssociatedWithFullPosition(order, position)
    ) {
      continue;
    }

    const triggerPrice = getOrderTriggerPrice(order)?.toFixed();
    if (!triggerPrice) {
      continue;
    }

    const detailedType = (order.detailedOrderType ?? '').toLowerCase();
    if (!result.takeProfitPrice && detailedType.includes('take profit')) {
      result.takeProfitPrice = triggerPrice;
    } else if (!result.stopLossPrice && detailedType.includes('stop')) {
      result.stopLossPrice = triggerPrice;
    }
  }
  return result;
};

/**
 * Determines whether an order should be shown in Market Details > Orders
 * (the perps asset / position detail screen).
 *
 * All non-reduce-only orders are shown. Reduce-only orders are shown only when
 * they are NOT full-position TP/SL — those are surfaced in the auto-close
 * section instead, so keeping them out of the orders list avoids duplicate
 * entries.
 *
 * @param order - The order to check
 * @param position - The current position (if any)
 * @returns Whether the order should be displayed
 */
export const shouldDisplayOrderInMarketDetailsOrders = (
  order: Order,
  position?: Position,
): boolean => {
  if (!order.reduceOnly) {
    return true;
  }
  return !isOrderAssociatedWithFullPosition(order, position);
};

const buildSyntheticTriggerOrder = (
  parentOrder: Order,
  triggerType: 'tp' | 'sl',
): Order | null => {
  const triggerPrice =
    triggerType === 'tp'
      ? parentOrder.takeProfitPrice
      : parentOrder.stopLossPrice;
  const parsedTriggerPrice = safeBigNumber(triggerPrice);
  if (!parsedTriggerPrice || parsedTriggerPrice.lte(0)) {
    return null;
  }
  const normalizedTriggerPrice = parsedTriggerPrice.toFixed();

  const syntheticSide = parentOrder.side === 'buy' ? 'sell' : 'buy';
  const isMarketParent =
    parentOrder.orderType === 'market' ||
    (parentOrder.detailedOrderType || '').toLowerCase().includes('market');
  const syntheticOrderType = isMarketParent ? 'market' : 'limit';
  const executionStyle = isMarketParent ? 'Market' : 'Limit';
  const syntheticDetailedType =
    triggerType === 'tp'
      ? `Take Profit ${executionStyle}`
      : `Stop ${executionStyle}`;
  const size = parentOrder.originalSize || parentOrder.size;
  if (!size) {
    return null;
  }
  const existingChildOrderId =
    triggerType === 'tp'
      ? parentOrder.takeProfitOrderId
      : parentOrder.stopLossOrderId;
  const syntheticOrderIdSuffix =
    triggerType === 'tp' ? SYNTHETIC_TP_ID_SUFFIX : SYNTHETIC_SL_ID_SUFFIX;
  const syntheticOrderId =
    existingChildOrderId && existingChildOrderId.trim().length > 0
      ? existingChildOrderId
      : `${parentOrder.orderId}${syntheticOrderIdSuffix}`;

  return {
    orderId: syntheticOrderId,
    parentOrderId: parentOrder.orderId,
    isSynthetic: true,
    isPositionTpsl: false,
    symbol: parentOrder.symbol,
    side: syntheticSide,
    orderType: syntheticOrderType,
    size,
    originalSize: size,
    price: normalizedTriggerPrice,
    filledSize: '0',
    remainingSize: size,
    status: 'open',
    timestamp: parentOrder.timestamp,
    detailedOrderType: syntheticDetailedType,
    isTrigger: true,
    reduceOnly: true,
    triggerPrice: normalizedTriggerPrice,
    providerId: parentOrder.providerId,
  };
};

/**
 * Builds display orders with synthetic TP/SL rows for untriggered parent orders.
 *
 * Synthetic rows are display-only and are not created when a real reduce-only
 * trigger already exists with matching symbol, side, and trigger price.
 *
 * @param orders - The orders to enrich with synthetic rows
 * @returns Orders array with synthetic TP/SL rows added
 */
export const buildDisplayOrdersWithSyntheticTpsl = (
  orders: Order[],
): Order[] => {
  if (!orders.length) {
    return orders;
  }

  const displayOrders: Order[] = [];
  const realOrderIds = new Set(orders.map((order) => order.orderId));

  orders.forEach((order) => {
    displayOrders.push(order);

    if (order.isTrigger) {
      return;
    }

    const syntheticTpOrder = buildSyntheticTriggerOrder(order, 'tp');
    if (
      syntheticTpOrder &&
      !hasMatchingRealReduceOnlyTrigger(orders, syntheticTpOrder) &&
      !realOrderIds.has(syntheticTpOrder.orderId) &&
      !displayOrders.some(
        (displayOrder) => displayOrder.orderId === syntheticTpOrder.orderId,
      )
    ) {
      displayOrders.push(syntheticTpOrder);
    }

    const syntheticSlOrder = buildSyntheticTriggerOrder(order, 'sl');
    if (
      syntheticSlOrder &&
      !hasMatchingRealReduceOnlyTrigger(orders, syntheticSlOrder) &&
      !realOrderIds.has(syntheticSlOrder.orderId) &&
      !displayOrders.some(
        (displayOrder) => displayOrder.orderId === syntheticSlOrder.orderId,
      )
    ) {
      displayOrders.push(syntheticSlOrder);
    }
  });

  return displayOrders;
};

/**
 * Normalizes orders for the Perps Market Details > Orders section.
 *
 * Composes display-order enrichment (synthetic TP/SL rows) with visibility
 * filtering: reduce-only orders associated with the full position are excluded
 * because they are surfaced in the auto-close section instead.
 *
 * @param options0 - Options object
 * @param options0.orders - The orders to normalize
 * @param options0.existingPosition - The current position (if any), used to
 * detect full-position reduce-only orders that should be excluded.
 * @returns Normalized orders for display
 */
export const normalizeMarketDetailsOrders = ({
  orders,
  existingPosition,
}: {
  orders: Order[];
  existingPosition?: Position;
}): Order[] => {
  const ordersWithSyntheticTpsl = buildDisplayOrdersWithSyntheticTpsl(orders);

  return ordersWithSyntheticTpsl.filter((order) =>
    shouldDisplayOrderInMarketDetailsOrders(order, existingPosition),
  );
};

/**
 * Formats an order label following the pattern: [Type] [close?] [direction]
 * Matches the mobile canonical formatter in app/components/UI/Perps/utils/orderUtils.ts.
 *
 * Examples:
 * - "Market long" / "Limit short"
 * - "Limit close long" / "Market close short"
 * - "Stop market close long" / "Take profit limit close short"
 *
 * Rules:
 * - isClosing = reduceOnly || isTrigger
 * - direction for closing: sell → long, buy → short
 * - direction for opening: buy → long, sell → short
 * - typeString = detailedOrderType if present, otherwise "Limit" or "Market"
 * - lodash capitalize: uppercases first char, lowercases the rest
 *
 * @param order - The order to label
 * @returns Formatted label string in sentence case
 */
export const formatOrderLabel = (order: Order): string => {
  const { side, detailedOrderType, orderType, reduceOnly, isTrigger } = order;
  const isClosing = Boolean(reduceOnly || isTrigger);

  let direction: string;
  if (isClosing) {
    direction = side === 'sell' ? 'long' : 'short';
  } else {
    direction = side === 'buy' ? 'long' : 'short';
  }

  const typeString =
    detailedOrderType || (orderType === 'limit' ? 'Limit' : 'Market');

  return isClosing
    ? capitalize(`${typeString} close ${direction}`)
    : capitalize(`${typeString} ${direction}`);
};
