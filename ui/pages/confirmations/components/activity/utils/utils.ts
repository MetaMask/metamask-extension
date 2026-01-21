import type {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';

/**
 * Checks if a transaction has a specific type or if any of its nested transactions have that type.
 *
 * @param transactionMeta - The transaction metadata to check.
 * @param types - The transaction types to check for.
 * @returns True if the transaction or any nested transaction matches one of the types.
 */
export function hasTransactionType(
  transactionMeta: TransactionMeta | undefined,
  types: TransactionType[],
): boolean {
  const { nestedTransactions, type } = transactionMeta ?? {};

  if (types.includes(type as TransactionType)) {
    return true;
  }

  return (
    nestedTransactions?.some((tx) =>
      types.includes(tx.type as TransactionType),
    ) ?? false
  );
}

/**
 * Formats a timestamp into a date and time string.
 *
 * @param timestamp - The timestamp in milliseconds.
 * @param locale - The locale for formatting.
 * @returns Object containing formatted time and date strings.
 */
export function formatTransactionDateTime(
  timestamp: number,
  locale = 'en-US',
): { time: string; date: string } {
  const dateObj = new Date(timestamp);

  const time = new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(dateObj);

  const month = new Intl.DateTimeFormat(locale, {
    month: 'short',
  }).format(dateObj);

  const date = `${month} ${dateObj.getDate()}, ${dateObj.getFullYear()}`;

  return { time, date };
}
