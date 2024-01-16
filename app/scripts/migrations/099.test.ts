import { migrate, version } from './099';

const oldVersion = 98;
describe('migration #99', () => {
  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
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

  it('updates transaction ids', async () => {
    const oldState = {
      TransactionController: {
        transactions: {
          1: {
            id: 1,
            otherProp: 1,
          },
          2: {
            id: 2,
            otherProp: 2,
          },
        },
      },
    };
    const oldStorage = {
      meta: { version: oldVersion },
      data: oldState,
    };

    const newStorage = await migrate(oldStorage);

    const migratedTransactions = (newStorage.data.TransactionController as any)
      .transactions;

    const [firstTxId, secondTxId] = Object.keys(migratedTransactions);

    expect(migratedTransactions).toStrictEqual({
      [firstTxId]: {
        id: firstTxId,
        otherProp: 1,
      },
      [secondTxId]: {
        id: secondTxId,
        otherProp: 2,
      },
    });
  });
});
