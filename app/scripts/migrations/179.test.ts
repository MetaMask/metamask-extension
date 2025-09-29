import { migrate, version } from './179';

const oldVersion = 178;

describe(`migration #${version}`, () => {
  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({ version });
  });

  it('deletes AppStateController.qrHardware from the state', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        AppStateController: {
          qrHardware: { foo: 'bar' },
          other: 'data',
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual({
      AppStateController: {
        other: 'data',
      },
    });
  });

  it('does nothing if AppStateController.qrHardware is not present', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        AppStateController: {
          other: 'data',
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });
});
