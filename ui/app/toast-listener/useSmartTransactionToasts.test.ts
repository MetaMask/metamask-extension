import { renderHook } from '@testing-library/react-hooks';
import { SmartTransactionStatuses } from '@metamask/smart-transactions-controller';
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
