import { migrate, version } from './170';

const oldVersion = 169;

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
          disabledUpgradeAccountsByChain: {},
          accountUpgradeDisabledChains: [],
        },
      },
    };
    const expectedData = {
      PreferencesController: {},
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
