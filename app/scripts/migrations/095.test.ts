import { migrate, version } from './093';

describe('migration #93', () => {
  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 90,
      },
      data: {},
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({
      version,
    });
  });

  it('should return state unaltered if there is no preferences controller state', async () => {
    const oldData = {
      other: 'data',
    };
    const oldStorage = {
      meta: {
        version: 90,
      },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('should return state unaltered if there is no preferences controller transaction security check enabled state', async () => {
    const oldData = {
      other: 'data',
      PreferencesController: {
        knownMethodData: {},
        identities: {},
        lostIdentities: {},
        preferences: {},
        snapRegistryList: {},
      },
    };
    const oldStorage = {
      meta: {
        version: 90,
      },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('should remove the transaction security check enabled state and add the security alerts enabled state', async () => {
    const oldData = {
      other: 'data',
      PreferencesController: {
        knownMethodData: {},
        identities: {},
        lostIdentities: {},
        preferences: {},
        snapRegistryList: {},
        transactionSecurityCheckEnabled: true,
      },
    };
    const oldStorage = {
      meta: {
        version: 90,
      },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      other: 'data',
      PreferencesController: {
        knownMethodData: {},
        identities: {},
        lostIdentities: {},
        preferences: {},
        snapRegistryList: {},
        securityAlertsEnabled: true,
      },
    });
  });
});
