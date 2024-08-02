import { migrate, version } from './125';

const oldVersion = 124;

describe('migration #125', () => {
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

  it('turns token detection on if basic functionality is on', async () => {
    const oldState = {
      PreferencesController: {
        useExternalServices: true,
        useTokenDetection: false,
      },
    };

    const expectedState = {
      PreferencesController: {
        useExternalServices: true,
        useTokenDetection: true,
      },
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: oldState,
    });

    expect(transformedState.data).toEqual(expectedState);
  });
});
