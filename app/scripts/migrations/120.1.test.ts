import { migrate, version } from './120.1';

const oldVersion = 120;

describe('migration #120.1', () => {
  afterEach(() => jest.resetAllMocks());

  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({ version });
  });

  it('sets isProfileSyncingEnabled to null', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        UserStorageController: {
          isProfileSyncingEnabled: true,
          isProfileSyncingUpdateLoading: false,
        },
      },
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data.UserStorageController).toStrictEqual({
      isProfileSyncingEnabled: null,
      isProfileSyncingUpdateLoading: false,
    });
  });

  it('does nothing if user storage is not initialized', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        OtherController: {},
      },
    };

    const expectedStorageData = {
      OtherController: {},
      UserStorageController: {
        isProfileSyncingEnabled: null,
      },
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(expectedStorageData);
  });
});
