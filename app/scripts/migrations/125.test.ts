import { migrate, version } from './125';

const oldVersion = 124;

describe('migration #125', () => {
  afterEach(() => jest.resetAllMocks());

  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({ version });
  });

  it('deletes the deprecated Txcontroller key', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        Txcontroller: {
          transactions: [],
        },
      },
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data.TxController).toStrictEqual(undefined);
  });
});
