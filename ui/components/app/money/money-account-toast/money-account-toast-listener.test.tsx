import React from 'react';
import { render, renderHook, screen } from '@testing-library/react';
import {
  TransactionStatus,
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { clearToastPhase } from '../../toast-listener/toast-lifecycle';
import {
  clearMoneyAccountDepositIntent,
  getMoneyAccountDepositIntent,
  setMoneyAccountDepositIntent,
} from '../../../../helpers/money/deposit-intent';
import {
  isKnownMoneyBatchChild,
  isMoneyBatchInFlight,
  registerMoneyBatchTransaction,
  resetMoneyBatchRegistry,
} from '../../../../helpers/money/money-batch-registry';
import { useMoneyAccountToasts } from './money-account-toast-listener';

const EVENT = 'TransactionController:transactionStatusUpdated';

const mockSubscribe = jest.fn();
const mockUnsubscribe = jest.fn();
const mockToastLoading = jest.fn();
const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();
const mockToastDismiss = jest.fn();
const mockUseMoneyAccountToastLabel = jest.fn();
let mockTransactions: TransactionMeta[] = [];

jest.mock('../../../../hooks/useMessenger', () => ({
  useMessenger: () => ({
    subscribe: mockSubscribe,
    unsubscribe: mockUnsubscribe,
  }),
}));

jest.mock('react-redux', () => ({
  useStore: () => ({ getState: () => ({}) }),
}));

jest.mock('../../../../selectors/transactionController', () => ({
  selectTransactions: () => mockTransactions,
}));

jest.mock('../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

jest.mock('../../../ui/toast/toast', () => ({
  toast: {
    loading: (...args: unknown[]) => mockToastLoading(...args),
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
    dismiss: (...args: unknown[]) => mockToastDismiss(...args),
  },
  ToastContent: ({
    title,
    description,
    dataTestId,
  }: {
    title: string;
    description?: string;
    dataTestId?: string;
  }) => (
    <div data-testid={dataTestId}>
      <p>{title}</p>
      {description ? <p>{description}</p> : null}
    </div>
  ),
}));

jest.mock('react-router-dom', () => ({
  Link: ({
    to,
    'aria-label': ariaLabel,
  }: {
    to: string;
    'aria-label': string;
  }) => (
    <a href={to} aria-label={ariaLabel}>
      link
    </a>
  ),
}));

jest.mock('./useMoneyAccountToastLabel', () => ({
  useMoneyAccountToastLabel: (...args: unknown[]) =>
    mockUseMoneyAccountToastLabel(...args),
}));

function createMoneyDeposit(
  overrides: Partial<TransactionMeta> & Pick<TransactionMeta, 'id' | 'status'>,
): TransactionMeta {
  return {
    chainId: '0xe708',
    networkClientId: 'network-1',
    time: 1,
    txParams: { from: '0x0' },
    type: TransactionType.batch,
    nestedTransactions: [{ type: TransactionType.moneyAccountDeposit }],
    ...overrides,
  };
}

function mountHook() {
  let handler: ((raw: unknown) => void) | undefined;
  mockSubscribe.mockImplementation((event, subscribed) => {
    if (event === EVENT) {
      handler = subscribed;
    }
  });
  const { unmount } = renderHook(() => useMoneyAccountToasts());
  if (!handler) {
    throw new Error('handler not subscribed');
  }
  return { emit: handler, unmount };
}

describe('useMoneyAccountToasts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseMoneyAccountToastLabel.mockReturnValue(undefined);
    mockTransactions = [];
    resetMoneyBatchRegistry();
    [
      'approved-1',
      'lifecycle-1',
      'no-hash',
      'labelled',
      'sped-up',
      'cancelled',
      'intent-1',
      'registry-1',
      'registry-orphan',
    ].forEach(clearToastPhase);
    clearMoneyAccountDepositIntent('0xbatch');
  });

  it('subscribes on mount and unsubscribes on unmount', () => {
    const { unmount } = mountHook();
    expect(mockSubscribe).toHaveBeenCalledWith(EVENT, expect.any(Function));

    unmount();
    expect(mockUnsubscribe).toHaveBeenCalledWith(EVENT, expect.any(Function));
  });

  it('ignores transactions that are not money account batches', () => {
    const { emit } = mountHook();

    emit({
      transactionMeta: createMoneyDeposit({
        id: 'other',
        status: TransactionStatus.submitted,
        type: TransactionType.simpleSend,
        nestedTransactions: undefined,
      }),
    });

    expect(mockToastLoading).not.toHaveBeenCalled();
  });

  it('shows a pending toast as soon as the batch is approved', () => {
    const { emit } = mountHook();

    emit({
      transactionMeta: createMoneyDeposit({
        id: 'approved-1',
        status: TransactionStatus.approved,
      }),
    });

    expect(mockToastLoading).toHaveBeenCalledTimes(1);
    expect(mockToastLoading).toHaveBeenCalledWith(expect.anything(), {
      id: 'money-tx-approved-1',
    });
  });

  it('shows each phase once across the lifecycle and accepts array payloads', () => {
    const { emit } = mountHook();
    const meta = (status: TransactionStatus) =>
      createMoneyDeposit({ id: 'lifecycle-1', status });

    emit({ transactionMeta: meta(TransactionStatus.approved) });
    emit([{ transactionMeta: meta(TransactionStatus.signed) }]);
    emit({ transactionMeta: meta(TransactionStatus.submitted) });
    emit({ transactionMeta: meta(TransactionStatus.confirmed) });
    emit({ transactionMeta: meta(TransactionStatus.failed) });

    expect(mockToastLoading).toHaveBeenCalledTimes(1);
    expect(mockToastSuccess).toHaveBeenCalledTimes(1);
    expect(mockToastSuccess).toHaveBeenCalledWith(expect.anything(), {
      id: 'money-tx-lifecycle-1',
    });
    expect(mockToastError).not.toHaveBeenCalled();
  });

  it('shows a failed toast for dropped batches', () => {
    const { emit } = mountHook();
    const meta = (status: TransactionStatus) =>
      createMoneyDeposit({ id: 'no-hash', status });

    emit({ transactionMeta: meta(TransactionStatus.submitted) });
    emit({ transactionMeta: meta(TransactionStatus.dropped) });

    expect(mockToastError).toHaveBeenCalledWith(expect.anything(), {
      id: 'money-tx-no-hash',
    });
  });

  it('dismisses the pending toast instead of failing when dropped for a speed-up', () => {
    const { emit } = mountHook();
    const meta = (status: TransactionStatus) =>
      createMoneyDeposit({ id: 'sped-up', status, replacedById: 'faster' });
    mockTransactions = [
      createMoneyDeposit({ id: 'faster', status: TransactionStatus.submitted }),
    ];

    emit({ transactionMeta: meta(TransactionStatus.submitted) });
    emit({ transactionMeta: meta(TransactionStatus.dropped) });

    expect(mockToastDismiss).toHaveBeenCalledWith('money-tx-sped-up');
    expect(mockToastError).not.toHaveBeenCalled();
  });

  it('shows a failed toast when dropped for a cancel', () => {
    const { emit } = mountHook();
    const meta = (status: TransactionStatus) =>
      createMoneyDeposit({ id: 'cancelled', status, replacedById: 'cancel' });
    mockTransactions = [
      createMoneyDeposit({
        id: 'cancel',
        status: TransactionStatus.submitted,
        type: TransactionType.cancel,
      }),
    ];

    emit({ transactionMeta: meta(TransactionStatus.submitted) });
    emit({ transactionMeta: meta(TransactionStatus.dropped) });

    expect(mockToastDismiss).not.toHaveBeenCalled();
    expect(mockToastError).toHaveBeenCalledWith(expect.anything(), {
      id: 'money-tx-cancelled',
    });
  });

  it('passes the recorded deposit intent to the label and clears it on terminal toasts', () => {
    setMoneyAccountDepositIntent('0xbatch', 'card');
    const { emit } = mountHook();
    const meta = (status: TransactionStatus) =>
      createMoneyDeposit({ id: 'intent-1', status, batchId: '0xbatch' });

    emit({ transactionMeta: meta(TransactionStatus.submitted) });
    expect(getMoneyAccountDepositIntent('0xbatch')).toBe('card');

    emit({ transactionMeta: meta(TransactionStatus.confirmed) });
    expect(getMoneyAccountDepositIntent('0xbatch')).toBeUndefined();

    render(mockToastSuccess.mock.calls[0][0]);
    expect(mockUseMoneyAccountToastLabel).toHaveBeenCalledWith(
      'success',
      'intent-1',
      'card',
    );
  });

  it('registers the money batch on pending and clears it on terminal toasts', () => {
    const { emit } = mountHook();
    const meta = (status: TransactionStatus, required?: string[]) =>
      createMoneyDeposit({
        id: 'registry-1',
        status,
        requiredTransactionIds: required,
      });

    emit({
      transactionMeta: meta(TransactionStatus.approved, ['pay-child']),
    });
    expect(isMoneyBatchInFlight()).toBe(true);
    expect(isKnownMoneyBatchChild('pay-child')).toBe(true);

    emit({ transactionMeta: meta(TransactionStatus.confirmed) });
    expect(isMoneyBatchInFlight()).toBe(false);
    expect(isKnownMoneyBatchChild('pay-child')).toBe(false);
  });

  it('clears the money batch registry on terminal status even without a pending toast', () => {
    const { emit } = mountHook();
    // Simulate a reload / missed pending event: register externally, then
    // confirm without ever showing a pending toast for this id.
    registerMoneyBatchTransaction({
      id: 'registry-orphan',
      requiredTransactionIds: ['orphan-child'],
    });
    clearToastPhase('registry-orphan');

    emit({
      transactionMeta: createMoneyDeposit({
        id: 'registry-orphan',
        status: TransactionStatus.confirmed,
      }),
    });

    expect(isMoneyBatchInFlight()).toBe(false);
    expect(mockToastSuccess).not.toHaveBeenCalled();
  });

  it('renders the money label with a details link, falling back to generic copy', () => {
    mockUseMoneyAccountToastLabel.mockReturnValue({
      title: 'money-title',
      description: 'money-description',
    });
    const { emit } = mountHook();

    emit({
      transactionMeta: createMoneyDeposit({
        id: 'labelled',
        status: TransactionStatus.submitted,
        hash: '0xhash',
      }),
    });

    render(mockToastLoading.mock.calls[0][0]);
    expect(mockUseMoneyAccountToastLabel).toHaveBeenCalledWith(
      'pending',
      'labelled',
      undefined,
    );
    expect(screen.getByTestId('money-account-toast-pending')).toHaveTextContent(
      'money-title',
    );
    expect(screen.getByText('money-description')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      expect.stringContaining('eip155:59144/0xhash'),
    );

    mockUseMoneyAccountToastLabel.mockReturnValue(undefined);
    render(mockToastLoading.mock.calls[0][0]);
    expect(screen.getByText('transactionSubmitted')).toBeInTheDocument();
  });
});
