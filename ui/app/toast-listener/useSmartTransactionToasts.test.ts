import { renderHook } from '@testing-library/react-hooks';
import { SmartTransactionStatuses } from '@metamask/smart-transactions-controller';
import { TransactionStatus } from '@metamask/transaction-controller';
import { useSmartTransactionToasts } from './useSmartTransactionToasts';

const mockDispatch = jest.fn();
const mockUseSelector = jest.fn();
const mockResolvePendingApproval = jest.fn(
  (approvalId: string, value: boolean) => ({
    type: 'resolvePendingApproval',
    approvalId,
    value,
  }),
);
const mockShowPendingToast = jest.fn();
const mockShowSuccessToast = jest.fn();
const mockShowFailedToast = jest.fn();

jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector: unknown) => mockUseSelector(selector),
}));

jest.mock('../../store/actions', () => ({
  resolvePendingApproval: (...args: [string, boolean]) =>
    mockResolvePendingApproval(...args),
}));

jest.mock('../../selectors/toast', () => ({
  selectSmartTransactions: jest.fn(),
}));

jest.mock('./shared', () => ({
  showPendingToast: (...args: [string]) => mockShowPendingToast(...args),
  showSuccessToast: (...args: [string]) => mockShowSuccessToast(...args),
  showFailedToast: (...args: [string]) => mockShowFailedToast(...args),
}));

