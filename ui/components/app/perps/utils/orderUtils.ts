import BigNumber from 'bignumber.js';
import { capitalize } from 'lodash';
import type { Order, Position } from '@metamask/perps-controller';

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

  if (order.isPositionTpsl === false) {
    return false;
  }

  const orderSize = getAbsoluteOrderSize(order);
  const positionSize = getAbsolutePositionSize(position);
  if (!orderSize || !positionSize) {
    return false;
  }

  return orderSize.minus(positionSize).abs().lte(FULL_POSITION_SIZE_TOLERANCE);
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
