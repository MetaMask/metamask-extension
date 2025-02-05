import { migrate, version, VersionedData } from './137';

const oldVersion = 136;

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
    it('sets isAccountSyncingReadyToBeDispatched to true if completedOnboarding is true', async () => {
      const oldStorage: VersionedData = {
        meta: { version: oldVersion },
        data: {
          OnboardingController: {
            completedOnboarding: true,
          },
          UserStorageController: {
            isAccountSyncingReadyToBeDispatched: false,
          },
        },
      };
      const expectedData = {
        OnboardingController: {
          completedOnboarding: true,
        },
        UserStorageController: {
          isAccountSyncingReadyToBeDispatched: true,
        },
      };
      const newStorage = await migrate(oldStorage);

      expect(newStorage.data).toStrictEqual(expectedData);
    });

    it('sets isAccountSyncingReadyToBeDispatched to false if completedOnboarding is false', async () => {
      const oldStorage: VersionedData = {
        meta: { version: oldVersion },
        data: {
          OnboardingController: {
            completedOnboarding: false,
          },
          UserStorageController: {
            isAccountSyncingReadyToBeDispatched: true,
          },
        },
      };
      const expectedData = {
        OnboardingController: {
          completedOnboarding: false,
        },
        UserStorageController: {
          isAccountSyncingReadyToBeDispatched: false,
        },
      };
      const newStorage = await migrate(oldStorage);

      expect(newStorage.data).toStrictEqual(expectedData);
    });
  });
});
