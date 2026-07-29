import { renderHook } from '@testing-library/react-hooks';
import {
  TransactionStatus,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { useActivityCacheInvalidation } from './useActivityCacheInvalidation';

const mockInvalidateQueries = jest.fn();

jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: mockInvalidateQueries,
  }),
}));

const mockSubscribe = jest.fn();
const mockUnsubscribe = jest.fn();

jest.mock('../useMessenger', () => ({
  useMessenger: () => ({
    subscribe: mockSubscribe,
    unsubscribe: mockUnsubscribe,
  }),
}));

jest.mock('react-redux', () => ({
  useSelector: jest.fn().mockReturnValue(true),
}));

jest.mock('../../selectors', () => ({
  getUseExternalServices: jest.fn(),
}));

const { useSelector } = jest.requireMock('react-redux');

const EVENT = 'TransactionController:transactionStatusUpdated';

function setupHandlers() {
  const handlers: Record<string, (raw: unknown) => void> = {};
  mockSubscribe.mockImplementation((event: string, handler: unknown) => {
    handlers[event] = handler as (raw: unknown) => void;
  });
  return handlers;
}

function makeTxPayload(
  overrides: Partial<TransactionMeta> & Pick<TransactionMeta, 'id' | 'status'>,
): { transactionMeta: TransactionMeta } {
  return {
    transactionMeta: {
      chainId: '0x1',
      hash: `0xhash_${overrides.id}`,
      networkClientId: 'network-1',
      time: 1,
      txParams: { from: '0x0' },
      ...overrides,
    } as TransactionMeta,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  useSelector.mockReturnValue(true);
});

describe('useActivityCacheInvalidation', () => {
  it('invalidates the activity query when a confirmed EVM tx event fires', () => {
    const handlers = setupHandlers();
    renderHook(() => useActivityCacheInvalidation());

    handlers[EVENT](
      makeTxPayload({ id: 'tx1', status: TransactionStatus.confirmed }),
    );

    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ['accounts', 'transactions', 'v4MultiAccount'],
    });
  });

  it('does not fire twice for the same tx id', () => {
    const handlers = setupHandlers();
    renderHook(() => useActivityCacheInvalidation());

    const payload = makeTxPayload({
      id: 'tx1',
      status: TransactionStatus.confirmed,
    });
    handlers[EVENT](payload);
    handlers[EVENT](payload);

    expect(mockInvalidateQueries).toHaveBeenCalledTimes(1);
  });

  it('does not invalidate for non-confirmed statuses', () => {
    const handlers = setupHandlers();
    renderHook(() => useActivityCacheInvalidation());

    handlers[EVENT](
      makeTxPayload({ id: 'tx1', status: TransactionStatus.failed }),
    );

    expect(mockInvalidateQueries).not.toHaveBeenCalled();
  });

  it('does not invalidate when external services are disabled', () => {
    useSelector.mockReturnValue(false);
    const handlers = setupHandlers();
    renderHook(() => useActivityCacheInvalidation());

    handlers[EVENT](
      makeTxPayload({ id: 'tx1', status: TransactionStatus.confirmed }),
    );

    expect(mockInvalidateQueries).not.toHaveBeenCalled();
  });
});
