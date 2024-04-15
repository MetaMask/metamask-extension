import { migrate, version } from './102';

const oldVersion = 101;
describe('migration #102', () => {
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

  it('adds `error` property in the transaction by copying `err` and deleting it afterwards', async () => {
    const oldState = {
      TransactionController: {
        transactions: {
          tx1: {
            to: '0x9ef57335bc7d5b6cbc06dca6064a604b75e09ace',
            err: {
              message: 'nonce too high',
              rpc: 'rpc_error',
              stack: 'stacktrace',
            },
            otherProp: 'value',
          },
          tx2: {
            to: '0x9ef57335bc7d5b6cbc06dca6064a604b75e09ace',
            otherProp: 'value',
          },
          tx3: {
            to: '0x9ef57335bc7d5b6cbc06dca6064a604b75e09ace',
            err: {
              message: 'mocked error',
              rpc: 'rpc_error',
              stack: 'stacktrace',
            },
            otherProp: 'value',
          },
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
          tx1: {
            to: '0x9ef57335bc7d5b6cbc06dca6064a604b75e09ace',
            error: {
              message: 'nonce too high',
              rpc: 'rpc_error',
              stack: 'stacktrace',
            },
            otherProp: 'value',
          },
          tx2: {
            to: '0x9ef57335bc7d5b6cbc06dca6064a604b75e09ace',
            otherProp: 'value',
          },
          tx3: {
            to: '0x9ef57335bc7d5b6cbc06dca6064a604b75e09ace',
            error: {
              message: 'mocked error',
              rpc: 'rpc_error',
              stack: 'stacktrace',
            },
            otherProp: 'value',
          },
        },
      },
    });
  });
});
