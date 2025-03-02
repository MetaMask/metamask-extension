import { migrate, version } from './132';

const oldVersion = 131;

describe('migration #132', () => {
  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.meta).toStrictEqual({ version });
  });

  it('does nothing if no preferences controller state is set', async () => {
    const oldState = {
      OtherController: {},
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: oldState,
    });

    expect(transformedState.data).toEqual(oldState);
  });

  it('adds preferences property to the controller if it is not set and set the preference to true if migration runs', async () => {
    const oldState = { PreferencesController: {} };

    const expectedState = {
      PreferencesController: {
        preferences: {
          redesignedTransactionsEnabled: true,
        },
      },
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: oldState,
    });

    expect(transformedState.data).toEqual(expectedState);
  });

  it('changes property to true if migration runs', async () => {
    const oldState = {
      PreferencesController: {
        preferences: {
          redesignedTransactionsEnabled: false,
        },
      },
    };

    const expectedState = {
      PreferencesController: {
        preferences: {
          redesignedTransactionsEnabled: true,
        },
      },
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: oldState,
    });

    expect(transformedState.data).toEqual(expectedState);
  });
});
