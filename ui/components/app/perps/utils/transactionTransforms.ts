/**
 * Perps Transaction Transform Utilities
 *
 * Transform functions to convert raw API data (OrderFill, Order, Funding, UserHistoryItem)
 * into the unified PerpsTransaction format for display in the Activity page.
 *
 * Adapted from mobile: app/components/UI/Perps/utils/transactionTransforms.ts
 */

import { BigNumber } from 'bignumber.js';
import {
  FillType,
  PerpsOrderTransactionStatus,
  PerpsOrderTransactionStatusType,
  type PerpsTransaction,
} from '../types/transactionHistory';
import { getDisplaySymbol } from '../utils';
import type {
  Funding,
  Order,
  OrderFill,
  UserHistoryItem,
} from '@metamask/perps-controller';

/**
 * Determines the close direction category for aggregation purposes.
 * Returns a normalized direction string for grouping fills that should be aggregated together.
 *
 * @param direction - The fill direction string (e.g., "Close Long", "Close Short", "Sell")
 * @returns A normalized close direction for grouping, or null if not a close fill
 */
function getCloseDirectionForAggregation(
  direction: string | undefined,
): string | null {
  if (!direction) {
    return null;
  }

  const [part1, part2] = direction.split(' ');

  // Handle standard close directions
  if (part1 === 'Close') {
    return `Close ${part2}`; // "Close Long" or "Close Short"
  }

  // Handle spot-perps and prelaunch markets that use "Sell" for closing
  if (direction === 'Sell') {
    return 'Sell';
  }

  // Handle auto-deleveraging as a closeable position
  if (direction === 'Auto-Deleveraging') {
    return 'Auto-Deleveraging';
  }

  // Not a close fill - don't aggregate
  return null;
}

/**
 * Aggregates fills that occur at the same timestamp for the same asset when closing positions.
 * This handles cases where a stop loss or take profit order is split into multiple fills
 * by HyperLiquid, ensuring users see the aggregate PnL instead of partial amounts.
 *
 * Aggregation criteria:
 * - Same asset symbol
 * - Same timestamp (truncated to the same second)
 * - Same close direction (Close Long, Close Short, Sell, or Auto-Deleveraging)
 *
 * For aggregated fills:
 * - Sizes are summed
 * - PnLs are summed
 * - Fees are summed
 * - Price is calculated as VWAP (Volume Weighted Average Price)
 * - First fill's orderId and metadata are preserved
 * - detailedOrderType (Stop Loss, Take Profit) is preserved from any grouped fill
 * - liquidation info is preserved from any grouped fill
 *
 * @param fills - Array of OrderFill objects to aggregate
 * @returns Array of OrderFill objects with close fills aggregated by timestamp
 */
