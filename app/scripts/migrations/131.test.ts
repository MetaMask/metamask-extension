import { migrate, version } from './131';

const oldVersion = 130;

describe(`migration #${version}`, () => {
  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.meta).toStrictEqual({ version });
  });

  it('Removes useRequestQueue from PreferencesController properly', async () => {
    const oldState = {
      PreferencesController: {
        preferences: {
          hideZeroBalanceTokens: false,
          showTestNetworks: true,
        },
        useRequestQueue: true,
      },
    };
    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: oldState,
    });

    expect(transformedState.data).toStrictEqual({
      ...oldState,
      PreferencesController: {
        preferences: {
          hideZeroBalanceTokens: false,
          showTestNetworks: true,
        },
      },
    });
  });
});
