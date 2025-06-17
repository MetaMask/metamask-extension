import { migrate, version } from './167';

const oldVersion = 166;

describe(`migration #${version}`, () => {
  // Set up a global sentry mock before each test.
  beforeEach(() => {
    global.sentry = { captureException: jest.fn() };
  });

  afterEach(() => {
    // Clean up the global sentry after each test.
    global.sentry = undefined;
  });

  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.meta).toStrictEqual({ version });
  });

  describe(`migration #${version}`, () => {
    it('does not capture sentry error and returns the original state if UserStorageController is missing', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          OtherController: {},
        },
      };

      const newStorage = await migrate(oldStorage);

      expect(global.sentry.captureException).not.toHaveBeenCalled();
      expect(newStorage.data).toStrictEqual(oldStorage.data);
    });

    it('captures sentry error and returns the original state if UserStorageController exists but is not an object', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          UserStorageController: 'not an object',
        },
      };

      const newStorage = await migrate(oldStorage);

      expect(global.sentry.captureException).toHaveBeenCalledWith(
        new Error(
          `Migration ${version}: UserStorageController is type 'string', expected object.`,
        ),
      );
      expect(newStorage.data).toStrictEqual(oldStorage.data);
    });

    it('sets isBackupAndSyncEnabled and isAccountSyncingEnabled to true', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          UserStorageController: {
            isBackupAndSyncEnabled: false,
            isAccountSyncingEnabled: false,
          },
        },
      };

      const expectedData = {
        UserStorageController: {
          isBackupAndSyncEnabled: true,
          isAccountSyncingEnabled: true,
        },
      };

      const newStorage = await migrate(oldStorage);
      expect(global.sentry.captureException).not.toHaveBeenCalled();
      expect(newStorage.meta).toStrictEqual({ version });
      expect(newStorage.data).toStrictEqual(expectedData);
    });
  });
});
