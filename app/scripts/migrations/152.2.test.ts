import { migrate, version } from './152.2';

const oldVersion = 152.1;

describe(`migration #${version}`, () => {
  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({ version });
  });

  it('removes the disabledUpgradeAccountsByChain preference', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        PreferencesController: {
          preferences: {
            disabledUpgradeAccountsByChain: {},
            accountUpgradeDisabledChains: {},
          },
        },
      },
    };
    const expectedData = {
      PreferencesController: {
        preferences: {},
      },
    };
    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(expectedData);
  });

  it('does nothing to other PreferencesController state if there is not a petnamesEnabled preference', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        PreferencesController: {
          existingPreference: true,
        },
      },
    };

    const expectedData = {
      PreferencesController: {
        existingPreference: true,
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(expectedData);
  });
});
