import { migrate, version } from './143';

const oldVersion = 142;

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
    it('removes the useNonceField preference if it is set to true', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          PreferencesController: {
            useNonceField: true,
          },
        },
      };
      const expectedData = {
        PreferencesController: {},
      };
      const newStorage = await migrate(oldStorage);

      expect(newStorage.data).toStrictEqual(expectedData);
    });

    it('removes the useNonceField preference if it is set to false', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          PreferencesController: {
            useNonceField: false,
          },
        },
      };
      const expectedData = {
        PreferencesController: {},
      };
      const newStorage = await migrate(oldStorage);

      expect(newStorage.data).toStrictEqual(expectedData);
    });

    it('does nothing to other PreferencesController state if there is not a useNonceField preference', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          existingPreference: true,
        },
      };

      const expectedData = {
        existingPreference: true,
      };

      const newStorage = await migrate(oldStorage);

      expect(newStorage.data).toStrictEqual(expectedData);
    });
  });
});
