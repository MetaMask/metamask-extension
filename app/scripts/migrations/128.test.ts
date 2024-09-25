import { migrate, version } from './128';

const oldVersion = 127;

describe(`migration #${version}`, () => {
  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.meta).toStrictEqual({ version });
  });

  describe(`migration #${version}`, () => {
    it('updates the preferences with a default tokenSortConfig', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          PreferencesController: {
            preferences: {},
          },
        },
      };

      const expectedData = {
        PreferencesController: {
          preferences: {
            tokenSortConfig: {
              key: 'tokenFiatAmount',
              order: 'dsc',
              sortCallback: 'stringNumeric',
            },
          },
        },
      };

      const newStorage = await migrate(oldStorage);

      expect(newStorage.data).toStrictEqual(expectedData);
    });

    it('does nothing if the preferences already has a tokenSortConfig', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          PreferencesController: {
            preferences: {
              tokenSortConfig: {
                key: 'fooKey',
                order: 'foo',
                sortCallback: 'fooCallback',
              },
            },
          },
        },
      };

      const newStorage = await migrate(oldStorage);

      expect(newStorage.data).toStrictEqual(oldStorage.data);
    });
  });
});
