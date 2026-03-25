export type TransactionStatus = 'pending' | 'success' | 'failed';

type TransactionDisplayData = {
  title: string;
  description: string;
};

const TRANSACTION_DISPLAY_DATA: Record<
  TransactionStatus,
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

export function getTransactionDisplayData(status: TransactionStatus) {
  return TRANSACTION_DISPLAY_DATA[status];
}
