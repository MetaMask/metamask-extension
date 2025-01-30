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

  it('initializes a default user storage state if it did not exist before', async () => {
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

  it('should do nothing if existing UserStorageController state is malformed', async () => {
    const actAssertInvalidUserStorageState = async (state: unknown) => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          OtherController: {},
          UserStorageController: state,
        },
      };

      const newStorage = await migrate(oldStorage);
      expect(newStorage.data).toStrictEqual(oldStorage.data);
    };

    actAssertInvalidUserStorageState('user storage state is not an object');
    actAssertInvalidUserStorageState({
      // missing the isProfileSyncingEnabled field
      isProfileSyncingUpdateLoading: false,
    });
  });
});
