import { migrate, version, VersionedData } from './153';

const oldVersion = 152;

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
    it('sets isAccountSyncingEnabled to true', async () => {
      const oldStorage: VersionedData = {
        meta: { version: oldVersion },
        data: {
          UserStorageController: {},
        },
      };
      const expectedData = {
        UserStorageController: {
          isAccountSyncingEnabled: true,
        },
      };
      const newStorage = await migrate(oldStorage);

      expect(newStorage.data).toStrictEqual(expectedData);
    });
  });
});