export function aggregateFillsByTimestamp(fills: OrderFill[]): OrderFill[] {
  // Map to group fills by aggregation key
  const aggregationMap = new Map<string, OrderFill[]>();
  // Array to preserve non-aggregatable fills in order
  const nonAggregatableFills: OrderFill[] = [];

  // Group fills by asset + timestamp (truncated to second) + close direction
  for (const fill of fills) {
    const closeDirection = getCloseDirectionForAggregation(fill.direction);

    if (closeDirection === null) {
      // Not a close fill - don't aggregate, preserve as-is
      nonAggregatableFills.push(fill);
      continue;
    }

    // Create aggregation key: asset + timestamp (truncated to second) + close direction
    const timestampSecond = Math.floor(fill.timestamp / 1000);
    const aggregationKey = `${fill.symbol}-${timestampSecond}-${closeDirection}`;

    const existingGroup = aggregationMap.get(aggregationKey);
    if (existingGroup) {
      existingGroup.push(fill);
    } else {
      aggregationMap.set(aggregationKey, [fill]);
    }
  }

  // Build aggregated fills
  const aggregatedFills: OrderFill[] = [];

  for (const groupedFills of aggregationMap.values()) {
    if (groupedFills.length === 1) {
      // Only one fill in the group - no aggregation needed
      aggregatedFills.push(groupedFills[0]);
      continue;
    }

    // Aggregate multiple fills
    const firstFill = groupedFills[0];

    // Sum sizes, PnLs, and fees
    let totalSize = new BigNumber(0);
    let totalPnl = new BigNumber(0);
    let totalFee = new BigNumber(0);
    let totalNotional = new BigNumber(0); // For VWAP calculation: sum of (size * price)

    // Preserve detailedOrderType and liquidation from any fill in the group
    let aggregatedDetailedOrderType: string | undefined;
    let aggregatedLiquidation: OrderFill['liquidation'];
    let aggregatedStartPosition: string | undefined;

    for (const fill of groupedFills) {
      const size = new BigNumber(fill.size);
      const price = new BigNumber(fill.price);
      const pnl = new BigNumber(fill.pnl || '0');
      const fee = new BigNumber(fill.fee || '0');

      totalSize = totalSize.plus(size);
      totalPnl = totalPnl.plus(pnl);
      totalFee = totalFee.plus(fee);
      totalNotional = totalNotional.plus(size.times(price));

      // Preserve detailedOrderType from any fill that has it
      if (fill.detailedOrderType && !aggregatedDetailedOrderType) {
        aggregatedDetailedOrderType = fill.detailedOrderType;
      }

      // Preserve liquidation info from any fill that has it
      if (fill.liquidation && !aggregatedLiquidation) {
        aggregatedLiquidation = fill.liquidation;
      }

      // Use the startPosition from the first fill (represents position before any fills)
      if (fill.startPosition && !aggregatedStartPosition) {
        aggregatedStartPosition = fill.startPosition;
      }
    }

    // Calculate VWAP: totalNotional / totalSize
    const vwapPrice = totalSize.isZero()
      ? new BigNumber(firstFill.price)
      : totalNotional.dividedBy(totalSize);

    // Create aggregated fill
    const aggregatedFill: OrderFill = {
      orderId: firstFill.orderId, // Use first fill's orderId
      symbol: firstFill.symbol,
      side: firstFill.side,
      size: totalSize.toString(),
      price: vwapPrice.toString(),
      pnl: totalPnl.toString(),
      direction: firstFill.direction,
      fee: totalFee.toString(),
      feeToken: firstFill.feeToken,
      timestamp: firstFill.timestamp, // Use first fill's timestamp
      startPosition: aggregatedStartPosition,
      success: firstFill.success,
      liquidation: aggregatedLiquidation,
      orderType: firstFill.orderType,
      detailedOrderType: aggregatedDetailedOrderType,
    };

    aggregatedFills.push(aggregatedFill);
  }

  // Combine aggregated and non-aggregatable fills, then sort by timestamp descending
  const allFills = [...aggregatedFills, ...nonAggregatableFills];
  allFills.sort((a, b) => b.timestamp - a.timestamp);

  return allFills;
}

/**
 * Format an order label following the pattern: [Type] [Close?] [Direction]
 *
 * Examples:
 * - Market Long
 * - Market Close Long
 * - Limit Short
 * - Limit Close Short
 * - Stop Market Close Long
 * - Take Profit Limit Close Short
 *
 * @param order - The order object
 * @returns Formatted order label string
 */
function formatOrderLabel(order: Order): string {
  const { side, detailedOrderType, orderType, reduceOnly, isTrigger } = order;

  // Determine if this is a closing order
  const isClosing = Boolean(reduceOnly || isTrigger);

  // Determine direction based on whether it's closing or not
  let direction: string;
  if (isClosing) {
    // For closing orders: sell closes long, buy closes short
    direction = side === 'sell' ? 'long' : 'short';
  } else {
    // For opening orders: buy is long, sell is short
    direction = side === 'buy' ? 'long' : 'short';
  }

  // Get the order type string
  // Use detailedOrderType if available (e.g., "Stop Market", "Take Profit Limit")
  // Otherwise fall back to basic orderType
  const typeString =
    detailedOrderType || (orderType === 'limit' ? 'Limit' : 'Market');

  // Build the label: [Type] [Close?] [Direction]
  // Capitalize first letter
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  if (isClosing) {
    return capitalize(`${typeString} close ${direction}`);
  }

  return capitalize(`${typeString} ${direction}`);
}

