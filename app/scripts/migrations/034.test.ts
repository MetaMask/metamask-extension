import migration34 from './034';

type MigrationInput = Parameters<typeof migration34.migrate>[0];

describe('migration #34', () => {
  it('should update the version metadata', async () => {
    const oldStorage: MigrationInput = {
      meta: {
        version: 33,
      },
      data: {},
    };

    const newStorage = await migration34.migrate(
      oldStorage as unknown as MigrationInput,
    );
    expect(newStorage.meta.version).toStrictEqual(34);
  });

  it('should set migratedPrivacyMode & privacyMode if featureFlags.privacyMode was false', async () => {
    const oldStorage: MigrationInput = {
      meta: { version: 33 },
      data: {
        PreferencesController: {
          featureFlags: {
            privacyMode: false,
          },
        },
      },
    };

    const newStorage = await migration34.migrate(
      oldStorage as unknown as MigrationInput,
    );
    expect(newStorage.data.PreferencesController).toStrictEqual({
      migratedPrivacyMode: true,
      featureFlags: {
        privacyMode: true,
      },
    });
  });

  it('should NOT change any state if migratedPrivacyMode is already set to true', async () => {
    const oldStorage: MigrationInput = {
      meta: { version: 33 },
      data: {
        PreferencesController: {
          migratedPrivacyMode: true,
          featureFlags: {
            privacyMode: true,
          },
        },
      },
    };

    const newStorage = await migration34.migrate(
      oldStorage as unknown as MigrationInput,
    );
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('should NOT change any state if migratedPrivacyMode is already set to false', async () => {
    const oldStorage: MigrationInput = {
      meta: { version: 33 },
      data: {
        PreferencesController: {
          migratedPrivacyMode: false,
          featureFlags: {
            privacyMode: true,
          },
        },
      },
    };

    const newStorage = await migration34.migrate(
      oldStorage as unknown as MigrationInput,
    );
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('should NOT change any state if PreferencesController is missing', async () => {
    const oldStorage: MigrationInput = {
      meta: { version: 33 },
      data: {},
    };

    const newStorage = await migration34.migrate(
      oldStorage as unknown as MigrationInput,
    );
    expect(newStorage.data).toStrictEqual(newStorage.data);
  });

  it('should NOT change any state if featureFlags.privacyMode is already true', async () => {
    const oldStorage: MigrationInput = {
      meta: { version: 33 },
      data: {
        PreferencesController: {
          featureFlags: {
            privacyMode: true,
          },
        },
      },
    };

    const newStorage = await migration34.migrate(
      oldStorage as unknown as MigrationInput,
    );
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });
});
