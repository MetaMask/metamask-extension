import { renderHook } from '@testing-library/react-hooks';
import { TransactionStatus } from '@metamask/transaction-controller';
import type { PerpsWithdrawToastTransaction } from '../../../selectors/toast';
import { usePerpsWithdrawTransactionToasts } from './usePerpsWithdrawTransactionToasts';

const mockUseSelector = jest.fn();
const mockShowPendingToast = jest.fn();
const mockShowSuccessToast = jest.fn();
const mockShowFailedToast = jest.fn();
const mockDismissToast = jest.fn();

jest.mock('react-redux', () => ({
  useSelector: (selector: unknown) => mockUseSelector(selector),
}));

jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string, args?: string[]) =>
    args?.length ? `${key}:${args.join('|')}` : key,
}));

jest.mock('./shared', () => ({
  dismissToast: (...args: Parameters<typeof mockDismissToast>) =>
    mockDismissToast(...args),
  showPendingToast: (...args: Parameters<typeof mockShowPendingToast>) =>
    mockShowPendingToast(...args),
  showSuccessToast: (...args: Parameters<typeof mockShowSuccessToast>) =>
    mockShowSuccessToast(...args),
  showFailedToast: (...args: Parameters<typeof mockShowFailedToast>) =>
    mockShowFailedToast(...args),
}));

