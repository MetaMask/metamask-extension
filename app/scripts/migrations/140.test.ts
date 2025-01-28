import { omit } from 'lodash';
import { migrate, version } from './140';

const oldVersion = 139;

const dataWithAllControllerProperties = {
  AppStateController: {},
  NetworkController: {},
  PreferencesController: {},
};

describe(`migration #${version}`, () => {
  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.meta).toStrictEqual({ version });
  });

  it('does nothing if state has no AppStateController property, even if it has other relevant properties', async () => {
    const data = omit(dataWithAllControllerProperties, 'AppStateController');
    const oldStorage = {
      meta: { version: oldVersion },
      data,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(data);
  });

  it('deletes AppStateController.collectiblesDropdownState from state', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        AppStateController: {
          collectiblesDropdownState: 'test',
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual({
      AppStateController: {},
    });
  });

  it('deletes AppStateController.serviceWorkerLastActiveTime from state', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        AppStateController: {
          serviceWorkerLastActiveTime: 5,
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual({
      AppStateController: {},
    });
  });

  it('deletes AppStateController.showPortfolioTooltip from state', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        AppStateController: {
          showPortfolioTooltip: true,
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual({
      AppStateController: {},
    });
  });

  it('does nothing if state has no NetworkController property, even if it has other relevant properties', async () => {
    const data = omit(dataWithAllControllerProperties, 'NetworkController');
    const oldStorage = {
      meta: { version: oldVersion },
      data,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(data);
  });

  it('deletes NetworkController.networkConfigurations from state', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurations: {
            'AAAA-AAAA-AAAA-AAAA': {
              doesnt: 'matter',
            },
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual({
      NetworkController: {},
    });
  });

  it('deletes NetworkController.providerConfig from state', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          providerConfig: {
            doesnt: 'matter',
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual({
      NetworkController: {},
    });
  });

  it('does nothing if state has no PreferencesController property, even if it has other relevant properties', async () => {
    const data = omit(dataWithAllControllerProperties, 'PreferencesController');
    const oldStorage = {
      meta: { version: oldVersion },
      data,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(data);
  });

  it('deletes PreferencesController.customNetworkListEnabled from state', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        PreferencesController: {
          customNetworkListEnabled: true,
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual({
      PreferencesController: {},
    });
  });

  it('deletes PreferencesController.disabledRpcMethodPreferences from state', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        PreferencesController: {
          disabledRpcMethodPreferences: {
            doesnt: 'matter',
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual({
      PreferencesController: {},
    });
  });

  it('deletes PreferencesController.eip1559V2Enabled from state', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        PreferencesController: {
          eip1559V2Enabled: true,
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual({
      PreferencesController: {},
    });
  });

  it('deletes PreferencesController.hasDismissedOpenSeaToBlockaidBanner from state', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        PreferencesController: {
          hasDismissedOpenSeaToBlockaidBanner: true,
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual({
      PreferencesController: {},
    });
  });

  it('deletes PreferencesController.hasMigratedFromOpenSeaToBlockaid from state', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        PreferencesController: {
          hasMigratedFromOpenSeaToBlockaid: true,
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual({
      PreferencesController: {},
    });
  });

  it('deletes PreferencesController.improvedTokenAllowanceEnabled from state', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        PreferencesController: {
          improvedTokenAllowanceEnabled: true,
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual({
      PreferencesController: {},
    });
  });

  it('deletes PreferencesController.infuraBlocked from state', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        PreferencesController: {
          infuraBlocked: true,
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual({
      PreferencesController: {},
    });
  });

  it('deletes PreferencesController.useCollectibleDetection from state', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        PreferencesController: {
          useCollectibleDetection: true,
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual({
      PreferencesController: {},
    });
  });

  it('deletes PreferencesController.useStaticTokenList from state', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        PreferencesController: {
          useStaticTokenList: true,
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual({
      PreferencesController: {},
    });
  });
});
