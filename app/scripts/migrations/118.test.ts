import { migrate, version } from './119';

const oldVersion = 118;

describe('migration #119', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: oldVersion,
      },
      data: {},
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.meta).toStrictEqual({ version });
  });

  describe('set useRequestQueue to true in PreferencesController', () => {
    it('sets useRequestQueue to true', async () => {
      const oldStorage = {
        PreferencesController: {
          useRequestQueue: false,
        },
      };

      const expectedState = {
        PreferencesController: {
          useRequestQueue: true,
        },
      };

      const transformedState = await migrate({
        meta: { version: oldVersion },
        data: oldStorage,
      });

      expect(transformedState.data).toEqual(expectedState);
    });

    it('should not update useRequestQueue value if it was set true in initial state', async () => {
      const oldStorage = {
        PreferencesController: {
          useRequestQueue: true,
        },
      };

      const expectedState = {
        PreferencesController: {
          useRequestQueue: true,
        },
      };

      const transformedState = await migrate({
        meta: { version: oldVersion },
        data: oldStorage,
      });

      expect(transformedState.data).toEqual(expectedState);
    });
  });
});
