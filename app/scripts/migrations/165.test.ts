import { migrate, version, VersionedData } from './165';

const oldVersion = 164;

describe(`migration #${version}`, () => {
  it('updates the version metadata', async () => {
    const oldStorage: VersionedData = {
      meta: { version: oldVersion },
      data: {},
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({ version });
  });

  describe(`migration #${version}`, () => {
    it('deletes the bitcoin support keys from the preferences', async () => {
      const oldStorage: VersionedData = {
        meta: { version: oldVersion },
        data: {
          PreferencesController: {
            bitcoinSupportEnabled: true,
            bitcoinTestnetSupportEnabled: true,
          },
        },
      };
      const expectedData = {
        PreferencesController: {},
      };
      const newStorage = await migrate(oldStorage);

      expect(newStorage.data).toStrictEqual(expectedData);
    });
  });
});
