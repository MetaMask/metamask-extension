import React from 'react';
import { render, renderHook, screen } from '@testing-library/react';
import {
  TransactionStatus,
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { clearToastPhase } from '../../toast-listener/toast-lifecycle';
import { useMoneyAccountToasts } from './money-account-toast-listener';

const EVENT = 'TransactionController:transactionStatusUpdated';

const mockSubscribe = jest.fn();
const mockUnsubscribe = jest.fn();
const mockToastLoading = jest.fn();
const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();
const mockUseMoneyAccountToastLabel = jest.fn();

jest.mock('../../../../hooks/useMessenger', () => ({
  useMessenger: () => ({
    subscribe: mockSubscribe,
    unsubscribe: mockUnsubscribe,
  }),
}));

jest.mock('../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

jest.mock('../../../ui/toast/toast', () => ({
  toast: {
    loading: (...args: unknown[]) => mockToastLoading(...args),
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
    dismiss: jest.fn(),
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
    ['approved-1', 'lifecycle-1', 'no-hash', 'labelled'].forEach(
      clearToastPhase,
    );
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
