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

  it('sets isProfileSyncing enabled to false', async () => {
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
});
