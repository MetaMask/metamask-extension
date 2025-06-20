import { migrate, version } from './123';

const oldVersion = 122;

describe('migration #123', () => {
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

  it('does nothing if no preferences state is set', async () => {
    const oldState = {
      PreferencesController: {},
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: oldState,
    });

    expect(transformedState.data).toEqual(oldState);
  });

  it('returns state with advanced details opened if `useNonceField` is enabled', async () => {
    const initialState = {
      PreferencesController: {
        preferences: { showConfirmationAdvancedDetails: false },
        useNonceField: true,
      },
    };
    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: initialState,
    });

    expect(transformedState).toEqual({
      meta: { version: oldVersion + 1 },
      data: {
        ...initialState,
        PreferencesController: {
          ...initialState.PreferencesController,
          preferences: { showConfirmationAdvancedDetails: true },
        },
      },
    });
  });

  it('returns state with advanced details opened if `sendHexData` is enabled', async () => {
    const initialState = {
      PreferencesController: {
        preferences: { showConfirmationAdvancedDetails: false },
        featureFlags: {
          sendHexData: true,
        },
      },
    };
    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: initialState,
    });

    expect(transformedState).toEqual({
      meta: { version: oldVersion + 1 },
      data: {
        ...initialState,
        PreferencesController: {
          ...initialState.PreferencesController,
          preferences: { showConfirmationAdvancedDetails: true },
        },
      },
    });
  });

  it('returns state with advanced details closed if `sendHexData` and `useNonceField` are disabled', async () => {
    const initialState = {
      PreferencesController: {
        preferences: { showConfirmationAdvancedDetails: false },
        useNonceField: false,
        featureFlags: {
          sendHexData: false,
        },
      },
    };
    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: initialState,
    });

    expect(transformedState).toEqual({
      meta: { version: oldVersion + 1 },
      data: {
        ...initialState,
        PreferencesController: {
          ...initialState.PreferencesController,
          preferences: { showConfirmationAdvancedDetails: false },
        },
      },
    });
  });
});