/**
 * Transform abstract OrderFill objects to PerpsTransaction format.
 * Close fills that occur at the same timestamp for the same asset are automatically
 * aggregated to show combined PnL (handles split stop loss/take profit orders).
 *
 * @param fills - Array of abstract OrderFill objects
 * @param t - Optional translation function for direction labels
 * @returns Array of PerpsTransaction objects
 */
export function transformFillsToTransactions(
  fills: OrderFill[],
  t?: (key: string) => string,
): PerpsTransaction[] {
  // Aggregate close fills that occur at the same timestamp for the same asset
  // This handles split stop loss/take profit orders that execute as multiple fills
  const aggregatedFills = aggregateFillsByTimestamp(fills);

  return aggregatedFills.reduce((acc: PerpsTransaction[], fill) => {
    const {
      direction,
      orderId,
      symbol,
      size,
      price,
      fee,
      timestamp,
      feeToken,
      pnl,
      liquidation,
      detailedOrderType,
    } = fill;
    const [part1, part2] = direction ? direction.split(' ') : [];
    const isOpened = part1 === 'Open';
    const isClosed = part1 === 'Close';
    const isFlipped = part2 === '>';

    const isAutoDeleveraging = direction === 'Auto-Deleveraging';
    // Handle spot-perps and prelaunch markets that use "Buy"/"Sell" instead of "Open Long"/"Close Short"
    const isBuy = direction === 'Buy';
    const isSell = direction === 'Sell';

    let action = '';
    let isPositive = false;
    if (isOpened || isBuy) {
      action = isBuy ? 'Bought' : 'Opened';
      // Will be set based on fee calculation below
    } else if (isClosed || isSell || isAutoDeleveraging) {
      action = isSell ? 'Sold' : 'Closed';
      // Will be set based on PnL calculation below
    } else if (isFlipped) {
      action = 'Flipped';
      // Will be set based on calculation below
    } else if (direction) {
      console.error('Unknown action', fill);
      return acc;
    } else {
      console.error('Unknown fill direction', fill);
      return acc;
    }

    let amountBN = new BigNumber(0);
    let displayAmount = '';
    let fillSize = size;
    if (isFlipped) {
      fillSize = new BigNumber(fill.startPosition || '0')
        .minus(fill.size)
        .absoluteValue()
        .toString();
    }
    // Calculate display amount based on action type
    if (isOpened || isBuy) {
      // For opening positions or buying: show fee paid (negative)
      amountBN = new BigNumber(fill.fee || 0);
      displayAmount = `-$${Math.abs(amountBN.toNumber()).toFixed(2)}`;
      isPositive = false; // Fee is always a cost
    } else if (isClosed || isSell || isFlipped || isAutoDeleveraging) {
      // For closing positions: show PnL minus fee
      const pnlValue = new BigNumber(fill.pnl || 0);
      const feeValue = new BigNumber(fill.fee || 0);
      amountBN = pnlValue.minus(feeValue);
      const netPnL = amountBN.toNumber();
      // For display, show + for positive, - for negative, nothing for 0
      if (netPnL > 0) {
        displayAmount = `+$${Math.abs(netPnL).toFixed(2)}`;
        isPositive = true;
      } else if (netPnL < 0) {
        displayAmount = `-$${Math.abs(netPnL).toFixed(2)}`;
        isPositive = false;
      } else {
        displayAmount = `$${Math.abs(netPnL).toFixed(2)}`;
        isPositive = true; // Treat break-even as positive (green)
      }
    } else {
      // Fallback: show order size value
      amountBN = new BigNumber(fill.size).times(fill.price);
      displayAmount = `$${Math.abs(amountBN.toNumber()).toFixed(2)}`;
      isPositive = false; // Default to false for unknown cases
    }

    const isLiquidation = Boolean(liquidation);
    const isTakeProfit = Boolean(detailedOrderType?.includes('Take Profit'));
    const isStopLoss = Boolean(detailedOrderType?.includes('Stop'));

    // Helper to get direction label (uses translation if provided)
    const getDirectionLabel = (dir: string): string => {
      if (t) {
        return dir === 'long' ? t('perpsLong') : t('perpsShort');
      }
      return dir;
    };

    let title = '';

    if (isBuy || isSell) {
      // For Buy/Sell directions, just use the action ("Bought" or "Sold")
      title = action;
    } else if (isFlipped) {
      title = `${action} ${direction?.toLowerCase() || ''}`;
    } else if (isAutoDeleveraging) {
      const startPositionNum = Number(fill.startPosition);
      if (Number.isNaN(startPositionNum)) {
        return acc;
      }
      const directionLabel = getDirectionLabel(
        Number(fill.startPosition) > 0 ? 'long' : 'short',
      );
      title = `${action} ${directionLabel?.toLowerCase() || ''}`;
    } else {
      title = `${action} ${part2?.toLowerCase() || ''}`;
    }

    let fillType = FillType.Standard;
    if (isAutoDeleveraging) {
      fillType = FillType.AutoDeleveraging;
    } else if (isLiquidation) {
      fillType = FillType.Liquidation;
    } else if (isTakeProfit) {
      fillType = FillType.TakeProfit;
    } else if (isStopLoss) {
      fillType = FillType.StopLoss;
    }

    acc.push({
      id: `${orderId || 'fill'}-${timestamp}-${acc.length}`,
      type: 'trade',
      category: isOpened || isBuy ? 'position_open' : 'position_close',
      title,
      subtitle: `${size} ${getDisplaySymbol(symbol)}`,
      timestamp,
      symbol,
      fill: {
        shortTitle:
          isBuy || isSell
            ? action
            : `${action} ${
                isFlipped
                  ? direction?.toLowerCase() || ''
                  : part2?.toLowerCase() || ''
              }`,
        // this is the amount that is displayed in the transaction view for what has been spent/gained
        // it may be the fee spent or the pnl depending on the case
        amount: displayAmount,
        amountNumber: parseFloat(amountBN.toFixed(2)),
        isPositive,
        size: fillSize,
        entryPrice: price,
        pnl,
        fee,
        points: '0', // Points feature not activated yet
        feeToken,
        action,
        liquidation,
        fillType,
      },
    });
    return acc;
  }, []);
}

