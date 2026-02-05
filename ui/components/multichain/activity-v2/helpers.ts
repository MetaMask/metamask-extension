import type {
  DateGroupedTransactions,
  FlattenedItem,
  TransactionViewModel,
} from '../../../../shared/acme-controller/types';
import { TransactionType } from '@metamask/transaction-controller';
import {
  TransactionGroupCategory,
  NATIVE_TOKEN_ADDRESS,
} from '../../../../shared/constants/transaction';
import {
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  NETWORK_TO_NAME_MAP,
} from '../../../../shared/constants/network';
import { isEqualCaseInsensitive } from '../../../../shared/modules/string-utils';
import { mapTransactionTypeToCategory } from '../../app/transaction-list-item/helpers';
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

// Can this be done from the API side?
export function inferTransactionTypeFromApi(transaction: TransactionViewModel) {
  const { to, methodId, value, valueTransfers, transactionType } = transaction;

  // Use API's transactionType for known types
  if (transactionType === 'ERC_20_APPROVE') {
    return TransactionType.tokenMethodApprove;
  }
  if (transactionType === 'ERC_20_TRANSFER') {
    return TransactionType.tokenMethodTransfer;
  }
  if (transactionType === 'METAMASK_V1_EXCHANGE') {
    return TransactionType.swap;
  }
  if (transactionType === 'METAMASK_BRIDGE_V2_BRIDGE_OUT') {
    return TransactionType.bridge;
  }

  // Token transfers with valueTransfers
  if (valueTransfers && valueTransfers.length > 0) {
    const transfer = valueTransfers[0];
    if (transfer.transferType === 'erc20') {
      return TransactionType.tokenMethodTransfer;
    }
    if (transfer.transferType === 'erc721') {
      return TransactionType.tokenMethodTransferFrom;
    }
    if (transfer.transferType === 'erc1155') {
      return TransactionType.tokenMethodSafeTransferFrom;
    }
  }

  if (!to) {
    return TransactionType.deployContract;
  }

  // Check if sending native currency (ETH, POL, etc.)
  const hasNativeValue =
    value && value !== '0x0' && value !== '0x' && BigInt(value) > 0;

  if (hasNativeValue && (!valueTransfers || valueTransfers.length === 0)) {
    return TransactionType.simpleSend;
  }

  // Has contract interaction data (methodId)
  if (methodId && methodId !== '0x' && methodId !== null) {
    return TransactionType.contractInteraction;
  }

  // TODO: Default
  return TransactionType.simpleSend;
}

// Can this be done from the API side?
export function extractCategory(
  transaction: TransactionViewModel,
  accountAddress: string,
) {
  const { to, from } = transaction;

  // Check if this is an incoming transaction
  const isReceive = isEqualCaseInsensitive(to, accountAddress);
  const isSend = isEqualCaseInsensitive(from, accountAddress);

  // Infer the transaction type from API data
  let transactionType = inferTransactionTypeFromApi(transaction);

  // If receiving, override to incoming type
  if (isReceive && !isSend) {
    transactionType = TransactionType.incoming;
  }

  // Use V1's categorization logic
  const category = mapTransactionTypeToCategory(transactionType);

  return { category: category || TransactionGroupCategory.interaction };
}

// Can this be done from the API side?
export function extractAmountAndSymbol(
  transaction: TransactionViewModel,
  selectedAddress: string | undefined,
  nativeCurrency?: string,
) {
  const { value, valueTransfers, from } = transaction;
  const isSend =
    from && selectedAddress && isEqualCaseInsensitive(from, selectedAddress);

  // Token transfer (only if valid transfer data exists)
  if (
    valueTransfers &&
    valueTransfers.length > 0 &&
    valueTransfers[0].contractAddress
  ) {
    const transfer = valueTransfers[0];
    const amt =
      parseFloat(transfer.amount) / Math.pow(10, transfer.decimal ?? 18);
    const isTokenSend =
      transfer.from &&
      selectedAddress &&
      isEqualCaseInsensitive(transfer.from, selectedAddress);
    return {
      amount: isTokenSend ? -amt : amt,
      symbol: transfer.symbol || '',
    };
  }

  // Native currency
  if (value && value !== '0' && value !== '0x0') {
    // Use string manipulation to avoid precision loss with very small amounts
    let numericValue: number;
    if (value.startsWith('0x')) {
      // Convert hex to decimal, handling very small values
      const bigIntValue = BigInt(value);
      numericValue = Number(bigIntValue) / 1e18;
    } else {
      numericValue = parseFloat(value) / 1e18;
    }
    return {
      amount: isSend ? -numericValue : numericValue,
      symbol: nativeCurrency,
    };
  }

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
