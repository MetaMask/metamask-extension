import BigNumber from 'bignumber.js';
import type { Order, Position } from '@metamask/perps-controller';

const TPSL_DETAILED_ORDER_TYPES = new Set([
  'Stop Limit',
  'Stop Market',
  'Take Profit Limit',
  'Take Profit Market',
]);

const isTPSLOrder = (detailedOrderType?: string): boolean => {
  if (!detailedOrderType) {
    return false;
  }
  return TPSL_DETAILED_ORDER_TYPES.has(detailedOrderType);
};

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

/**
 * Parses the trigger price from an order, returning null when absent or invalid.
 *
 * @param order - The order to extract trigger price from
 * @returns The trigger price or null
 */
export const getValidTriggerPrice = (order: Order): number | null => {
  const parsed = Number.parseFloat(order.triggerPrice ?? '');
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

/**
 * Parses the execution/limit price from an order, returning null when absent or invalid.
 *
 * @param order - The order to extract price from
 * @returns The order price or null
 */
export const getValidOrderPrice = (order: Order): number | null => {
  const parsed = Number.parseFloat(order.price ?? '');
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
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
 * Determines whether an order should be shown in Market Details > Orders.
 *
 * - All non-reduce-only orders are shown.
 * - Reduce-only orders are shown only when they are NOT full-position TP/SL.
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
 * filtering (hides full-position TP/SL, keeps everything else).
 *
 * @param options0 - Options object
 * @param options0.orders - The orders to normalize
 * @param options0.existingPosition - The current position (if any)
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
 * Resolves the display price and label key for an order.
 *
 * Returns the appropriate price (trigger or limit) and a translation key
 * indicating the price type for display in compact order rows.
 *
 * @param order - The order to resolve display info for
 * @returns Object with priceValue and labelKey
 */
export const resolveOrderDisplayPriceAndLabel = (
  order: Order,
): { priceValue: number | null; labelKey: string } => {
  const detailedOrderType = order.detailedOrderType ?? '';
  const normalizedDetailedOrderType = detailedOrderType.toLowerCase();
  const isTriggerOrder = Boolean(
    order.isTrigger || isTPSLOrder(order.detailedOrderType),
  );
  const isLimitOrder = Boolean(
    order.orderType === 'limit' ||
      normalizedDetailedOrderType.includes('limit'),
  );
  const validTriggerPrice = getValidTriggerPrice(order);
  const validOrderPrice = getValidOrderPrice(order);

  if (isTriggerOrder && validTriggerPrice !== null) {
    return { priceValue: validTriggerPrice, labelKey: 'perpsTriggerPrice' };
  }

  if (isLimitOrder && validOrderPrice !== null) {
    return { priceValue: validOrderPrice, labelKey: 'perpsLimitPrice' };
  }

  return { priceValue: validOrderPrice, labelKey: 'perpsMarket' };
};

/**
 * Format an order label following the pattern: [Type] [Close?] [Direction]
 *
 * Examples: "Limit long", "Market close short", "Stop Market close long"
 *
 * @param order - The order to format
 * @returns Formatted order label string
 */
export const formatOrderLabel = (order: Order): string => {
  const { side, detailedOrderType, orderType, reduceOnly } = order;
  const isClosing = Boolean(reduceOnly);

  let direction: string;
  if (isClosing) {
    direction = side === 'sell' ? 'long' : 'short';
  } else {
    direction = side === 'buy' ? 'long' : 'short';
  }

  const typeString =
    detailedOrderType || (orderType === 'limit' ? 'Limit' : 'Market');

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  if (isClosing) {
    return capitalize(`${typeString} close ${direction}`);
  }
  return capitalize(`${typeString} ${direction}`);
};
