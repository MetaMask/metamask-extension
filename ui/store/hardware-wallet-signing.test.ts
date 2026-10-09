import {
  TransactionStatus,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { subscribeToMessengerEvent } from './background-connection';
import {
  haveRequiredTransactionsBeenSigned,
  listenForHardwareSigningCompletion,
  type HardwareSigningState,
} from './hardware-wallet-signing';

jest.mock('./background-connection', () => ({
  subscribeToMessengerEvent: jest.fn(),
}));

const PARENT_ID = 'parent-transaction';
const FROM_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678';

function buildTransaction(
  overrides: Partial<TransactionMeta> & { id: string },
): TransactionMeta {
  return {
    chainId: '0x1',
    networkClientId: 'mainnet',
    status: TransactionStatus.unapproved,
    time: 0,
    txParams: { from: FROM_ADDRESS },
    ...overrides,
  };
}

function buildState(
  requiredTransactionIds: string[],
  transactions: TransactionMeta[] = [],
  batchTransactionCounts: Record<string, number> = {},
): HardwareSigningState {
  return {
    batchTransactionCounts,
    transactions: [
      buildTransaction({
        id: PARENT_ID,
        requiredTransactionIds,
        status: TransactionStatus.approved,
      }),
      ...transactions,
    ],
  };
}

describe('haveRequiredTransactionsBeenSigned', () => {
  it('returns false when no funding transactions exist', () => {
    expect(
      haveRequiredTransactionsBeenSigned(PARENT_ID, buildState([]), 1),
    ).toBe(false);
  });

  it('returns true when a standalone funding transaction is signed', () => {
    const state = buildState(
      ['funding-transaction'],
      [
        buildTransaction({
          id: 'funding-transaction',
          status: TransactionStatus.signed,
        }),
      ],
    );

    expect(haveRequiredTransactionsBeenSigned(PARENT_ID, state, 1)).toBe(true);
  });

  it('returns false when a batch is missing an expected transaction', () => {
    const state = buildState(
      ['approval-transaction'],
      [
        buildTransaction({
          batchId: 'funding-batch',
          id: 'approval-transaction',
          status: TransactionStatus.signed,
        }),
      ],
      { 'funding-batch': 2 },
    );

    expect(haveRequiredTransactionsBeenSigned(PARENT_ID, state, 1)).toBe(false);
  });

  it('returns true when every transaction in a batch is signed', () => {
    const state = buildState(
      ['approval-transaction', 'funding-transaction'],
      [
        buildTransaction({
          batchId: 'funding-batch',
          id: 'approval-transaction',
          status: TransactionStatus.signed,
        }),
        buildTransaction({
          batchId: 'funding-batch',
          id: 'funding-transaction',
          status: TransactionStatus.submitted,
        }),
      ],
      { 'funding-batch': 2 },
    );

    expect(haveRequiredTransactionsBeenSigned(PARENT_ID, state, 1)).toBe(true);
  });

  it('waits for a transaction group from every quote', () => {
    const state = buildState(
      ['first-funding-transaction'],
      [
        buildTransaction({
          id: 'first-funding-transaction',
          status: TransactionStatus.signed,
        }),
      ],
    );

    expect(haveRequiredTransactionsBeenSigned(PARENT_ID, state, 2)).toBe(false);
  });
});

describe('listenForHardwareSigningCompletion', () => {
  const subscribeToMessengerEventMock = jest.mocked(subscribeToMessengerEvent);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('completes after a required funding transaction is signed', async () => {
    let eventHandler:
      | ((event: [{ transactionMeta: TransactionMeta }]) => void)
      | undefined;
    const unsubscribe = jest.fn().mockResolvedValue(undefined);
    subscribeToMessengerEventMock.mockImplementation(
      async (_event, callback) => {
        eventHandler = callback as typeof eventHandler;
        return unsubscribe;
      },
    );
    const onComplete = jest.fn();
    const state = buildState(
      ['funding-transaction'],
      [
        buildTransaction({
          id: 'funding-transaction',
          status: TransactionStatus.signed,
        }),
      ],
    );

    const stopListening = await listenForHardwareSigningCompletion({
      transactionId: PARENT_ID,
      expectedQuoteCount: 1,
      getState: async () => state,
      onComplete,
    });
    eventHandler?.([
      {
        transactionMeta: buildTransaction({
          id: 'funding-transaction',
          status: TransactionStatus.signed,
        }),
      },
    ]);
    await stopListening();

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('ignores signed transactions unrelated to the parent', async () => {
    let eventHandler:
      | ((event: [{ transactionMeta: TransactionMeta }]) => void)
      | undefined;
    subscribeToMessengerEventMock.mockImplementation(
      async (_event, callback) => {
        eventHandler = callback as typeof eventHandler;
        return jest.fn().mockResolvedValue(undefined);
      },
    );
    const onComplete = jest.fn();
    const state = buildState(
      ['funding-transaction'],
      [
        buildTransaction({
          id: 'funding-transaction',
          status: TransactionStatus.signed,
        }),
      ],
    );

    const stopListening = await listenForHardwareSigningCompletion({
      transactionId: PARENT_ID,
      expectedQuoteCount: 1,
      getState: async () => state,
      onComplete,
    });
    eventHandler?.([
      {
        transactionMeta: buildTransaction({
          id: 'unrelated-transaction',
          status: TransactionStatus.signed,
        }),
      },
    ]);
    await stopListening();

    expect(onComplete).not.toHaveBeenCalled();
  });
});
