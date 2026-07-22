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
        state: { metamask: { remoteFeatureFlags: { [FLAG]: true } } },
      };

      expect(getFeatureFlagTags(appState, configs)).toStrictEqual({
        [TAG]: 'true',
      });
    });

    it('reads flags from the background post-init shape (state.RemoteFeatureFlagController.remoteFeatureFlags)', () => {
      const appState = {
        state: {
          RemoteFeatureFlagController: {
            remoteFeatureFlags: { [FLAG]: false },
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
                [FLAG]: { enabled: true, minimumVersion: '0.0.0' },
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
              [FLAG]: { enabled: true, minimumVersion: '0.0.0' },
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
              [FLAG]: { enabled: true, minimumVersion: '999.999.999' },
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
        state: { metamask: { remoteFeatureFlags: { otherFlag: true } } },
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
            remoteFeatureFlags: { someFlag: { name: 'groupA', value: 'x' } },
          },
        },
      };

      const tags = getFeatureFlagTags(appState, [
        {
          name: 'someFlag',
          tag: 'ab.someFlag',
          resolve: (value) => (value as { name: string }).name,
        },
      ]);

      expect(tags).toStrictEqual({ 'ab.someFlag': 'groupA' });
    });

    it('tags multiple flags in one pass', () => {
      const appState = {
        state: {
          metamask: {
            remoteFeatureFlags: { flagA: true, flagB: false },
          },
        },
      };

      expect(
        getFeatureFlagTags(appState, [{ name: 'flagA' }, { name: 'flagB' }]),
      ).toStrictEqual({
        'featureFlag.flagA': 'true',
        'featureFlag.flagB': 'false',
      });
    });
  });
});
