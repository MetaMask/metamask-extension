import { migrate, version } from './097';

const oldVersion = 96;
describe('migration #97', () => {
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

  it('renames metamaskNetworkId property to networkID', async () => {
    const oldState = {
      TransactionController: {
        transactions: {
          tx1: { metamaskNetworkId: 1, otherProp: 'value' },
          tx2: { metamaskNetworkId: 2, otherProp: 'value' },
          tx3: { otherProp: 'value' },
        },
      },
    };
    const oldStorage = {
      meta: { version: oldVersion },
      data: oldState,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toEqual({
      TransactionController: {
        transactions: {
          tx1: { networkID: 1, otherProp: 'value' },
          tx2: { networkID: 2, otherProp: 'value' },
          tx3: { otherProp: 'value' },
        },
      },
    });
  });
});
