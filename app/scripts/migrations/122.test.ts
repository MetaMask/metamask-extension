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

    it('preserves existing PreferencesController properties when preferences is missing', async () => {
      const oldStorage = {
        PreferencesController: {
          selectedAddress: '0x1234567890abcdef1234567890abcdef12345678',
          identities: {
            '0x1234567890abcdef1234567890abcdef12345678': {
              name: 'Account 1',
              address: '0x1234567890abcdef1234567890abcdef12345678',
            },
          },
          tokens: [],
          useTokenDetection: true,
        },
      };

      const expectedState = {
        PreferencesController: {
          selectedAddress: '0x1234567890abcdef1234567890abcdef12345678',
          identities: {
            '0x1234567890abcdef1234567890abcdef12345678': {
              name: 'Account 1',
              address: '0x1234567890abcdef1234567890abcdef12345678',
            },
          },
          tokens: [],
          useTokenDetection: true,
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

    it('preserves selectedAddress and identities when preferences is undefined', async () => {
      const oldStorage = {
        PreferencesController: {
          selectedAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
          identities: {
            '0xabcdef1234567890abcdef1234567890abcdef12': {
              name: 'Test Account',
              address: '0xabcdef1234567890abcdef1234567890abcdef12',
            },
          },
          preferences: undefined,
        },
      };

      const transformedState = await migrate({
        meta: { version: oldVersion },
        data: oldStorage,
      });

      const preferencesController = transformedState.data
        .PreferencesController as Record<string, unknown>;

      expect(preferencesController).toHaveProperty(
        'selectedAddress',
        '0xabcdef1234567890abcdef1234567890abcdef12',
      );
      expect(preferencesController).toHaveProperty('identities');
      expect(
        (preferencesController.preferences as Record<string, unknown>)
          .redesignedConfirmationsEnabled,
      ).toBe(true);
    });
  });
});
