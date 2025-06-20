import { migrate, version } from './115';

const oldVersion = 114;

describe('migration #79', () => {
  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({ version });
  });

  it('should remove the "showProductTour"', async () => {
    const oldStorage = {
      meta: {
        version: oldVersion,
      },
      data: {
        AppStateController: {
          showProductTour: false,
          bar: 'baz',
        },
      },
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version: 115,
      },
      data: {
        AppStateController: {
          bar: 'baz',
        },
      },
    });
  });

  it('should make no changes if "showProductTour" never existed', async () => {
    const oldStorage = {
      meta: {
        version: oldVersion,
      },
      data: {
        AppStateController: {
          bar: 'baz',
        },
      },
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version: 115,
      },
      data: {
        AppStateController: {
          bar: 'baz',
        },
      },
    });
  });
});
