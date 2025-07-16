import { migrate, version } from './172';

const oldVersion = 171;
const newVersion = 172;

describe(`migration #${newVersion}`, () => {
  it('should update the version metadata', async () => {
    const oldState = {
      meta: {
        version: oldVersion,
      },
      data: {
        PreferencesController: {
          currentLocale: 'en',
          theme: 'dark',
          useBlockie: true,
          currentCurrency: 'EUR',
          preferences: {
            showNativeTokenAsMainBalance: true,
            hideZeroBalanceTokens: true,
          },
        },
      },
    };

    const newState = await migrate(oldState);

    expect(newState.meta.version).toStrictEqual(version);
  });

  describe('when PreferencesController exists with general settings', () => {
    it('should migrate general settings to CorePreferencesController', async () => {
      const oldState = {
        meta: {
          version: oldVersion,
        },
        data: {
          PreferencesController: {
            currentLocale: 'es',
            theme: 'light',
            useBlockie: true,
            currentCurrency: 'GBP',
            preferences: {
              showNativeTokenAsMainBalance: true,
              hideZeroBalanceTokens: false,
            },
          },
        },
      };

      const newState = await migrate(oldState);

      expect(newState.data.CorePreferencesController).toStrictEqual({
        currentLocale: 'es',
        theme: 'light',
        useBlockie: true,
        currentCurrency: 'GBP',
        showNativeTokenAsMainBalance: true,
        hideZeroBalanceTokens: false,
      });
    });

    it('should use default values when properties are missing', async () => {
      const oldState = {
        meta: {
          version: oldVersion,
        },
        data: {
          PreferencesController: {
            currentLocale: 'fr',
            // Missing theme, useBlockie, currentCurrency, and preferences
          },
        },
      };

      const newState = await migrate(oldState);

      expect(newState.data.CorePreferencesController).toStrictEqual({
        currentLocale: 'fr',
        theme: 'auto',
        useBlockie: false,
        currentCurrency: 'USD',
        showNativeTokenAsMainBalance: false,
        hideZeroBalanceTokens: false,
      });
    });

    it('should use default values when preferences object is missing', async () => {
      const oldState = {
        meta: {
          version: oldVersion,
        },
        data: {
          PreferencesController: {
            currentLocale: 'de',
            theme: 'dark',
            useBlockie: false,
            currentCurrency: 'EUR',
            // Missing preferences object
          },
        },
      };

      const newState = await migrate(oldState);

      expect(newState.data.CorePreferencesController).toStrictEqual({
        currentLocale: 'de',
        theme: 'dark',
        useBlockie: false,
        currentCurrency: 'EUR',
        showNativeTokenAsMainBalance: false,
        hideZeroBalanceTokens: false,
      });
    });
  });

  describe('when CorePreferencesController already exists', () => {
    it('should not modify existing CorePreferencesController', async () => {
      const existingCorePrefs = {
        currentLocale: 'ja',
        theme: 'auto',
        useBlockie: true,
        currentCurrency: 'JPY',
        showNativeTokenAsMainBalance: false,
        hideZeroBalanceTokens: true,
      };

      const oldState = {
        meta: {
          version: oldVersion,
        },
        data: {
          CorePreferencesController: existingCorePrefs,
          PreferencesController: {
            currentLocale: 'en',
            theme: 'light',
            useBlockie: false,
            currentCurrency: 'USD',
            preferences: {
              showNativeTokenAsMainBalance: true,
              hideZeroBalanceTokens: false,
            },
          },
        },
      };

      const newState = await migrate(oldState);

      expect(newState.data.CorePreferencesController).toStrictEqual(existingCorePrefs);
    });
  });

  describe('when PreferencesController does not exist', () => {
    it('should not create CorePreferencesController', async () => {
      const oldState = {
        meta: {
          version: oldVersion,
        },
        data: {
          SomeOtherController: {},
        },
      };

      const newState = await migrate(oldState);

      expect(newState.data.CorePreferencesController).toBeUndefined();
    });
  });

  describe('when PreferencesController is not an object', () => {
    it('should not create CorePreferencesController', async () => {
      const oldState = {
        meta: {
          version: oldVersion,
        },
        data: {
          PreferencesController: 'invalid',
        },
      };

      const newState = await migrate(oldState);

      expect(newState.data.CorePreferencesController).toBeUndefined();
    });
  });

  describe('type validation', () => {
    it('should handle invalid types gracefully', async () => {
      const oldState = {
        meta: {
          version: oldVersion,
        },
        data: {
          PreferencesController: {
            currentLocale: 123, // Should be string
            theme: null, // Should be string
            useBlockie: 'true', // Should be boolean
            currentCurrency: [], // Should be string
            preferences: {
              showNativeTokenAsMainBalance: 'yes', // Should be boolean
              hideZeroBalanceTokens: 0, // Should be boolean
            },
          },
        },
      };

      const newState = await migrate(oldState);

      expect(newState.data.CorePreferencesController).toStrictEqual({
        currentLocale: 'en', // Default because 123 is not a string
        theme: 'auto', // Default because null is not a string
        useBlockie: false, // Default because 'true' is not a boolean
        currentCurrency: 'USD', // Default because [] is not a string
        showNativeTokenAsMainBalance: false, // Default because 'yes' is not a boolean
        hideZeroBalanceTokens: false, // Default because 0 is not a boolean
      });
    });
  });
});