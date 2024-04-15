import { migrate, version, TARGET_DATE } from './115';

const oldVersion = 114;

const TRANSACTIONS_MOCK = {
  tx1: { time: TARGET_DATE - 1000, status: 'approved' }, // Before target date, should be marked as failed
  tx2: { time: TARGET_DATE + 1000, status: 'approved' }, // After target date, should remain unchanged
  tx3: { time: TARGET_DATE - 1000, status: 'signed' }, // Before target date, should be marked as failed
  tx4: { time: TARGET_DATE - 1000, status: 'confirmed' }, // Before target date but not approved/signed, should remain unchanged
};

describe('migration #115', () => {
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
        transactions: {},
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
    const expectedTransactions = {
      ...TRANSACTIONS_MOCK,
      tx1: { ...TRANSACTIONS_MOCK.tx1, status: 'failed' }, // tx1 should be marked as failed
      tx3: { ...TRANSACTIONS_MOCK.tx3, status: 'failed' }, // tx3 should be marked as failed
    };

    expect(newStorage.data).toEqual({
      TransactionController: {
        transactions: expectedTransactions,
      },
    });
  });
});
