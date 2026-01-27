import { TransactionStatus } from '@metamask/transaction-controller';
import { migrate, version, StuckTransactionError, TARGET_DATE } from './116';

const oldVersion = 115;

const TRANSACTIONS_MOCK = [
  { id: 'tx1', time: TARGET_DATE - 1000, status: 'approved' }, // Before target date, should be marked as failed
  { id: 'tx2', time: TARGET_DATE + 1000, status: 'approved' }, // After target date, should remain unchanged
  { id: 'tx3', time: TARGET_DATE - 1000, status: 'signed' }, // Before target date, should be marked as failed
  { id: 'tx4', time: TARGET_DATE - 1000, status: 'confirmed' }, // Before target date but not approved/signed, should remain unchanged
];

describe('migration #116', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: oldVersion,
      },
      data: {},
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.meta).toStrictEqual({ version });
  });

  it('handles missing TransactionController', async () => {
    const oldState = {
      OtherController: {},
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: oldState,
    });

    expect(transformedState.data).toEqual(oldState);
  });

  it('handles empty transactions', async () => {
    const oldState = {
      TransactionController: {
        transactions: [],
      },
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: oldState,
    });

    expect(transformedState.data).toEqual(oldState);
  });

  it('handles missing state', async () => {
    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: {},
    });

    expect(transformedState.data).toEqual({});
  });

  it('marks the transactions as failed before December 8, 2023, if they are approved or signed', async () => {
    const oldState = {
      TransactionController: {
        transactions: TRANSACTIONS_MOCK,
      },
    };
    const oldStorage = {
      meta: { version: oldVersion },
      data: oldState,
    };

    const newStorage = await migrate(oldStorage);

    // Expected modifications to the transactions based on the migration logic
    const expectedTransactions = [
      {
        ...TRANSACTIONS_MOCK[0], // Assuming tx1 is the first element
        status: TransactionStatus.failed,
        error: StuckTransactionError,
      },
      TRANSACTIONS_MOCK[1], // Assuming tx2 remains unchanged
      {
        ...TRANSACTIONS_MOCK[2], // Assuming tx3 is the third element
        status: TransactionStatus.failed,
        error: StuckTransactionError,
      },
      TRANSACTIONS_MOCK[3], // Assuming tx4 and any others remain unchanged
      // Add more transactions if there are more than four in TRANSACTIONS_MOCK
    ];

    expect(newStorage.data).toEqual({
      TransactionController: {
        transactions: expectedTransactions,
      },
    });
  });

  it('handles transactions in object format (pre-migration 104 format)', async () => {
    // Simulate old state where transactions is an object, not an array
    const transactionsObject = {
      tx1: { id: 'tx1', time: TARGET_DATE - 1000, status: 'approved' },
      tx2: { id: 'tx2', time: TARGET_DATE + 1000, status: 'approved' },
      tx3: { id: 'tx3', time: TARGET_DATE - 1000, status: 'signed' },
      tx4: { id: 'tx4', time: TARGET_DATE - 1000, status: 'confirmed' },
    };

    const oldState = {
      TransactionController: {
        transactions: transactionsObject,
      },
    };

    const oldStorage = {
      meta: { version: oldVersion },
      data: oldState,
    };

    const newStorage = await migrate(oldStorage);

    // The migration should handle the object format without throwing an error
    expect(newStorage.meta).toStrictEqual({ version });

    // Verify that transactions were processed (still in object format in state)
    const resultTransactions =
      newStorage.data.TransactionController.transactions;
    expect(resultTransactions).toBeDefined();

    // tx1 and tx3 should be marked as failed
    expect(resultTransactions.tx1.status).toBe(TransactionStatus.failed);
    expect(resultTransactions.tx1.error).toEqual(StuckTransactionError);
    expect(resultTransactions.tx3.status).toBe(TransactionStatus.failed);
    expect(resultTransactions.tx3.error).toEqual(StuckTransactionError);

    // tx2 and tx4 should remain unchanged
    expect(resultTransactions.tx2.status).toBe('approved');
    expect(resultTransactions.tx4.status).toBe('confirmed');
  });

  it('handles non-object/non-array transactions gracefully', async () => {
    const oldState = {
      TransactionController: {
        transactions: null,
      },
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: oldState,
    });

    // Should not throw an error and should handle null gracefully
    expect(transformedState.meta).toStrictEqual({ version });
    expect(transformedState.data.TransactionController.transactions).toBeNull();
  });
});
