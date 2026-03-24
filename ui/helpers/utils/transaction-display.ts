export type TransactionStatusVariant = 'pending' | 'success' | 'failed';

export type TransactionDisplayData = {
  title: string;
  description: string;
};

const TRANSACTION_DISPLAY_DATA: Record<
  TransactionStatusVariant,
  TransactionDisplayData
> = {
  pending: {
    title: 'Transaction submitted',
    description: '',
  },
  success: {
    title: 'Transaction confirmed',
    description: '',
  },
  failed: {
    title: 'Transaction failed',
    description: '',
  },
};

/**
 * Returns display title and description for a transaction status.
 *
 * @param variant - The transaction status variant.
 * @returns The display data with title and description.
 */
export function getTransactionDisplayData(variant: TransactionStatusVariant) {
  return TRANSACTION_DISPLAY_DATA[variant];
}
