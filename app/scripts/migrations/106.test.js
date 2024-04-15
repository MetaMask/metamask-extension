import { migrate } from './106';

describe('migration #106', () => {
  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 105,
      },
      data: {},
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({
      version: 106,
    });
  });

  it('should set securityAlertsEnabled to true in PreferencesController', async () => {
    const oldStorage = {
      meta: {
        version: 105,
      },
      data: {
        PreferencesController: {
          securityAlertsEnabled: false,
        },
      },
    };

    const newStorage = await migrate(oldStorage);
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

  it('should not set securityAlertsEnabled to true in PreferencesController if transactionSecurityCheckEnabled is set to true', async () => {
    const oldStorage = {
      meta: {
        version: 105,
      },
      data: {
        PreferencesController: {
          securityAlertsEnabled: false,
          transactionSecurityCheckEnabled: true,
        },
      },
    };

    const newStorage = await migrate(oldStorage);
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

    const newStorage = await migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version: 106,
      },
      data: {
        PreferencesController: {
          currentLocale: 'en',
          dismissSeedBackUpReminder: false,
          ipfsGateway: 'dweb.link',
          securityAlertsEnabled: true,
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
        PreferencesController: {
          securityAlertsEnabled: false,
        },
        data: {
          FooController: { a: 'b' },
        },
      },
    };

    const newStorage = await migrate(oldStorage);
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