/**
 * Transform abstract Order objects to PerpsTransaction format.
 *
 * @param orders - Array of abstract Order objects
 * @returns Array of PerpsTransaction objects
 */
export function transformOrdersToTransactions(
  orders: Order[],
): PerpsTransaction[] {
  return orders.map((order) => {
    const {
      orderId,
      symbol,
      orderType,
      size,
      originalSize,
      price,
      status,
      timestamp,
    } = order;

    const isCancelled = status === 'canceled';
    const isCompleted = status === 'filled';
    const isOpened = status === 'open';
    const isRejected = status === 'rejected';
    const isTriggered = status === 'triggered';

    // Use centralized order label formatting
    const title = formatOrderLabel(order);
    const subtitle = `${originalSize || '0'} ${getDisplaySymbol(symbol)}`;

    const orderTypeSlug = orderType.toLowerCase().split(' ').join('_');

    let orderStatusType: PerpsOrderTransactionStatusType =
      PerpsOrderTransactionStatusType.Pending;
    let statusText = PerpsOrderTransactionStatus.Queued;

    if (isCompleted) {
      orderStatusType = PerpsOrderTransactionStatusType.Filled;
      statusText = PerpsOrderTransactionStatus.Filled;
    } else if (isCancelled) {
      orderStatusType = PerpsOrderTransactionStatusType.Canceled;
      statusText = PerpsOrderTransactionStatus.Canceled;
    } else if (isRejected) {
      orderStatusType = PerpsOrderTransactionStatusType.Canceled; // Map rejected to canceled
      statusText = PerpsOrderTransactionStatus.Rejected;
    } else if (isTriggered) {
      orderStatusType = PerpsOrderTransactionStatusType.Filled; // Map triggered to filled
      statusText = PerpsOrderTransactionStatus.Triggered;
    } else {
      orderStatusType = PerpsOrderTransactionStatusType.Pending;
      statusText = isOpened
        ? PerpsOrderTransactionStatus.Open
        : PerpsOrderTransactionStatus.Queued;
    }

    // Calculate filled percentage from abstract types
    const filledPercent = new BigNumber(size).eq(0)
      ? '100'
      : new BigNumber(originalSize)
          .minus(size)
          .dividedBy(originalSize)
          .absoluteValue()
          .times(100)
          .toString();

    return {
      id: `${orderId}-${timestamp}`,
      type: 'order',
      category: 'limit_order',
      title,
      subtitle,
      timestamp,
      symbol,
      order: {
        text: statusText,
        statusType: orderStatusType,
        type: orderTypeSlug.includes('limit') ? 'limit' : 'market',
        size: new BigNumber(originalSize).times(price).toString(),
        limitPrice: price,
        filled: `${filledPercent}%`,
      },
    };
  });
}

