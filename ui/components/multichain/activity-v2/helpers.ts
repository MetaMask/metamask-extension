import type { Hex } from 'viem';
import type { Transaction } from '@metamask/keyring-api';
import type {
  TokenAmount,
  TransactionGroup,
  TransactionViewModel,
} from '../../../../shared/acme-controller/types';
import { NATIVE_TOKEN_ADDRESS } from '../../../../shared/constants/transaction';
import {
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  NETWORK_TO_NAME_MAP,
} from '../../../../shared/constants/network';
import { CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP } from '../../../../shared/constants/common';

export type FlattenedItem =
  | { type: 'date-header'; date: number }
  | { type: 'pending'; transactionGroup: TransactionGroup; id: string }
  | { type: 'local-completed'; transactionGroup: TransactionGroup; id: string }
  | { type: 'completed'; data: TransactionViewModel; id: string }
  | { type: 'non-evm'; transaction: Transaction; id: string };

export function isDateHeader(
  item: FlattenedItem,
): item is FlattenedItem & { type: 'date-header' } {
  return item.type === 'date-header';
}

export function isPendingItem(
  item: FlattenedItem,
): item is FlattenedItem & { type: 'pending' } {
  return item.type === 'pending';
}

export function isLocalCompletedItem(
  item: FlattenedItem,
): item is FlattenedItem & { type: 'local-completed' } {
  return item.type === 'local-completed';
}

export function isNonEvmItem(
  item: FlattenedItem,
): item is FlattenedItem & { type: 'non-evm' } {
  return item.type === 'non-evm';
}