describe('usePerpsWithdrawTransactionToasts', () => {
  let mockTransactions: PerpsWithdrawToastTransaction[];

  beforeEach(() => {
    jest.clearAllMocks();
    mockTransactions = [];
    mockUseSelector.mockImplementation(() => mockTransactions);
  });

  it('does not toast existing transactions on initial mount', () => {
    mockTransactions = [
      {
        id: 'tx-1',
        isPostQuote: true,
        status: TransactionStatus.confirmed,
        targetFiat: 20.73,
        tokenSymbol: 'BNB',
      },
    ];

    renderHook(() => usePerpsWithdrawTransactionToasts());

    expect(mockShowSuccessToast).not.toHaveBeenCalled();
  });

  it('shows a pending toast when a withdraw is approved', () => {
    mockTransactions = [
      {
        id: 'tx-1',
        isPostQuote: true,
        status: TransactionStatus.unapproved,
        targetFiat: 20.73,
        tokenSymbol: 'BNB',
      },
    ];

    const { rerender } = renderHook(() => usePerpsWithdrawTransactionToasts());

    mockTransactions = [
      {
        id: 'tx-1',
        isPostQuote: true,
        status: TransactionStatus.approved,
        targetFiat: 20.73,
        tokenSymbol: 'BNB',
      },
    ];
    rerender();

    expect(mockShowPendingToast).toHaveBeenCalledWith('perps-withdraw-tx-1', {
      title: 'perpsWithdrawPostQuoteToastPendingTitle',
      description: 'perpsWithdrawPostQuoteToastPendingDescription',
      dataTestId: 'perps-withdraw-pending-toast',
    });
  });

  it('shows a pending toast when a new withdraw first appears as submitted', () => {
    const { rerender } = renderHook(() => usePerpsWithdrawTransactionToasts());

    mockTransactions = [
      {
        id: 'tx-1',
        isPostQuote: true,
        status: TransactionStatus.submitted,
        targetFiat: 20.73,
        tokenSymbol: 'BNB',
      },
    ];
    rerender();

    expect(mockShowPendingToast).toHaveBeenCalledWith(
      'perps-withdraw-tx-1',
      expect.objectContaining({
        title: 'perpsWithdrawPostQuoteToastPendingTitle',
      }),
    );
  });

  it('does not duplicate the pending toast as the transaction continues submitting', () => {
    mockTransactions = [
      {
        id: 'tx-1',
        isPostQuote: true,
        status: TransactionStatus.unapproved,
        targetFiat: 20.73,
        tokenSymbol: 'BNB',
      },
    ];

    const { rerender } = renderHook(() => usePerpsWithdrawTransactionToasts());

    mockTransactions = [
      {
        id: 'tx-1',
        isPostQuote: true,
        status: TransactionStatus.approved,
        targetFiat: 20.73,
        tokenSymbol: 'BNB',
      },
    ];
    rerender();

    mockTransactions = [
      {
        id: 'tx-1',
        isPostQuote: true,
        status: TransactionStatus.submitted,
        targetFiat: 20.73,
        tokenSymbol: 'BNB',
      },
    ];
    rerender();

    expect(mockShowPendingToast).toHaveBeenCalledTimes(1);
  });

  it('dismisses the pending toast when a withdraw disappears before resolving', () => {
    const { rerender } = renderHook(() => usePerpsWithdrawTransactionToasts());

    mockTransactions = [
      {
        id: 'tx-1',
        isPostQuote: true,
        status: TransactionStatus.submitted,
        targetFiat: 20.73,
        tokenSymbol: 'BNB',
      },
    ];
    rerender();

    mockTransactions = [];
    rerender();

    expect(mockDismissToast).toHaveBeenCalledWith('perps-withdraw-tx-1');
  });

  it('shows a success toast with the post-quote amount and token symbol', () => {
    mockTransactions = [
      {
        id: 'tx-1',
        isPostQuote: true,
        status: TransactionStatus.approved,
        targetFiat: 20.73,
        tokenSymbol: 'BNB',
      },
    ];

    const { rerender } = renderHook(() => usePerpsWithdrawTransactionToasts());

    mockTransactions = [
      {
        id: 'tx-1',
        isPostQuote: true,
        status: TransactionStatus.confirmed,
        targetFiat: 20.73,
        tokenSymbol: 'BNB',
      },
    ];
    rerender();

    expect(mockShowSuccessToast).toHaveBeenCalledWith('perps-withdraw-tx-1', {
      title: 'perpsWithdrawPostQuoteToastSuccessTitle',
      description: 'perpsWithdrawPostQuoteToastSuccessDescription:$20.73|BNB',
      dataTestId: 'perps-withdraw-success-toast',
    });
  });

  it('shows the generic success description when post-quote details are missing', () => {
    mockTransactions = [
      {
        id: 'tx-1',
        isPostQuote: false,
        status: TransactionStatus.approved,
        tokenSymbol: 'USDC',
      },
    ];

    const { rerender } = renderHook(() => usePerpsWithdrawTransactionToasts());

    mockTransactions = [
      {
        id: 'tx-1',
        isPostQuote: false,
        status: TransactionStatus.confirmed,
        tokenSymbol: 'USDC',
      },
    ];
    rerender();

    expect(mockShowSuccessToast).toHaveBeenCalledWith(
      'perps-withdraw-tx-1',
      expect.objectContaining({
        description: 'perpsWithdrawPostQuoteToastSuccessGenericDescription',
      }),
    );
  });

  it('shows a failed toast when a withdraw fails', () => {
    mockTransactions = [
      {
        id: 'tx-1',
        isPostQuote: true,
        status: TransactionStatus.approved,
        targetFiat: 20.73,
        tokenSymbol: 'BNB',
      },
    ];

    const { rerender } = renderHook(() => usePerpsWithdrawTransactionToasts());

    mockTransactions = [
      {
        id: 'tx-1',
        isPostQuote: true,
        status: TransactionStatus.failed,
        targetFiat: 20.73,
        tokenSymbol: 'BNB',
      },
    ];
    rerender();

    expect(mockShowFailedToast).toHaveBeenCalledWith('perps-withdraw-tx-1', {
      title: 'perpsWithdrawPostQuoteToastErrorTitle',
      description: 'perpsWithdrawPostQuoteToastErrorDescription',
      dataTestId: 'perps-withdraw-failed-toast',
    });
  });
});
