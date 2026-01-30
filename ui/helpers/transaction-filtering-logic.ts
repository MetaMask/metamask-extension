import type { InfiniteData } from '@tanstack/react-query';
import type {
  DateGroupedTransactions,
  FlattenedItem,
  TransactionForDisplay,
  V4MultiAccountTransactionsResponse,
} from './types';
import { formatDateWithYearContext } from './utils/util';

export function groupTransactionsByDate(transactions: TransactionForDisplay[]) {
  const groupedMap = new Map<string, DateGroupedTransactions>();

  transactions.forEach((transaction) => {
    // Parse ISO string to milliseconds
    const timestamp = new Date(transaction.timestamp).getTime();
    const date = formatDateWithYearContext(timestamp, 'MMM d, y', 'MMM d');

    if (!groupedMap.has(date)) {
      groupedMap.set(date, {
        date,
        dateMillis: timestamp,
        transactions: [],
      });
    }

    groupedMap.get(date)?.transactions.push(transaction);
  });

  // Convert map to array and sort by date (newest first)
  const grouped = Array.from(groupedMap.values());
  grouped.sort((a, b) => b.dateMillis - a.dateMillis);

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

export function flattenGroupedTransactions(
  groupedTransactions: DateGroupedTransactions[],
) {
  const flattened: FlattenedItem[] = [];

  groupedTransactions.forEach((group) => {
    // Add date header
    flattened.push({
      type: 'date-header',
      date: group.date,
      dateMillis: group.dateMillis,
    });

    // Add transaction items
    group.transactions.forEach((transaction) => {
      flattened.push({
        type: 'transaction',
        data: transaction,
        id: transaction.hash, // Use hash as unique ID
      });
    });
  });

  return flattened;
}

// These filtering logic should be done server side

export function filterTransactions(accountIds: string[]) {
  return (
    data: InfiniteData<V4MultiAccountTransactionsResponse>,
  ): InfiniteData<V4MultiAccountTransactionsResponse> => ({
    pages: data.pages.map((page) => ({
      ...page,
      data: page.data.filter((tx) => {
        // Filter spam tokens
        if (tx.transactionType === 'SPAM_TOKEN_TRANSFER') {
          return false;
        }

        // Filter unsolicited token airdrops (user didn't initiate)
        const accountAddress = accountIds[0]?.toLowerCase();
        const userInitiated = tx.from.toLowerCase() === accountAddress;

        // Keep transactions you initiated
        if (userInitiated) {
          return true;
        }

        // Keep native token receives (ETH, MATIC, POL, etc - not spam)
        // Check for any native value transfer, even tiny amounts
        const hasValue = tx.value && tx.value !== '0' && tx.value !== '0x0';
        if (hasValue) {
          return true; // Keep all native token transfers
        }

        // Keep token transfers where you're the recipient
        const hasTokenTransfer =
          tx.valueTransfers && tx.valueTransfers.length > 0;
        if (hasTokenTransfer) {
          // Check if any transfer is to this account
          const isRecipient = tx.valueTransfers?.some(
            (transfer) => transfer.to?.toLowerCase() === accountAddress,
          );
          if (isRecipient) {
            return true;
          }
        }

        // Filter out token airdrops you didn't initiate (likely spam)
        return false;
      }),
    })),
    pageParams: data.pageParams,
  });
}
