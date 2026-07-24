/**
 * Perps Transaction Transform Utilities
 *
 * Transform functions to convert raw API data (OrderFill, Order, Funding, UserHistoryItem)
 * into the unified PerpsTransaction format for display in the Activity page.
 *
 * Adapted from mobile: app/components/UI/Perps/utils/transactionTransforms.ts
 */

import { BigNumber } from 'bignumber.js';
import type {
  Funding,
  Order,
  OrderFill,
  UserHistoryItem,
} from '@metamask/perps-controller';
import {
  TransactionStatus as WalletTransactionStatus,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import {
  FillType,
  PerpsOrderTransactionStatus,
  PerpsOrderTransactionStatusType,
  type PerpsTransaction,
} from '../types/transactionHistory';
import { formatPositionSize } from '../../../../../shared/lib/perps-formatters';
import { parseStandardTokenTransactionData } from '../../../../../shared/lib/transaction.utils';
import { calcTokenAmount } from '../../../../../shared/lib/transactions-controller-utils';
import { ARBITRUM_USDC } from '../../../../pages/confirmations/constants/perps';
import { getTokenTransferData } from '../../../../pages/confirmations/utils/transaction-pay';
import { getDisplaySymbol } from '../utils';
import { formatOrderLabel } from './orderUtils';

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
      // formatPositionSize strips trailing `.0` for whole-number token amounts
      // (e.g. PUMP "6601.0" → "6601") and trims redundant zeros for fractional
      // sizes. Without szDecimals it falls back to magnitude-based precision,
      // which matches mobile's activity-row formatting.
      subtitle: `${formatPositionSize(size)} ${getDisplaySymbol(symbol)}`,
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
        rate: `${new BigNumber(rate ?? '0').times(100).toString()}%`,
      },
    };
  });
}

/**
 * Maps a wallet TransactionController status to the Perps deposit/withdrawal
 * status this transform surfaces. Every status resolves to a bucket so
 * wallet-tracked deposits/withdrawals are visible on the Activity page from
 * the moment they're submitted, not just once confirmed — the row's
 * subtitle reflects the real state (Pending/Failed/Completed) via
 * `getDepositWithdrawalStatusText` instead of always showing "Completed".
 */
const WALLET_TX_STATUS_TO_PERPS_STATUS: Record<
  WalletTransactionStatus,
  'completed' | 'failed' | 'pending'
> = {
  [WalletTransactionStatus.confirmed]: 'completed',
  [WalletTransactionStatus.failed]: 'failed',
  [WalletTransactionStatus.rejected]: 'failed',
  [WalletTransactionStatus.dropped]: 'failed',
  [WalletTransactionStatus.cancelled]: 'failed',
  [WalletTransactionStatus.signed]: 'pending',
  [WalletTransactionStatus.submitted]: 'pending',
  [WalletTransactionStatus.approved]: 'pending',
  [WalletTransactionStatus.unapproved]: 'pending',
};

/**
 * Plain-English status text for deposit/withdrawal rows, keyed by
 * `depositWithdrawal.status`. Mirrors the `PerpsOrderTransactionStatus`
 * convention used for order rows: transforms set deterministic English text
 * here, and the Activity page's `TransactionCard` maps that text to a
 * translated string for display.
 *
 * @param status - The deposit/withdrawal status to derive display text for.
 * @returns Plain-English status text ('Completed', 'Failed', or 'Pending').
 */
