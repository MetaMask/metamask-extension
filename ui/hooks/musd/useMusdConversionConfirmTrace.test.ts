import { renderHook } from '@testing-library/react-hooks';
import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { useMusdConversionConfirmTrace } from './useMusdConversionConfirmTrace';

const mockTrace = jest.fn();
const mockEndTrace = jest.fn();

jest.mock('../../../shared/lib/trace', () => ({
  trace: (...args: unknown[]) => mockTrace(...args),
  endTrace: (...args: unknown[]) => mockEndTrace(...args),
  TraceName: { MusdConversionConfirm: 'MusdConversionConfirm' },
  TraceOperation: { MusdConversionOperation: 'musd.conversion.operation' },
}));

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

const { useSelector } = jest.requireMock('react-redux');

const MOCK_PAYMENT_TOKEN = {
  address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  chainId: '0x1',
  symbol: 'USDC',
};

const MOCK_QUOTE = {
  strategy: 'lifi',
  sourceChainId: '0x1',
  destinationChainId: '0x1',
};

const createMusdConversionTx = (
  id: string,
  status: string,
  overrides: Partial<TransactionMeta> = {},
): Partial<TransactionMeta> => ({
  id,
  status: status as TransactionMeta['status'],
  type: TransactionType.musdConversion,
  chainId: '0x1',
  ...overrides,
});

let mockTransactions: Partial<TransactionMeta>[] = [];
let mockPaymentToken: typeof MOCK_PAYMENT_TOKEN | undefined;
let mockQuotes: (typeof MOCK_QUOTE)[] | undefined;
let selectorCallIndex = 0;

function setupMock(
  transactions: Partial<TransactionMeta>[],
  paymentToken?: typeof MOCK_PAYMENT_TOKEN,
  quotes?: (typeof MOCK_QUOTE)[],
) {
  mockTransactions = transactions;
  mockPaymentToken = paymentToken;
  mockQuotes = quotes;
  selectorCallIndex = 0;

  useSelector.mockImplementation(() => {
    const idx = selectorCallIndex;
    selectorCallIndex += 1;
    const position = idx % 3;
    if (position === 0) {
      return mockTransactions;
    }
    if (position === 1) {
      return mockPaymentToken;
    }
    return mockQuotes;
  });
}

function updateMock(
  transactions: Partial<TransactionMeta>[],
  paymentToken?: typeof MOCK_PAYMENT_TOKEN,
  quotes?: (typeof MOCK_QUOTE)[],
) {
  mockTransactions = transactions;
  mockPaymentToken = paymentToken;
  mockQuotes = quotes;
  selectorCallIndex = 0;
}

