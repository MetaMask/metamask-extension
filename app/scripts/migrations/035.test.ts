import migration35 from './035';

type MigrationInput = Parameters<typeof migration35.migrate>[0];

describe('migration #35', () => {
  it('should update the version metadata', async () => {
    const oldStorage: MigrationInput = {
      meta: {
        version: 34,
      },
      data: {},
    };

    const newStorage = await migration35.migrate(
      oldStorage as unknown as MigrationInput,
    );
    expect(newStorage.meta.version).toStrictEqual(35);
  });

  it('should delete seedWords', async () => {
    const oldStorage: MigrationInput = {
      meta: { version: 34 },
      data: {
        PreferencesController: {
          seedWords: 'seed words',
        },
      },
    };

    const newStorage = await migration35.migrate(
      oldStorage as unknown as MigrationInput,
    );
    expect(newStorage.data.PreferencesController).toStrictEqual({});
  });

  it('should delete falsy seedWords', async () => {
    const oldStorage: MigrationInput = {
      meta: { version: 34 },
      data: {
        PreferencesController: {
          seedWords: '',
        },
      },
    };

    const newStorage = await migration35.migrate(
      oldStorage as unknown as MigrationInput,
    );
    expect(newStorage.data.PreferencesController).toStrictEqual({});
  });

  it('should leave state without seedWords unchanged', async () => {
    const oldStorage: MigrationInput = {
      meta: { version: 34 },
      data: {
        PreferencesController: {
          frequentRpcListDetail: [],
          accountTokens: {},
          assetImages: {},
          tokens: [],
          suggestedTokens: {},
          useBlockie: false,
          knownMethodData: {},
          participateInMetaMetrics: null,
          firstTimeFlowType: null,
          currentLocale: 'en',
          identities: {},
          lostIdentities: {},
          forgottenPassword: false,
          preferences: {
            useNativeCurrencyAsPrimaryCurrency: true,
          },
          completedOnboarding: false,
          migratedPrivacyMode: false,
          metaMetricsId: null,
          metaMetricsSendCount: 0,
        },
      },
    };

    const newStorage = await migration35.migrate(
      oldStorage as unknown as MigrationInput,
    );
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });
});