function getDepositWithdrawalStatusText(
  status: 'completed' | 'failed' | 'pending' | 'bridging',
): string {
  switch (status) {
    case 'completed':
      return 'Completed';
    case 'failed':
      return 'Failed';
    case 'pending':
    case 'bridging':
    default:
      return 'Pending';
  }
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

      return {
        id: `${type}-${id}`,
        type: isDeposit ? 'deposit' : 'withdrawal',
        category: isDeposit ? 'deposit' : 'withdrawal',
        title: `${isDeposit ? 'Deposited' : 'Withdrew'} ${amount} ${asset}`,
        subtitle: getDepositWithdrawalStatusText(status),
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
 * Shared logic behind `transformWalletPerpsDepositsToTransactions` and
 * `transformWalletPerpsWithdrawalsToTransactions`: decodes the USDC amount
 * from the wallet transaction's ERC20-transfer calldata and maps its wallet
 * status to a Perps deposit/withdrawal row, differing only in sign, title
 * wording, and the deposit/withdrawal type.
 *
 * @param transactions - Array of TransactionMeta already scoped to the
 * active account and the relevant deposit/withdrawal tx type(s).
 * @param direction - Whether these are deposit or withdrawal transactions.
 * @returns Array of PerpsTransaction objects with the given direction's type.
 */
function transformWalletPerpsTransactions(
  transactions: TransactionMeta[],
  direction: 'deposit' | 'withdrawal',
): PerpsTransaction[] {
  const isDeposit = direction === 'deposit';
  const sign = isDeposit ? '+' : '-';
  const verb = isDeposit ? 'Deposited' : 'Withdrew';
  const emptyTitle = isDeposit ? 'Deposit' : 'Withdrawal';

  return transactions.map((tx) => {
    const tokenTransfer = getTokenTransferData(tx);
    const decoded = tokenTransfer
      ? parseStandardTokenTransactionData(tokenTransfer.data)
      : undefined;
    const rawAmount = decoded?.args?._value?.toString?.();
    const amountBN =
      rawAmount === undefined
        ? new BigNumber(0)
        : calcTokenAmount(rawAmount, ARBITRUM_USDC.decimals);

    const displayAmount = `${sign}$${amountBN.toFixed(2)}`;
    const status = WALLET_TX_STATUS_TO_PERPS_STATUS[tx.status] ?? 'pending';
    const title = amountBN.isZero()
      ? emptyTitle
      : `${verb} ${amountBN.toFixed(2)} ${ARBITRUM_USDC.symbol}`;

    return {
      id: `wallet-${direction}-${tx.id}`,
      type: direction,
      category: direction,
      title,
      subtitle: getDepositWithdrawalStatusText(status),
      timestamp: tx.time ?? 0,
      symbol: ARBITRUM_USDC.symbol,
      depositWithdrawal: {
        amount: displayAmount,
        amountNumber: isDeposit ? amountBN.toNumber() : -amountBN.toNumber(),
        isPositive: isDeposit,
        asset: ARBITRUM_USDC.symbol,
        txHash: tx.hash ?? '',
        status,
        type: direction,
      },
    };
  });
}

/**
 * Transform wallet-tracked Perps deposit transactions (`perpsDeposit` /
 * `perpsDepositAndOrder`) into `PerpsTransaction` rows.
 *
 * HyperLiquid's user-history ledger (the primary source `transformUserHistoryToTransactions`
 * draws from) only reflects a deposit once the bridged funds have actually
 * landed on HyperLiquid, which can lag behind the wallet's own on-chain
 * deposit transaction confirming. Without this fallback, a just-completed
 * deposit can be invisible under the Activity page's Deposits filter for a
 * while even though the user's Perps balance already reflects it.
 * `usePerpsTransactionHistory` merges this list with the user-history
 * deposits and de-duplicates by `txHash`, so once the ledger catches up the
 * two representations of the same deposit collapse into one.
 *
 * Deposits are included regardless of wallet status (pending/failed/
 * confirmed) so a still-confirming or failed deposit is visible with an
 * accurate status instead of only appearing once confirmed.
 *
 * @param transactions - Array of TransactionMeta with type `perpsDeposit` or
 * `perpsDepositAndOrder`, already scoped to the active account.
 * @returns Array of PerpsTransaction objects with type 'deposit'.
 */
export function transformWalletPerpsDepositsToTransactions(
  transactions: TransactionMeta[],
): PerpsTransaction[] {
  return transformWalletPerpsTransactions(transactions, 'deposit');
}

/**
 * Transform wallet-tracked Perps withdrawal transactions (`perpsWithdraw`)
 * into `PerpsTransaction` rows.
 *
 * Mirrors `transformWalletPerpsDepositsToTransactions`: HyperLiquid's
 * user-history ledger can lag behind the wallet's own on-chain withdrawal
 * transaction confirming, so this fallback keeps a just-submitted
 * withdrawal visible on the Activity page immediately, with its real
 * pending/failed/completed status. `usePerpsTransactionHistory` merges this
 * list with the user-history withdrawals and de-duplicates by `txHash`.
 *
 * @param transactions - Array of TransactionMeta with type `perpsWithdraw`,
 * already scoped to the active account.
 * @returns Array of PerpsTransaction objects with type 'withdrawal'.
 */
export function transformWalletPerpsWithdrawalsToTransactions(
  transactions: TransactionMeta[],
): PerpsTransaction[] {
  return transformWalletPerpsTransactions(transactions, 'withdrawal');
}

/**
 * Filters out wallet-sourced deposit/withdrawal transactions whose `txHash`
 * already appears among an existing transaction of the same type
 * (typically the user-history deposits/withdrawals already present in the
 * merged transaction list).
 *
 * Used by `usePerpsTransactionHistory` to avoid showing the same deposit or
 * withdrawal twice once HyperLiquid's user-history ledger catches up with a
 * transaction that was initially only visible via the wallet's own
 * transaction record.
 *
 * @param walletTransactions - Deposit or withdrawal transactions sourced
 * from the wallet's TransactionController (see
 * `transformWalletPerpsDepositsToTransactions` /
 * `transformWalletPerpsWithdrawalsToTransactions`).
 * @param existingTransactions - Transactions already present in the merged
 * list (e.g. from user history) to de-duplicate against.
 * @returns The subset of `walletTransactions` not already represented.
 */
export function dedupeWalletTransactionsByTxHash(
  walletTransactions: PerpsTransaction[],
  existingTransactions: PerpsTransaction[],
): PerpsTransaction[] {
  const existingTxHashes = new Set<string>();
  for (const tx of existingTransactions) {
    const txHash = tx.depositWithdrawal?.txHash?.toLowerCase();
    if ((tx.type === 'deposit' || tx.type === 'withdrawal') && txHash) {
      existingTxHashes.add(`${tx.type}:${txHash}`);
    }
  }

  return walletTransactions.filter((tx) => {
    const txHash = tx.depositWithdrawal?.txHash?.toLowerCase();
    return !txHash || !existingTxHashes.has(`${tx.type}:${txHash}`);
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

      // Completion status is separate from amount polarity.
      // Withdrawals are outflows, so they are always negative for styling.
      const isPositive = false;

      const title = amountBN.isZero()
        ? 'Withdrawal'
        : `Withdrew ${amount} ${asset}`;

      return {
        id: `withdrawal-${id}`,
        type: 'withdrawal' as const,
        category: 'withdrawal' as const,
        title,
        subtitle: getDepositWithdrawalStatusText(status),
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
        subtitle: getDepositWithdrawalStatusText(status),
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
