import type {
  DateGroupedTransactions,
  FlattenedItem,
  TransactionViewModel,
} from '../../../../shared/acme-controller/types';
import {
  NATIVE_TOKEN_ADDRESS,
  TransactionGroupCategory,
} from '../../../../shared/constants/transaction';
import {
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  NETWORK_TO_NAME_MAP,
} from '../../../../shared/constants/network';
import { isEqualCaseInsensitive } from '../../../../shared/modules/string-utils';
import { CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP } from '../../../../shared/constants/common';

export function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(timestamp);
}

function parseDate(timestamp: string | number): number {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export function groupTransactionsByDate(transactions: TransactionViewModel[]) {
  const groupedByDate = new Map<number, DateGroupedTransactions>();

  transactions.forEach((transaction) => {
    const date = parseDate(transaction.timestamp);

    if (!groupedByDate.has(date)) {
      groupedByDate.set(date, {
        date,
        transactions: [],
      });
    }

    groupedByDate.get(date)?.transactions.push(transaction);
  });

  // Convert map to array and sort by date (newest first)
  const grouped = Array.from(groupedByDate.values());
  grouped.sort((a, b) => b.date - a.date);

  // Sort transactions within each group (newest first)
  grouped.forEach((group) => {
    group.transactions.sort((a, b) => {
      const aTime = new Date(a.timestamp).getTime();
      const bTime = new Date(b.timestamp).getTime();
      return bTime - aTime;
    });
  });

  return grouped;
}

export function getExplorerUrl(chainId: number, hash: string): string | null {
  const hexChainId = `0x${chainId.toString(16)}`;
  const baseUrl = CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP[hexChainId];
  return baseUrl ? `${baseUrl}tx/${hash}` : null;
}

export function formatDateTime(timestamp: string | number): string {
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

export function flattenGroupedTransactions(
  groupedTransactions: DateGroupedTransactions[],
) {
  const flattened: FlattenedItem[] = [];

  groupedTransactions.forEach((group) => {
    flattened.push({
      type: 'date-header',
      date: group.date,
    });

    group.transactions.forEach((transaction) => {
      flattened.push({
        type: 'transaction',
        data: transaction,
        id: transaction.hash,
      });
    });
  });

  return flattened;
}

export function mergeTransactions(
  pendingTransactions: TransactionViewModel[],
  transactions: TransactionViewModel[],
) {
  // Build map of pending transactions by hash
  const pendingTransactionsByHash = new Map(
    pendingTransactions
      .map((tx) => [tx.hash, tx] as const)
      .filter(([hash]) => hash),
  );

  // Merge transaction if exists
  const mergedTransactions = transactions.map((transaction) => {
    const matchedTransaction = pendingTransactionsByHash.get(transaction.hash);

    if (matchedTransaction) {
      // Transaction exists in both
      return {
        ...transaction,
        pendingTransactionMeta: matchedTransaction.pendingTransactionMeta,
        isError: matchedTransaction.isError,
      };
    }

    return transaction;
  });

  // Find pending-only transactions (pending/recent that aren't in API yet)
  const pendingOnlyTransactions = pendingTransactions.filter((tx) => {
    // Check if this pending tx was already merged with an API tx
    return !transactions.some((apiTx) => apiTx.hash === tx.hash);
  });

  // Pending-only first (most recent), then merged transactions
  return [...pendingOnlyTransactions, ...mergedTransactions];
}

export function mapChainInfo(chainId: number) {
  const chainIdHex = `0x${chainId.toString(16)}`;

  const chainImageUrl = CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[chainIdHex];
  const chainName = NETWORK_TO_NAME_MAP[chainIdHex];

  return {
    chainImageUrl,
    chainName,
  };
}

function extractTransferAmountAndSymbol(
  transaction: TransactionViewModel,
  nativeCurrency?: string,
): { amount: number; symbol: string | undefined } {
  const { value, valueTransfers, category } = transaction;

  // For swaps, prioritize showing native currency (what you spent) over tokens received
  // Ported from useTransactionDisplayData - swaps show source token/amount by default
  const isSwap = category === TransactionGroupCategory.swap;
  if (isSwap && value && value !== '0' && value !== '0x0') {
    let numericValue: number;
    if (value.startsWith('0x')) {
      const bigIntValue = BigInt(value);
      numericValue = Number(bigIntValue) / 1e18;
    } else {
      numericValue = parseFloat(value) / 1e18;
    }
    return {
      amount: numericValue,
      symbol: nativeCurrency,
    };
  }

  // Token transfer
  // Ported from useTransactionDisplayData - uses tokenDisplayValue/transferInformation
  if (
    valueTransfers &&
    valueTransfers.length > 0 &&
    valueTransfers[0].contractAddress
  ) {
    const transfer = valueTransfers[0];
    const amt =
      parseFloat(transfer.amount) / Math.pow(10, transfer.decimal ?? 18);
    return {
      amount: amt,
      symbol: transfer.symbol || '',
    };
  }

  // Native currency transfer
  // Ported from useTransactionDisplayData - uses primaryValue (txParams.value)
  if (value && value !== '0' && value !== '0x0') {
    let numericValue: number;
    if (value.startsWith('0x')) {
      const bigIntValue = BigInt(value);
      numericValue = Number(bigIntValue) / 1e18;
    } else {
      numericValue = parseFloat(value) / 1e18;
    }
    return {
      amount: numericValue,
      symbol: nativeCurrency,
    };
  }

  return { amount: 0, symbol: '' };
}

export function extractAmountAndSymbol(
  transaction: TransactionViewModel,
  selectedAddress: string | undefined,
  nativeCurrency?: string,
) {
  const { from, to, valueTransfers, category, value } = transaction;

  // Check if this is a simple transfer (send or receive)
  // Ported from useTransactionDisplayData logic
  const isTransfer =
    category === TransactionGroupCategory.send ||
    category === TransactionGroupCategory.receive;

  // For simple transfers, check if address is involved and extract amount
  if (isTransfer) {
    if (
      valueTransfers &&
      valueTransfers.length > 0 &&
      valueTransfers[0].contractAddress
    ) {
      // Token transfer - check if we're sender or recipient of the token
      const transfer = valueTransfers[0];
      const isTransferFrom =
        transfer.from &&
        selectedAddress &&
        isEqualCaseInsensitive(transfer.from, selectedAddress);
      const isTransferTo =
        transfer.to &&
        selectedAddress &&
        isEqualCaseInsensitive(transfer.to, selectedAddress);

      if (!isTransferFrom && !isTransferTo) {
        return { amount: 0, symbol: '' };
      }
    } else {
      // Native transfer - check if we're sender or recipient of the transaction
      const isFrom =
        from &&
        selectedAddress &&
        isEqualCaseInsensitive(from, selectedAddress);
      const isTo =
        to && selectedAddress && isEqualCaseInsensitive(to, selectedAddress);

      if (!isFrom && !isTo) {
        return { amount: 0, symbol: '' };
      }
    }

    // Can this be done from the API side?
    const { amount, symbol } = extractTransferAmountAndSymbol(
      transaction,
      nativeCurrency,
    );

    if (amount === 0) {
      return { amount: 0, symbol: '' };
    }

    // Apply sign based on direction
    // Default prefix is '-' (send), changed to '+' for receives (V1 line 143)
    return {
      amount: category === TransactionGroupCategory.send ? -amount : amount,
      symbol,
    };
  }

  // For swaps and other types, prioritize showing native currency (what you spent)
  // Ported from useTransactionDisplayData - swaps show source token/amount by default
  if (value && value !== '0' && value !== '0x0') {
    let numericValue: number;
    if (value.startsWith('0x')) {
      const bigIntValue = BigInt(value);
      numericValue = Number(bigIntValue) / 1e18;
    } else {
      numericValue = parseFloat(value) / 1e18;
    }
    return {
      amount: -numericValue,
      symbol: nativeCurrency,
    };
  }

  // Fallback to empty
  return { amount: 0, symbol: '' };
}

export function calculateFiatFromMarketRates(
  transaction: TransactionViewModel,
  marketRates: Record<number, Record<string, number>>,
): number | null {
  const { chainId, valueTransfers, value } = transaction;

  // Get token address - either from valueTransfers or native token
  const tokenAddress =
    valueTransfers?.[0]?.contractAddress?.toLowerCase() ??
    (value && value !== '0' && value !== '0x0'
      ? NATIVE_TOKEN_ADDRESS
      : undefined);

  if (!tokenAddress || !marketRates[chainId]?.[tokenAddress]) {
    return null;
  }

  // Extract amount to calculate fiat value
  let amount = 0;
  if (
    valueTransfers &&
    valueTransfers.length > 0 &&
    valueTransfers[0].contractAddress
  ) {
    const transfer = valueTransfers[0];
    amount = parseFloat(transfer.amount) / Math.pow(10, transfer.decimal ?? 18);
  } else if (value && value !== '0' && value !== '0x0') {
    const numericValue = value.startsWith('0x')
      ? Number(BigInt(value)) / 1e18
      : parseFloat(value) / 1e18;
    amount = numericValue;
  }

  if (amount === 0) {
    return null;
  }

  return Math.abs(amount) * marketRates[chainId][tokenAddress];
}