/**
 * Transform abstract Funding objects to PerpsTransaction format.
 *
 * @param funding - Array of abstract Funding objects
 * @returns Array of PerpsTransaction objects sorted by timestamp (newest first)
 */
export function transformFundingToTransactions(
  funding: Funding[],
): PerpsTransaction[] {
  // Sort funding by timestamp in descending order (newest first) to match Orders and Trades
  const sortedFunding = [...funding].sort((a, b) => b.timestamp - a.timestamp);

  return sortedFunding.map((fundingItem) => {
    const { symbol, amountUsd, rate, timestamp } = fundingItem;

    // Create safe amount strings
    const isPositive = new BigNumber(amountUsd).gt(0);
    const amountUSDC = `${isPositive ? '+' : '-'}$${new BigNumber(amountUsd)
      .absoluteValue()
      .toString()}`;

    return {
      id: `funding-${timestamp}-${symbol}`,
      type: 'funding',
      category: 'funding_fee',
      title: `${isPositive ? 'Received' : 'Paid'} funding fee`,
      subtitle: getDisplaySymbol(symbol),
      timestamp,
      symbol,
      fundingAmount: {
        isPositive,
        fee: amountUSDC,
        feeNumber: parseFloat(amountUsd),
        rate: `${new BigNumber(rate).times(100).toString()}%`,
      },
    };
  });
}

/**
 * Transform UserHistoryItem objects to PerpsTransaction format.
 * Only shows completed deposits/withdrawals (txHash not displayed in UI).
 *
 * @param userHistory - Array of UserHistoryItem objects (deposits/withdrawals)
 * @returns Array of PerpsTransaction objects
 */
export function transformUserHistoryToTransactions(
  userHistory: UserHistoryItem[],
): PerpsTransaction[] {
  return userHistory
    .filter((item) => item.status === 'completed')
    .map((item) => {
      const { id, timestamp, type, amount, asset, txHash, status } = item;

      const isDeposit = type === 'deposit';

      // Format amount with appropriate sign
      const amountBN = new BigNumber(amount);
      const displayAmount = `${isDeposit ? '+' : '-'}$${amountBN.toFixed(2)}`;

      // For completed transactions, status is always positive (green)
      const statusText = 'Completed';

      return {
        id: `${type}-${id}`,
        type: isDeposit ? 'deposit' : 'withdrawal',
        category: isDeposit ? 'deposit' : 'withdrawal',
        title: `${isDeposit ? 'Deposited' : 'Withdrew'} ${amount} ${asset}`,
        subtitle: statusText,
        timestamp,
        symbol: asset,
        depositWithdrawal: {
          amount: displayAmount,
          amountNumber: amountBN.toNumber(),
          isPositive: isDeposit,
          asset,
          txHash: txHash || '',
          status,
          type: isDeposit ? 'deposit' : 'withdrawal',
        },
      };
    });
}