describe('useSmartTransactionToasts', () => {
  let mockTransactions: {
    approvalId: string;
    txId: string;
    smartTransactionStatus: string | undefined;
    evmStatus?: string | undefined;
  }[];

  beforeEach(() => {
    jest.clearAllMocks();
    mockTransactions = [];
    mockUseSelector.mockImplementation(() => mockTransactions);
  });

  it('shows a pending toast for a new pending smart transaction', () => {
    mockTransactions = [
      {
        approvalId: 'approval-1',
        txId: 'tx-1',
        smartTransactionStatus: SmartTransactionStatuses.PENDING,
      },
    ];

    renderHook(() => useSmartTransactionToasts());

    expect(mockShowPendingToast).toHaveBeenCalledWith('stx-tx-1');
  });

  it('shows a success toast and resolves the approval when a pending transaction succeeds', () => {
    mockTransactions = [
      {
        approvalId: 'approval-1',
        txId: 'tx-1',
        smartTransactionStatus: SmartTransactionStatuses.PENDING,
      },
    ];

    const { rerender } = renderHook(() => useSmartTransactionToasts());

    mockTransactions = [
      {
        approvalId: 'approval-1',
        txId: 'tx-1',
        smartTransactionStatus: SmartTransactionStatuses.SUCCESS,
      },
    ];

    rerender();

    expect(mockShowSuccessToast).toHaveBeenCalledWith('stx-tx-1');
    expect(mockResolvePendingApproval).toHaveBeenCalledWith('approval-1', true);
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'resolvePendingApproval',
      approvalId: 'approval-1',
      value: true,
    });
  });

  it('shows a failed toast and resolves the approval when a pending transaction fails', () => {
    mockTransactions = [
      {
        approvalId: 'approval-1',
        txId: 'tx-1',
        smartTransactionStatus: SmartTransactionStatuses.PENDING,
      },
    ];

    const { rerender } = renderHook(() => useSmartTransactionToasts());

    mockTransactions = [
      {
        approvalId: 'approval-1',
        txId: 'tx-1',
        smartTransactionStatus: SmartTransactionStatuses.REVERTED,
      },
    ];

    rerender();

    expect(mockShowFailedToast).toHaveBeenCalledWith('stx-tx-1');
    expect(mockResolvePendingApproval).toHaveBeenCalledWith('approval-1', true);
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'resolvePendingApproval',
      approvalId: 'approval-1',
      value: true,
    });
  });

  it('shows a failed toast when the user cancels a pending STX from the Activity tab', () => {
    mockTransactions = [
      {
        approvalId: 'approval-1',
        txId: 'tx-1',
        smartTransactionStatus: SmartTransactionStatuses.PENDING,
        evmStatus: TransactionStatus.submitted,
      },
    ];

    const { rerender } = renderHook(() => useSmartTransactionToasts());

    expect(mockShowPendingToast).toHaveBeenCalledWith('stx-tx-1');

    mockTransactions = [
      {
        approvalId: 'approval-1',
        txId: 'tx-1',
        smartTransactionStatus: SmartTransactionStatuses.PENDING,
        evmStatus: TransactionStatus.dropped,
      },
    ];

    rerender();

    expect(mockShowFailedToast).toHaveBeenCalledWith('stx-tx-1');
    expect(mockResolvePendingApproval).toHaveBeenCalledWith('approval-1', true);
  });

  // @ts-expect-error This function is missing from the Mocha type definitions
  it.each([
    TransactionStatus.failed,
    TransactionStatus.rejected,
    TransactionStatus.cancelled,
  ])(
    'shows a failed toast when the underlying EVM tx enters terminal status %s',
    (terminalStatus: TransactionStatus) => {
      mockTransactions = [
        {
          approvalId: 'approval-1',
          txId: 'tx-1',
          smartTransactionStatus: SmartTransactionStatuses.PENDING,
          evmStatus: TransactionStatus.submitted,
        },
      ];

      const { rerender } = renderHook(() => useSmartTransactionToasts());

      mockTransactions = [
        {
          approvalId: 'approval-1',
          txId: 'tx-1',
          smartTransactionStatus: SmartTransactionStatuses.PENDING,
          evmStatus: terminalStatus,
        },
      ];

      rerender();

      expect(mockShowFailedToast).toHaveBeenCalledWith('stx-tx-1');
      expect(mockResolvePendingApproval).toHaveBeenCalledWith(
        'approval-1',
        true,
      );
    },
  );

  it('stays pending during Speed Up then shows success when the replacement confirms', () => {
    mockTransactions = [
      {
        approvalId: 'approval-1',
        txId: 'tx-1',
        smartTransactionStatus: SmartTransactionStatuses.PENDING,
        evmStatus: TransactionStatus.submitted,
      },
    ];

    const { rerender } = renderHook(() => useSmartTransactionToasts());

    expect(mockShowPendingToast).toHaveBeenCalledWith('stx-tx-1');

    // Speed Up in flight: selector is following the retry replacement, which is still submitted.
    mockTransactions = [
      {
        approvalId: 'approval-1',
        txId: 'tx-1',
        smartTransactionStatus: SmartTransactionStatuses.PENDING,
        evmStatus: TransactionStatus.submitted,
      },
    ];

    rerender();

    expect(mockShowFailedToast).not.toHaveBeenCalled();
    expect(mockShowSuccessToast).not.toHaveBeenCalled();

    mockTransactions = [
      {
        approvalId: 'approval-1',
        txId: 'tx-1',
        smartTransactionStatus: SmartTransactionStatuses.PENDING,
        evmStatus: TransactionStatus.confirmed,
      },
    ];

    rerender();

    expect(mockShowSuccessToast).toHaveBeenCalledWith('stx-tx-1');
    expect(mockResolvePendingApproval).toHaveBeenCalledWith('approval-1', true);
  });

  it('shows a failed toast and resolves the approval when a pending transaction becomes unknown', () => {
    mockTransactions = [
      {
        approvalId: 'approval-1',
        txId: 'tx-1',
        smartTransactionStatus: SmartTransactionStatuses.PENDING,
      },
    ];

    const { rerender } = renderHook(() => useSmartTransactionToasts());

    mockTransactions = [
      {
        approvalId: 'approval-1',
        txId: 'tx-1',
        smartTransactionStatus: SmartTransactionStatuses.UNKNOWN,
      },
    ];

    rerender();

    expect(mockShowFailedToast).toHaveBeenCalledWith('stx-tx-1');
    expect(mockResolvePendingApproval).toHaveBeenCalledWith('approval-1', true);
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'resolvePendingApproval',
      approvalId: 'approval-1',
      value: true,
    });
  });
});
