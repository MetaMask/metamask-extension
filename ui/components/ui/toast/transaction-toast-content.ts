export type TransactionToastVariant = 'pending' | 'success' | 'failed';

export type TransactionToastContent = {
  title: string;
  description: string;
};

const TOAST_CONTENT: Record<TransactionToastVariant, TransactionToastContent> =
  {
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
 * Returns title and description for a transaction toast notification.
 *
 * @param variant - The transaction status variant.
 * @returns The toast content with title and description.
 */
export function getTransactionToastContent(
  variant: TransactionToastVariant,
): TransactionToastContent {
  return TOAST_CONTENT[variant];
}
