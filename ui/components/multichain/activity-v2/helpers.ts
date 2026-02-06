import type { TransactionMeta } from '@metamask/transaction-controller';
import type { Transaction } from '@metamask/keyring-api';
import type { Hex } from 'viem';
import { MULTICHAIN_NETWORK_DECIMAL_PLACES } from '@metamask/multichain-network-controller';
import type { TransactionViewModel } from '../../../../shared/acme-controller/types';
import {
  NATIVE_TOKEN_ADDRESS,
  TransactionGroupCategory,
} from '../../../../shared/constants/transaction';
import {
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  NETWORK_TO_NAME_MAP,
} from '../../../../shared/constants/network';
import { CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP } from '../../../../shared/constants/common';

export type FlattenedItem =
  | { type: 'date-header'; date: number }
  | { type: 'transaction'; data: TransactionViewModel; id: string };

export function isDateHeader(
  item: FlattenedItem,
): item is FlattenedItem & { type: 'date-header' } {
  return item.type === 'date-header';
}

// TODO: Re-use existing
function parseDate(timestamp: string | number): number {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

// TODO: Re-use existing
export function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(timestamp);
}

// TODO: Re-use existing
export function formatDateTime(timestamp: string | number): string {
  if (!timestamp) {
    return '';
  }

  const dateObj = new Date(timestamp);
  const time = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(dateObj);

  const month = new Intl.DateTimeFormat('en-US', {
    month: 'short',
  }).format(dateObj);

  const date = `${month} ${dateObj.getDate()}, ${dateObj.getFullYear()}`;
  return `${date} at ${time}`;
}

// TODO: Move
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

export function getTransferAmount(amounts: TransactionViewModel['amounts']) {
  const data = amounts?.from ?? amounts?.to ?? null;

  if (!data?.amount || data.decimal === undefined) {
    return {};
  }

  return {
    amount: formatUnits(data.amount, data.decimal),
    symbol: data.symbol,
  };
}

export function groupTransactionsByDate(transactions: TransactionViewModel[]) {
  const groupedByDate = new Map<
    number,
    { date: number; transactions: TransactionViewModel[] }
  >();

  transactions.forEach((transaction) => {
    const date = parseDate(transaction.time);

    if (!groupedByDate.has(date)) {
      groupedByDate.set(date, { date, transactions: [] });
    }

    groupedByDate.get(date)?.transactions.push(transaction);
  });

  // Convert map to array and sort by date (newest first)
  const grouped = Array.from(groupedByDate.values());
  grouped.sort((a, b) => b.date - a.date);

  // Sort transactions within each group (newest first)
  grouped.forEach((group) => {
    group.transactions.sort((a, b) => b.time - a.time);
  });

  return grouped;
}

export function getExplorerUrl(chainId: number, hash: string): string | null {
  const hexChainId = `0x${chainId.toString(16)}`;
  const baseUrl = CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP[hexChainId];
  return baseUrl ? `${baseUrl}tx/${hash}` : null;
}

export function flattenGroupedTransactions(
  groupedTransactions: { date: number; transactions: TransactionViewModel[] }[],
) {
  const flattened: FlattenedItem[] = [];

  groupedTransactions.forEach((group) => {
    flattened.push({
      type: 'date-header',
      date: group.date,
    });

    group.transactions.forEach((tx) => {
      flattened.push({
        type: 'transaction',
        id: tx.hash ?? tx.id,
        data: tx,
      });
    });
  });

  return flattened;
}

/**
 * Convert a decimal string amount (e.g., "0.00032585") to BigInt representation
 *
 * @param amountStr - The amount as a decimal string
 * @param decimals - Number of decimal places to use
 * @returns BigInt representation
 */
function parseAmountToBigInt(amountStr: string, decimals: number): bigint {
  const [integerPart = '0', fractionalPart = ''] = amountStr.split('.');
  const paddedFraction = fractionalPart
    .padEnd(decimals, '0')
    .slice(0, decimals);
  return BigInt(integerPart + paddedFraction);
}

/**
 * Normalize non-EVM Transaction to TransactionViewModel shape
 *
 * @param tx - The non-EVM transaction
 * @returns A TransactionViewModel compatible object
 */
function normalizeNonEvmTransaction(tx: Transaction): TransactionViewModel {
  const timeMs = (tx.timestamp ?? 0) * 1000;

  // Get decimals for this chain
  const decimals =
    MULTICHAIN_NETWORK_DECIMAL_PLACES[
      tx.chain as keyof typeof MULTICHAIN_NETWORK_DECIMAL_PLACES
    ] ?? 8;

  // Extract first from/to movement for addresses and amounts
  const fromMovement = tx.from?.[0];
  const toMovement = tx.to?.[0];

  // Pick relevant movement based on type (receive = to, send = from)
  const isReceive = tx.type === 'receive';
  const primaryMovement = isReceive ? toMovement : fromMovement;

  // Extract amount from the asset
  const asset = primaryMovement?.asset;
  const amountStr =
    asset && 'amount' in asset ? String(asset.amount) : undefined;
  const symbol = asset && 'unit' in asset ? String(asset.unit) : undefined;

  // Build amounts object (same structure as EVM)
  const amountData =
    amountStr && symbol
      ? {
          amount: parseAmountToBigInt(amountStr, decimals),
          decimal: decimals,
          symbol,
        }
      : undefined;

  // Determine amounts placement based on transaction type
  let amounts: TransactionViewModel['amounts'];
  if (amountData) {
    amounts = isReceive ? { to: amountData } : { from: amountData };
  }

  // Map non-EVM type to category
  const categoryMap: Record<string, TransactionViewModel['category']> = {
    send: TransactionGroupCategory.send,
    receive: TransactionGroupCategory.receive,
    swap: TransactionGroupCategory.swap,
  };
  const category = categoryMap[tx.type] ?? TransactionGroupCategory.interaction;

  return {
    // Required TransactionMeta fields (minimal stubs)
    id: tx.id,
    hash: '',
    chainId: tx.chain as Hex,
    networkClientId: tx.chain,
    status: tx.status as TransactionViewModel['status'],
    time: timeMs,
    txParams: {
      from: fromMovement?.address ?? '',
      to: toMovement?.address ?? '',
    },

    // TransactionViewModel extensions
    readable: '',
    transactionType: tx.type,
    category,
    amounts,
  } as TransactionViewModel;
}

export function mergeTransactions(
  _pendingTransactions: TransactionMeta[], // TODO: Re-enable pending logic
  completedTransactions: TransactionViewModel[],
  nonEvmTransactions: { transactions: Transaction[] },
): TransactionViewModel[] {
  // Normalize non-EVM transactions to TransactionViewModel
  const normalizedNonEvm = (nonEvmTransactions?.transactions ?? []).map(
    normalizeNonEvmTransaction,
  );

  // Merge and sort by time (newest first)
  return [...completedTransactions, ...normalizedNonEvm].sort(
    (a, b) => b.time - a.time,
  );
}

export function mapChainInfo(chainId: Hex) {
  const chainImageUrl = CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[chainId];
  const chainName = NETWORK_TO_NAME_MAP[chainId];

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
