import { migrate, version, VersionedData } from './157';

const oldVersion = 156;

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
    it('deletes the profile syncing state keys, and replaces them with backup and sync ones', async () => {
      const oldStorage: VersionedData = {
        meta: { version: oldVersion },
        data: {
          UserStorageController: {
            isProfileSyncingEnabled: true,
            isProfileSyncingUpdateLoading: false,
          },
        },
      };
      const expectedData = {
        UserStorageController: {
          isBackupAndSyncEnabled: true,
        },
      };
      const newStorage = await migrate(oldStorage);

      expect(newStorage.data).toStrictEqual(expectedData);
    });

    it('keeps the current value of isProfileSyncingEnabled and copies it to isBackupAndSyncEnabled', async () => {
      const oldStorage: VersionedData = {
        meta: { version: oldVersion },
        data: {
          UserStorageController: {
            isProfileSyncingEnabled: false,
            isProfileSyncingUpdateLoading: false,
          },
        },
      };
      const expectedData = {
        UserStorageController: {
          isBackupAndSyncEnabled: false,
        },
      };
      const newStorage = await migrate(oldStorage);

      expect(newStorage.data).toStrictEqual(expectedData);
    });

    it('sets isBackupAndSyncUpdateLoading to false', async () => {
      const oldStorage: VersionedData = {
        meta: { version: oldVersion },
        data: {
          UserStorageController: {
            isProfileSyncingEnabled: true,
            isProfileSyncingUpdateLoading: true,
          },
        },
      };
      const expectedData = {
        UserStorageController: {
          isBackupAndSyncEnabled: true,
        },
      };
      const newStorage = await migrate(oldStorage);

      expect(newStorage.data).toStrictEqual(expectedData);
    });
  });
});
