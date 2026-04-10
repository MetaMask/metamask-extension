import { TransactionType } from '@metamask/transaction-controller';
import { useTransactionDisplay } from './transaction-display';

jest.mock('../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string, params?: string[]) =>
    params?.length ? `${key}(${params.join(',')})` : key,
}));

describe('useTransactionDisplay', () => {
  describe('simpleSend', () => {
    it('returns the send pending key with ticker param when pending', () => {
      const { title } = useTransactionDisplay({
        status: 'pending',
        transactionType: TransactionType.simpleSend,
        params: ['ETH'],
      });
      expect(title).toBe('toastSendPending(ETH)');
    });

    it('returns the send confirmed key with ticker param when successful', () => {
      const { title } = useTransactionDisplay({
        status: 'success',
        transactionType: TransactionType.simpleSend,
        params: ['ETH'],
      });
      expect(title).toBe('toastSendConfirmed(ETH)');
    });

    it('returns the send failed key when failed', () => {
      const { title } = useTransactionDisplay({
        status: 'failed',
        transactionType: TransactionType.simpleSend,
        params: ['ETH'],
      });
      expect(title).toBe('toastSendFailed(ETH)');
    });
  });

  describe('swap', () => {
    it('returns the swap pending key when pending', () => {
      const { title } = useTransactionDisplay({
        status: 'pending',
        transactionType: TransactionType.swap,
      });
      expect(title).toBe('toastSwapPending');
    });

    it('returns the swap confirmed key when successful', () => {
      const { title } = useTransactionDisplay({
        status: 'success',
        transactionType: TransactionType.swap,
      });
      expect(title).toBe('toastSwapConfirmed');
    });

    it('returns the swap failed key when failed', () => {
      const { title } = useTransactionDisplay({
        status: 'failed',
        transactionType: TransactionType.swap,
      });
      expect(title).toBe('toastSwapFailed');
    });
  });

  describe('fallback for unmapped types', () => {
    it('returns the generic submitted key when pending', () => {
      const { title } = useTransactionDisplay({
        status: 'pending',
        transactionType: TransactionType.contractInteraction,
      });
      expect(title).toBe('transactionSubmitted');
    });

    it('returns the generic confirmed key when successful', () => {
      const { title } = useTransactionDisplay({
        status: 'success',
        transactionType: TransactionType.contractInteraction,
      });
      expect(title).toBe('transactionConfirmed');
    });

    it('returns the generic failed key when failed', () => {
      const { title } = useTransactionDisplay({
        status: 'failed',
        transactionType: TransactionType.contractInteraction,
      });
      expect(title).toBe('transactionFailed');
    });

    it('returns generic keys when no transactionType is provided', () => {
      const { title } = useTransactionDisplay({ status: 'pending' });
      expect(title).toBe('transactionSubmitted');
    });
  });
});
