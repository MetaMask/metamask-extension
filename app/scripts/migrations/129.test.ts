import { migrate, version } from './129';

const oldVersion = 128;

describe(`migration #${version}`, () => {
  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.meta).toStrictEqual({ version });
  });

  it('Adds shouldShowAggregatedBalancePopover to the PreferencesController.preferences state when its undefined', async () => {
    const oldState = {
      PreferencesController: {
        preferences: {
          hideZeroBalanceTokens: false,
          showTestNetworks: true,
        },
      },
    };
    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: oldState,
    });

    expect(transformedState.data).toStrictEqual({
      ...oldState,
      PreferencesController: {
        ...oldState.PreferencesController,
        preferences: {
          ...oldState.PreferencesController.preferences,
          shouldShowAggregatedBalancePopover: true,
        },
      },
    });
  });

  it('Does not add shouldShowAggregatedBalancePopover to the PreferencesController.preferences state when its defined', async () => {
    const oldState = {
      PreferencesController: {
        preferences: {
          hideZeroBalanceTokens: false,
          showTestNetworks: true,
          shouldShowAggregatedBalancePopover: false,
        },
      },
    };
    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: oldState,
    });

    expect(transformedState.data).toStrictEqual(oldState);
  });
});
