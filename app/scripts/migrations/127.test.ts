import { migrate, version } from './127';

const oldVersion = 126;

describe(`migration #${version}`, () => {
  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.meta).toStrictEqual({ version });
  });

  it('Removes useNativeCurrencyAsPrimaryCurrency from the PreferencesController.preferences  state', async () => {
    const oldState = {
      PreferencesController: {
        preferences: {
          hideZeroBalanceTokens: false,
          showTestNetworks: true,
          useNativeCurrencyAsPrimaryCurrency: true,
        },
      },
    };
    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: oldState,
    });

    delete (
      oldState.PreferencesController.preferences as {
        useNativeCurrencyAsPrimaryCurrency?: boolean;
      }
    ).useNativeCurrencyAsPrimaryCurrency;
    expect(transformedState.data).toStrictEqual(oldState);
  });
});
