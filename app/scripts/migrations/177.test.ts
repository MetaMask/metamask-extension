import { migrate, version } from './177';

const oldVersion = 176;

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
    it('deletes the old and unused UserStorageController state properties', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          UserStorageController: {
            hasAccountSyncingSyncedAtLeastOnce: false,
            isAccountSyncingReadyToBeDispatched: false,
            isAccountSyncingInProgress: false,
          },
        },
      };
      const expectedData = {
        UserStorageController: {},
      };
      const newStorage = await migrate(oldStorage);

      expect(newStorage.data).toStrictEqual(expectedData);
    });
  });
});
