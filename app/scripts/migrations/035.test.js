import { strict as assert } from 'assert';
import migration35 from './035';

describe('migration #35', function () {
  it('should update the version metadata', function (done) {
    const oldStorage = {
      meta: {
        version: 34,
      },
      data: {},
    };

    migration35
      .migrate(oldStorage)
      .then((newStorage) => {
        assert.deepEqual(newStorage.meta, {
          version: 35,
        });
        done();
      })
      .catch(done);
  });

  it('should delete seedWords', function (done) {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          seedWords: 'seed words',
        },
      },
    };

    migration35
      .migrate(oldStorage)
      .then((newStorage) => {
        assert.deepEqual(newStorage.data.PreferencesController, {});
        done();
      })
      .catch(done);
  });

  it('should delete falsy seedWords', function (done) {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          seedWords: '',
        },
      },
    };

    migration35
      .migrate(oldStorage)
      .then((newStorage) => {
        assert.deepEqual(newStorage.data.PreferencesController, {});
        done();
      })
      .catch(done);
  });

  it('should leave state without seedWords unchanged', function (done) {
    const oldStorage = {
      meta: {},
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

    migration35
      .migrate(oldStorage)
      .then((newStorage) => {
        assert.deepEqual(newStorage.data, oldStorage.data);
        done();
      })
      .catch(done);
  });
});
