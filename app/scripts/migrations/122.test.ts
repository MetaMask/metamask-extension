import { migrate, version } from './122';

const oldVersion = 121;

describe('migration #122', () => {
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

  describe('set redesignedConfirmationsEnabled to true in PreferencesController', () => {
    it('sets redesignedConfirmationsEnabled to true', async () => {
      const oldStorage = {
        PreferencesController: {
          preferences: {
            redesignedConfirmationsEnabled: false,
          },
        },
      };

      const expectedState = {
        PreferencesController: {
          preferences: {
            redesignedConfirmationsEnabled: true,
          },
        },
      };

      const transformedState = await migrate({
        meta: { version: oldVersion },
        data: oldStorage,
      });

      expect(transformedState.data).toEqual(expectedState);
    });

    it(
      'sets redesignedConfirmationsEnabled to true even with original preferences object in the' +
        'state',
      async () => {
        const oldStorage = {
          PreferencesController: {},
        };

        const expectedState = {
          PreferencesController: {
            preferences: {
              redesignedConfirmationsEnabled: true,
            },
          },
        };

        const transformedState = await migrate({
          meta: { version: oldVersion },
          data: oldStorage,
        });

        expect(transformedState.data).toEqual(expectedState);
      },
    );
  });
});
