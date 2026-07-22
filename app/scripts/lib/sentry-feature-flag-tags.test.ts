import {
  getFeatureFlagTags,
  type FeatureFlagTagConfig,
} from './sentry-feature-flag-tags';

const FLAG = 'platformPersistenceSuspendWritesOnShutdown';
const TAG = `featureFlag.${FLAG}`;

const configs: FeatureFlagTagConfig[] = [{ name: FLAG }];

describe('getFeatureFlagTags', () => {
  describe('appState shapes', () => {
    it('reads flags from the UI post-init shape (state.metamask.remoteFeatureFlags)', () => {
      const appState = {
        state: {
          metamask: {
            remoteFeatureFlags: {
              platformPersistenceSuspendWritesOnShutdown: true,
            },
          },
        },
      };

      expect(getFeatureFlagTags(appState, configs)).toStrictEqual({
        [TAG]: 'true',
      });
    });

    it('reads flags from the background post-init shape (state.RemoteFeatureFlagController.remoteFeatureFlags)', () => {
      const appState = {
        state: {
          RemoteFeatureFlagController: {
            remoteFeatureFlags: {
              platformPersistenceSuspendWritesOnShutdown: false,
            },
          },
        },
      };

      expect(getFeatureFlagTags(appState, configs)).toStrictEqual({
        [TAG]: 'false',
      });
    });

    it('reads flags from the pre-init persisted shape (persistedState.data.RemoteFeatureFlagController.remoteFeatureFlags)', () => {
      const appState = {
        persistedState: {
          data: {
            RemoteFeatureFlagController: {
              remoteFeatureFlags: {
                platformPersistenceSuspendWritesOnShutdown: {
                  enabled: true,
                  minimumVersion: '0.0.0',
                },
              },
            },
          },
        },
      };

      expect(getFeatureFlagTags(appState, configs)).toStrictEqual({
        [TAG]: 'true',
      });
    });
  });

  describe('effective (version-gated) value', () => {
    it('resolves a satisfied version gate to "true"', () => {
      const appState = {
        state: {
          metamask: {
            remoteFeatureFlags: {
              platformPersistenceSuspendWritesOnShutdown: {
                enabled: true,
                minimumVersion: '0.0.0',
              },
            },
          },
        },
      };

      expect(getFeatureFlagTags(appState, configs)).toStrictEqual({
        [TAG]: 'true',
      });
    });

    it('resolves an unsatisfied version gate to "false"', () => {
      const appState = {
        state: {
          metamask: {
            remoteFeatureFlags: {
              platformPersistenceSuspendWritesOnShutdown: {
                enabled: true,
                minimumVersion: '999.999.999',
              },
            },
          },
        },
      };

      expect(getFeatureFlagTags(appState, configs)).toStrictEqual({
        [TAG]: 'false',
      });
    });
  });

  describe('missing data', () => {
    it('returns "unset" when the app state has no flags map', () => {
      expect(getFeatureFlagTags({}, configs)).toStrictEqual({ [TAG]: 'unset' });
    });

    it('returns "unset" when appState is undefined', () => {
      expect(getFeatureFlagTags(undefined, configs)).toStrictEqual({
        [TAG]: 'unset',
      });
    });

    it('returns "unset" when the flags map lacks the flag', () => {
      const appState = {
        state: {
          metamask: {
            remoteFeatureFlags: { rampsEnabled: true },
          },
        },
      };

      expect(getFeatureFlagTags(appState, configs)).toStrictEqual({
        [TAG]: 'unset',
      });
    });
  });

  describe('config overrides', () => {
    it('honors a custom tag key and resolver', () => {
      const appState = {
        state: {
          metamask: {
            remoteFeatureFlags: {
              enableMultichainAccounts: true,
            },
          },
        },
      };

      const tags = getFeatureFlagTags(appState, [
        {
          name: 'enableMultichainAccounts',
          tag: 'ab.enableMultichainAccounts',
          resolve: (value) => (value === true ? 'on' : 'off'),
        },
      ]);

      expect(tags).toStrictEqual({ 'ab.enableMultichainAccounts': 'on' });
    });

    it('tags multiple flags in one pass', () => {
      const appState = {
        state: {
          metamask: {
            remoteFeatureFlags: {
              rampsEnabled: true,
              rampsServiceDisruption: false,
            },
          },
        },
      };

      expect(
        getFeatureFlagTags(appState, [
          { name: 'rampsEnabled' },
          { name: 'rampsServiceDisruption' },
        ]),
      ).toStrictEqual({
        'featureFlag.rampsEnabled': 'true',
        'featureFlag.rampsServiceDisruption': 'false',
      });
    });
  });
});