function parseDate(timestamp: string | number): number {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export function formatUnits(value: bigint, decimals: number) {
  let display = value.toString();
  const negative = display.startsWith('-');

  if (negative) {
    display = display.slice(1);
  }

  display = display.padStart(decimals, '0');

  const integer = display.slice(0, display.length - decimals);
  let fraction = display.slice(display.length - decimals);
  fraction = fraction.replace(/(0+)$/u, '');

  return `${negative ? '-' : ''}${integer || '0'}${fraction ? `.${fraction}` : ''}`;
}

// Get the primary display amount for a transaction.
// - For swaps (has both from and to): returns the "from" amount (negative)
// - For sends: returns the "from" amount
// - For receives: returns the "to" amount
export function getTransferAmount(amounts: {
  from?: TokenAmount;
  to?: TokenAmount;
}): {
  amount?: `${number}`;
  symbol?: string;
} {
  const { from, to } = amounts;
  const hasFrom = from?.amount !== undefined && from?.decimal !== undefined;
  const hasTo = to?.amount !== undefined && to?.decimal !== undefined;

  // For swaps or outgoing transactions, show the sent amount (from) as negative
  if (hasFrom) {
    const formatted = formatUnits(from.amount, from.decimal);
    const amount = formatted.startsWith('-') ? formatted : `-${formatted}`;
    return {
      amount: amount as `${number}`,
      symbol: from.symbol,
    };
  }

  // For incoming transactions, use to
  if (hasTo) {
    return {
      amount: formatUnits(to.amount, to.decimal) as `${number}`,
      symbol: to.symbol,
    };
  }

  return {};
}

export function getExplorerUrl(chainId: Hex, hash: string): string | null {
  const baseUrl = CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP[chainId];
  return baseUrl ? `${baseUrl}tx/${hash}` : null;
}

// NOTE
export function filterLocalCompletedNotInApi(
  localCompletedGroups: TransactionGroup[],
  apiTransactions: TransactionViewModel[],
): TransactionGroup[] {
  // Build a set of transaction hashes from API for deduplication
  const apiHashes = new Set(
    apiTransactions
      .map((tx) => tx.hash?.toLowerCase())
      .filter((hash): hash is string => Boolean(hash)),
  );

  // Only include those NOT already in API
  // Transactions without a hash (e.g. failed relay transactions) are always included
  // since they can't exist in the API
  return localCompletedGroups.filter((group) => {
    const hash = group.primaryTransaction.hash?.toLowerCase();
    return !hash || !apiHashes.has(hash);
  });
}

type MergedItem =
  | { type: 'pending'; group: TransactionGroup; time: number }
  | { type: 'local-completed'; group: TransactionGroup; time: number }
  | { type: 'completed'; tx: TransactionViewModel; time: number }
  | { type: 'non-evm'; transaction: Transaction; time: number };

export function mergeAllTransactionsByTime(
  pendingGroups: TransactionGroup[],
  localCompletedGroups: TransactionGroup[],
  apiTransactions: TransactionViewModel[],
  nonEvmTransactions: Transaction[] = [],
): MergedItem[] {
  const pendingItems = pendingGroups.map((group) => ({
    type: 'pending' as const,
    group,
    time: group.primaryTransaction.time ?? 0,
  }));

  const localCompletedItems = localCompletedGroups.map((group) => ({
    type: 'local-completed' as const,
    group,
    time: group.primaryTransaction.time ?? 0,
  }));

  const completedItems = apiTransactions.map((tx) => ({
    type: 'completed' as const,
    tx,
    time: tx.time ?? 0,
  }));

  const nonEvmItems = nonEvmTransactions.map((transaction) => ({
    type: 'non-evm' as const,
    transaction,
    time: (transaction.timestamp ?? 0) * 1000,
  }));

  // Sort all by time (newest first)
  return [
    ...pendingItems,
    ...localCompletedItems,
    ...completedItems,
    ...nonEvmItems,
  ].sort((a, b) => b.time - a.time);
}

export function groupAndFlattenMergedTransactions(
  mergedItems: MergedItem[],
): FlattenedItem[] {
  if (mergedItems.length === 0) {
    return [];
  }

  const flattened: FlattenedItem[] = [];
  let currentDate: number | null = null;

  for (const item of mergedItems) {
    const date = parseDate(item.time);

    // Add date header when date changes
    if (date !== currentDate) {
      flattened.push({ type: 'date-header', date });
      currentDate = date;
    }

    // Add the transaction item based on type
    if (item.type === 'pending') {
      flattened.push({
        type: 'pending',
        id: item.group.primaryTransaction.id,
        transactionGroup: item.group,
      });
    } else if (item.type === 'local-completed') {
      flattened.push({
        type: 'local-completed',
        id: item.group.primaryTransaction.id,
        transactionGroup: item.group,
      });
    } else if (item.type === 'non-evm') {
      flattened.push({
        type: 'non-evm',
        id: item.transaction.id,
        transaction: item.transaction,
      });
    } else {
      flattened.push({
        type: 'completed',
        id: item.tx.id,
        data: item.tx,
      });
    }
  }

  return flattened;
}

export function mapChainInfo(chainId: Hex) {
  const chainImageUrl = CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[chainId];
  const chainName =
    NETWORK_TO_NAME_MAP[chainId as keyof typeof NETWORK_TO_NAME_MAP] ||
    'Unknown Network';

  return {
    chainImageUrl,
    chainName,
  };
}

export function calculateFiatFromMarketRates(
  transaction: TransactionViewModel,
  marketRates: Record<number, Record<string, number>>,
): number | null {
  const { chainId, transferInformation, txParams } = transaction;
  const { value } = txParams;

  // Get token address - either from transferInformation or native token
  const tokenAddress =
    transferInformation?.contractAddress?.toLowerCase() ??
    (value && value !== '0' && value !== '0x0'
      ? NATIVE_TOKEN_ADDRESS
      : undefined);

  if (!tokenAddress || !marketRates[parseInt(chainId, 16)]?.[tokenAddress]) {
    return null;
  }

  // Extract amount to calculate fiat value
  let amount = 0;
  if (transferInformation) {
    amount =
      parseFloat(transferInformation.amount ?? '0') /
      Math.pow(10, transferInformation.decimals ?? 18);
  } else if (value && value !== '0' && value !== '0x0') {
    const numericValue = value.startsWith('0x')
      ? Number(BigInt(value)) / 1e18
      : parseFloat(value) / 1e18;
    amount = numericValue;
  }

  if (amount === 0) {
    return null;
  }

  return Math.abs(amount) * marketRates[parseInt(chainId, 16)][tokenAddress];
}