/**
 * Withdrawal request type for pending withdrawals
 */
export type WithdrawalRequest = {
  id: string;
  timestamp: number;
  amount: string;
  asset: string;
  txHash?: string;
  status: 'pending' | 'bridging' | 'completed' | 'failed';
  destination?: string;
  withdrawalId?: string;
};

/**
 * Deposit request type for pending deposits
 */
export type DepositRequest = {
  id: string;
  timestamp: number;
  amount: string;
  asset: string;
  txHash?: string;
  status: 'pending' | 'bridging' | 'completed' | 'failed';
  source?: string;
  depositId?: string;
};

/**
 * Transform WithdrawalRequest objects to PerpsTransaction format.
 * Only shows completed withdrawals (txHash not displayed in UI).
 *
 * @param withdrawalRequests - Array of WithdrawalRequest objects
 * @returns Array of PerpsTransaction objects
 */
export function transformWithdrawalRequestsToTransactions(
  withdrawalRequests: WithdrawalRequest[],
): PerpsTransaction[] {
  return withdrawalRequests
    .filter((request) => request.status === 'completed')
    .map((request) => {
      const { id, timestamp, amount, asset, txHash, status } = request;

      // Format amount with negative sign for withdrawals
      const amountBN = new BigNumber(amount);
      const displayAmount = `-$${amountBN.toFixed(2)}`;

      // For completed withdrawals, status is always positive (green)
      const statusText = 'Completed';
      const isPositive = true;

      return {
        id: `withdrawal-${id}`,
        type: 'withdrawal' as const,
        category: 'withdrawal' as const,
        title: `Withdrew ${amount} ${asset}`,
        subtitle: statusText,
        timestamp,
        symbol: asset,
        depositWithdrawal: {
          amount: displayAmount,
          amountNumber: -amountBN.toNumber(), // Negative for withdrawals
          isPositive,
          asset,
          txHash: txHash || '',
          status,
          type: 'withdrawal' as const,
        },
      };
    });
}

/**
 * Transform DepositRequest objects to PerpsTransaction format.
 * Only shows completed deposits (txHash not displayed in UI).
 *
 * @param depositRequests - Array of DepositRequest objects
 * @returns Array of PerpsTransaction objects
 */
export function transformDepositRequestsToTransactions(
  depositRequests: DepositRequest[],
): PerpsTransaction[] {
  return depositRequests
    .filter((request) => request.status === 'completed')
    .map((request) => {
      const { id, timestamp, amount, asset, txHash, status } = request;

      // Format amount with positive sign for deposits
      const amountBN = new BigNumber(amount);
      const displayAmount = `+$${amountBN.toFixed(2)}`;

      // For completed deposits, status is always positive (green)
      const statusText = 'Completed';
      const isPositive = true;

      // Create title based on whether we have the actual amount
      const title =
        amount === '0' || amount === '0.00'
          ? 'Deposit'
          : `Deposited ${amount} ${asset}`;

      return {
        id: `deposit-${id}`,
        type: 'deposit' as const,
        category: 'deposit' as const,
        title,
        subtitle: statusText,
        timestamp,
        symbol: asset,
        depositWithdrawal: {
          amount: displayAmount,
          amountNumber: amountBN.toNumber(),
          isPositive,
          asset,
          txHash: txHash || '',
          status,
          type: 'deposit' as const,
        },
      };
    });
}
