import { migrate, version } from './165';

const oldVersion = 164;

describe(`migration #${version}`, () => {
  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({ version });
  });

  it('set smartAccountOptIn to false', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        PreferencesController: {
          preferences: {
            smartAccountOptIn: true,
          },
        },
      },
    };
    const expectedData = {
      PreferencesController: {
        preferences: {
          smartAccountOptIn: false,
        },
      },
    };
    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(expectedData);
  });
});
