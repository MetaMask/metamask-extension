import migration106 from './106';

type MigrationInput = Parameters<typeof migration106.migrate>[0];

describe('migration #106', () => {
  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 105,
      },
      data: {},
    };

    const newStorage = await migration106.migrate(
      oldStorage as unknown as MigrationInput,
    );
    expect(newStorage.meta).toStrictEqual({
      version: 106,
    });
  });

  it('should set securityAlertsEnabled to true in PreferencesController when missing', async () => {
    const oldStorage = {
      meta: {
        version: 105,
      },
      data: {
        PreferencesController: {},
      },
    };

    const newStorage = await migration106.migrate(
      oldStorage as unknown as MigrationInput,
    );
    expect(newStorage).toStrictEqual({
      meta: {
        version: 106,
      },
      data: {
        PreferencesController: {
          securityAlertsEnabled: true,
        },
      },
    });
  });

  it('should default securityAlertsEnabled to false if transactionSecurityCheckEnabled is set to true', async () => {
    const oldStorage = {
      meta: {
        version: 105,
      },
      data: {
        PreferencesController: {
          transactionSecurityCheckEnabled: true,
        },
      },
    };

    const newStorage = await migration106.migrate(
      oldStorage as unknown as MigrationInput,
    );
    expect(newStorage).toStrictEqual({
      meta: {
        version: 106,
      },
      data: {
        PreferencesController: {
          securityAlertsEnabled: false,
          transactionSecurityCheckEnabled: true,
        },
      },
    });
  });

  it('should preserve other PreferencesController state', async () => {
    const oldStorage = {
      meta: {
        version: 105,
      },
      data: {
        PreferencesController: {
          currentLocale: 'en',
          dismissSeedBackUpReminder: false,
          ipfsGateway: 'dweb.link',
          securityAlertsEnabled: false,
          openSeaEnabled: false,
          useTokenDetection: false,
        },
      },
    };

    const newStorage = await migration106.migrate(
      oldStorage as unknown as MigrationInput,
    );
    expect(newStorage).toStrictEqual({
      meta: {
        version: 106,
      },
      data: {
        PreferencesController: {
          currentLocale: 'en',
          dismissSeedBackUpReminder: false,
          ipfsGateway: 'dweb.link',
          securityAlertsEnabled: false,
          openSeaEnabled: false,
          useTokenDetection: false,
        },
      },
    });
  });

  it('should not change state in controllers other than PreferencesController', async () => {
    const oldStorage = {
      meta: {
        version: 105,
      },
      data: {
        PreferencesController: {},
        data: {
          FooController: { a: 'b' },
        },
      },
    };

    const newStorage = await migration106.migrate(
      oldStorage as unknown as MigrationInput,
    );
    expect(newStorage).toStrictEqual({
      meta: {
        version: 106,
      },
      data: {
        PreferencesController: {
          securityAlertsEnabled: true,
        },
        data: {
          FooController: { a: 'b' },
        },
      },
    });
  });
});
