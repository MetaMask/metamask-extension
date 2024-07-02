import { migrate, version } from './122';

const oldVersion = 121;

describe('migration #122', () => {
  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({ version });
  });

  it('should remove the "unconnectedAccount"', async () => {
    const oldStorage = {
      meta: {
        version: oldVersion,
      },
      data: {
        AlertController: {
          unconnectedAccount: false,
          bar: 'baz',
        },
      },
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version: 122,
      },
      data: {
        AlertController: {
          bar: 'baz',
        },
      },
    });
  });

  it('should make no changes if "unconnectedAccount" never existed', async () => {
    const oldStorage = {
      meta: {
        version: oldVersion,
      },
      data: {
        AlertController: {
          bar: 'baz',
        },
      },
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version: 122,
      },
      data: {
        AlertController: {
          bar: 'baz',
        },
      },
    });
  });
});