describe('useMusdConversionConfirmTrace', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    selectorCallIndex = 0;
  });

  it('does nothing when transaction is not found', () => {
    setupMock([]);

    renderHook(() => useMusdConversionConfirmTrace('tx-1'));

    expect(mockTrace).not.toHaveBeenCalled();
    expect(mockEndTrace).not.toHaveBeenCalled();
  });

  it('does nothing when transactionId is empty', () => {
    setupMock([]);

    renderHook(() => useMusdConversionConfirmTrace(''));

    expect(mockTrace).not.toHaveBeenCalled();
    expect(mockEndTrace).not.toHaveBeenCalled();
  });

  it('starts trace when transaction is in approved status', () => {
    setupMock(
      [createMusdConversionTx('tx-1', TransactionStatus.approved)],
      MOCK_PAYMENT_TOKEN,
      [MOCK_QUOTE],
    );

    renderHook(() => useMusdConversionConfirmTrace('tx-1'));

    expect(mockTrace).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'MusdConversionConfirm',
        id: 'tx-1',
        tags: expect.objectContaining({
          transactionId: 'tx-1',
          paymentTokenAddress: MOCK_PAYMENT_TOKEN.address,
          strategy: 'lifi',
        }),
      }),
    );
  });

  it('starts trace when transaction is in signed status', () => {
    setupMock(
      [createMusdConversionTx('tx-1', TransactionStatus.signed)],
      MOCK_PAYMENT_TOKEN,
      [MOCK_QUOTE],
    );

    renderHook(() => useMusdConversionConfirmTrace('tx-1'));

    expect(mockTrace).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'MusdConversionConfirm',
        id: 'tx-1',
      }),
    );
  });

  it('starts trace when transaction is in submitted status', () => {
    setupMock(
      [createMusdConversionTx('tx-1', TransactionStatus.submitted)],
      MOCK_PAYMENT_TOKEN,
      [MOCK_QUOTE],
    );

    renderHook(() => useMusdConversionConfirmTrace('tx-1'));

    expect(mockTrace).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'MusdConversionConfirm',
        id: 'tx-1',
      }),
    );
  });

  it('ends trace with success when transaction is confirmed', () => {
    setupMock(
      [createMusdConversionTx('tx-1', TransactionStatus.submitted)],
      MOCK_PAYMENT_TOKEN,
      [MOCK_QUOTE],
    );

    const { rerender } = renderHook(() =>
      useMusdConversionConfirmTrace('tx-1'),
    );

    expect(mockTrace).toHaveBeenCalledTimes(1);

    updateMock(
      [createMusdConversionTx('tx-1', TransactionStatus.confirmed)],
      MOCK_PAYMENT_TOKEN,
      [MOCK_QUOTE],
    );

    rerender();

    expect(mockEndTrace).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'MusdConversionConfirm',
        id: 'tx-1',
        data: expect.objectContaining({
          success: true,
          status: TransactionStatus.confirmed,
          strategy: 'lifi',
          paymentTokenAddress: MOCK_PAYMENT_TOKEN.address,
          paymentTokenChainId: '0x1',
        }),
      }),
    );
  });

  it('ends trace with failure when transaction fails', () => {
    setupMock(
      [createMusdConversionTx('tx-1', TransactionStatus.submitted)],
      MOCK_PAYMENT_TOKEN,
      [MOCK_QUOTE],
    );

    const { rerender } = renderHook(() =>
      useMusdConversionConfirmTrace('tx-1'),
    );

    updateMock(
      [createMusdConversionTx('tx-1', TransactionStatus.failed)],
      MOCK_PAYMENT_TOKEN,
      [MOCK_QUOTE],
    );

    rerender();

    expect(mockEndTrace).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'MusdConversionConfirm',
        id: 'tx-1',
        data: expect.objectContaining({
          success: false,
          status: TransactionStatus.failed,
        }),
      }),
    );
  });

  it('ends trace with failure when transaction is dropped', () => {
    setupMock(
      [createMusdConversionTx('tx-1', TransactionStatus.approved)],
      MOCK_PAYMENT_TOKEN,
      [MOCK_QUOTE],
    );

    const { rerender } = renderHook(() =>
      useMusdConversionConfirmTrace('tx-1'),
    );

    updateMock(
      [createMusdConversionTx('tx-1', TransactionStatus.dropped)],
      MOCK_PAYMENT_TOKEN,
      [MOCK_QUOTE],
    );

    rerender();

    expect(mockEndTrace).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          success: false,
          status: TransactionStatus.dropped,
        }),
      }),
    );
  });

  it('does not include strategy in end data for non-confirmed terminal statuses', () => {
    setupMock(
      [createMusdConversionTx('tx-1', TransactionStatus.submitted)],
      MOCK_PAYMENT_TOKEN,
      [MOCK_QUOTE],
    );

    const { rerender } = renderHook(() =>
      useMusdConversionConfirmTrace('tx-1'),
    );

    updateMock(
      [createMusdConversionTx('tx-1', TransactionStatus.failed)],
      MOCK_PAYMENT_TOKEN,
      [MOCK_QUOTE],
    );

    rerender();

    const endCall = mockEndTrace.mock.calls[0][0];
    expect(endCall.data.strategy).toBeUndefined();
  });

  it('uses "unknown" defaults when payment token and quotes are missing', () => {
    setupMock([createMusdConversionTx('tx-1', TransactionStatus.approved)]);

    renderHook(() => useMusdConversionConfirmTrace('tx-1'));

    expect(mockTrace).toHaveBeenCalledWith(
      expect.objectContaining({
        tags: expect.objectContaining({
          paymentTokenAddress: 'unknown',
          paymentTokenChainId: 'unknown',
          strategy: 'unknown',
        }),
      }),
    );
  });

  it('does not start a second trace for the same transaction', () => {
    setupMock(
      [createMusdConversionTx('tx-1', TransactionStatus.submitted)],
      MOCK_PAYMENT_TOKEN,
      [MOCK_QUOTE],
    );

    const { rerender } = renderHook(() =>
      useMusdConversionConfirmTrace('tx-1'),
    );

    expect(mockTrace).toHaveBeenCalledTimes(1);

    updateMock(
      [createMusdConversionTx('tx-1', TransactionStatus.submitted)],
      MOCK_PAYMENT_TOKEN,
      [MOCK_QUOTE],
    );

    rerender();

    expect(mockTrace).toHaveBeenCalledTimes(1);
  });

  it('ignores non-musdConversion transactions', () => {
    setupMock(
      [
        {
          id: 'tx-1',
          status: TransactionStatus.approved,
          type: TransactionType.simpleSend,
          chainId: '0x1',
        } as Partial<TransactionMeta>,
      ],
      MOCK_PAYMENT_TOKEN,
      [MOCK_QUOTE],
    );

    renderHook(() => useMusdConversionConfirmTrace('tx-1'));

    expect(mockTrace).not.toHaveBeenCalled();
  });

  it('ends active trace on unmount', () => {
    setupMock(
      [createMusdConversionTx('tx-1', TransactionStatus.submitted)],
      MOCK_PAYMENT_TOKEN,
      [MOCK_QUOTE],
    );

    const { unmount } = renderHook(() => useMusdConversionConfirmTrace('tx-1'));

    expect(mockTrace).toHaveBeenCalledTimes(1);
    expect(mockEndTrace).not.toHaveBeenCalled();

    unmount();

    expect(mockEndTrace).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'MusdConversionConfirm',
        id: 'tx-1',
        data: expect.objectContaining({
          success: false,
          status: 'unmounted',
        }),
      }),
    );
  });

  it('does not call endTrace on unmount when no trace is active', () => {
    setupMock([]);

    const { unmount } = renderHook(() => useMusdConversionConfirmTrace('tx-1'));

    unmount();

    expect(mockEndTrace).not.toHaveBeenCalled();
  });

  it('does not start trace for unapproved transaction', () => {
    setupMock(
      [createMusdConversionTx('tx-1', TransactionStatus.unapproved)],
      MOCK_PAYMENT_TOKEN,
      [MOCK_QUOTE],
    );

    renderHook(() => useMusdConversionConfirmTrace('tx-1'));

    expect(mockTrace).not.toHaveBeenCalled();
  });
});
