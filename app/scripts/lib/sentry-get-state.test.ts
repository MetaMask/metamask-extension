import {
  getMetaMetricsState,
  getMetaMetricsStateFromAppState,
  getState,
} from './sentry-get-state';

/** Matches `StateHooks.getSentryState` so tests satisfy `types/global.d.ts`. */
function emptySentrySnapshot(): ReturnType<
  (typeof globalThis.stateHooks)['getSentryState']
> {
  return { browser: 'jest', version: '0' };
}

function deleteStateHookProperty(
  key: keyof typeof globalThis.stateHooks,
): void {
  Reflect.deleteProperty(
    globalThis.stateHooks as unknown as Record<string, unknown>,
    key,
  );
}

describe('sentry-get-state', () => {
  describe('getState', () => {
    afterEach(() => {
      deleteStateHookProperty('getSentryState');
    });

    it('returns the snapshot from getSentryState when present', () => {
      const snapshot = {
        ...emptySentrySnapshot(),
        state: { metamask: { participateInMetaMetrics: true } },
      };
      globalThis.stateHooks = {
        ...globalThis.stateHooks,
        getSentryState: () => snapshot,
      };

      expect(getState()).toStrictEqual(snapshot);
    });

    it('returns empty object when getSentryState is missing or returns falsy', () => {
      const hooks = { ...globalThis.stateHooks };
      Reflect.deleteProperty(
        hooks as unknown as Record<string, unknown>,
        'getSentryState',
      );
      globalThis.stateHooks = hooks as typeof globalThis.stateHooks;

      expect(getState()).toStrictEqual({});

      globalThis.stateHooks = {
        ...globalThis.stateHooks,
        getSentryState: () =>
          undefined as unknown as ReturnType<
            NonNullable<typeof globalThis.stateHooks.getSentryState>
          >,
      };

      expect(getState()).toStrictEqual({});
    });
  });

  describe('getMetaMetricsState', () => {
    afterEach(() => {
      deleteStateHookProperty('getPersistedState');
      deleteStateHookProperty('getBackupState');
    });

    it('resolves participation from persisted state when snapshot has no state keys', async () => {
      globalThis.stateHooks = {
        ...globalThis.stateHooks,
        getSentryState: () => emptySentrySnapshot(),
        getPersistedState: async () => ({
          data: {
            AnalyticsController: {
              analyticsId: 'id-123',
              optedIn: true,
            },
            MetaMetricsController: {
              completedMetaMetricsOnboarding: true,
            },
          },
        }),
        getBackupState: async () => ({}),
      };

      await expect(getMetaMetricsState()).resolves.toStrictEqual({
        participateInMetaMetrics: true,
        metaMetricsId: 'id-123',
      });
    });

    it('resolves participation false from persisted state when not opted in', async () => {
      globalThis.stateHooks = {
        ...globalThis.stateHooks,
        getSentryState: () => emptySentrySnapshot(),
        getPersistedState: async () => ({
          data: {
            AnalyticsController: {
              analyticsId: 'id-123',
              optedIn: false,
            },
            MetaMetricsController: {
              completedMetaMetricsOnboarding: true,
            },
          },
        }),
        getBackupState: async () => ({}),
      };

      await expect(getMetaMetricsState()).resolves.toStrictEqual({
        participateInMetaMetrics: false,
        metaMetricsId: 'id-123',
      });
    });

    it('treats missing or malformed persisted state as not opted in', async () => {
      globalThis.stateHooks = {
        ...globalThis.stateHooks,
        getSentryState: () => emptySentrySnapshot(),
        getPersistedState: async () => undefined,
        getBackupState: async () => ({}),
      };

      await expect(getMetaMetricsState()).resolves.toStrictEqual({
        participateInMetaMetrics: null,
        metaMetricsId: undefined,
      });

      globalThis.stateHooks = {
        ...globalThis.stateHooks,
        getSentryState: () => emptySentrySnapshot(),
        getPersistedState: async () => ({ data: {} }),
        getBackupState: async () => ({}),
      };

      await expect(getMetaMetricsState()).resolves.toStrictEqual({
        participateInMetaMetrics: null,
        metaMetricsId: undefined,
      });
    });

    it('resolves participation from backup when getPersistedState throws', async () => {
      globalThis.stateHooks = {
        ...globalThis.stateHooks,
        getSentryState: () => emptySentrySnapshot(),
        getPersistedState: async () => {
          throw new Error('persisted unavailable');
        },
        getBackupState: async () => ({
          AnalyticsController: {
            analyticsId: 'backup-id',
            optedIn: true,
          },
          MetaMetricsController: {
            completedMetaMetricsOnboarding: true,
          },
        }),
      };

      await expect(getMetaMetricsState()).resolves.toStrictEqual({
        participateInMetaMetrics: true,
        metaMetricsId: 'backup-id',
      });
    });

    it('resolves participation false from backup when not opted in', async () => {
      globalThis.stateHooks = {
        ...globalThis.stateHooks,
        getSentryState: () => emptySentrySnapshot(),
        getPersistedState: async () => {
          throw new Error('persisted unavailable');
        },
        getBackupState: async () => ({
          AnalyticsController: {
            analyticsId: 'backup-id',
            optedIn: false,
          },
          MetaMetricsController: {
            completedMetaMetricsOnboarding: true,
          },
        }),
      };

      await expect(getMetaMetricsState()).resolves.toStrictEqual({
        participateInMetaMetrics: false,
        metaMetricsId: 'backup-id',
      });
    });

    it('treats missing or empty backup state as not opted in after persisted throws', async () => {
      globalThis.stateHooks = {
        ...globalThis.stateHooks,
        getSentryState: () => emptySentrySnapshot(),
        getPersistedState: async () => {
          throw new Error('persisted unavailable');
        },
        getBackupState: async () => null,
      };

      await expect(getMetaMetricsState()).resolves.toStrictEqual({
        participateInMetaMetrics: null,
        metaMetricsId: undefined,
      });

      globalThis.stateHooks = {
        ...globalThis.stateHooks,
        getSentryState: () => emptySentrySnapshot(),
        getPersistedState: async () => {
          throw new Error('persisted unavailable');
        },
        getBackupState: async () => ({}),
      };

      await expect(getMetaMetricsState()).resolves.toStrictEqual({
        participateInMetaMetrics: null,
        metaMetricsId: undefined,
      });
    });
  });

  describe('getMetaMetricsStateFromAppState', () => {
    it('returns null when appState has no state or persistedState', () => {
      expect(getMetaMetricsStateFromAppState({})).toBeNull();
    });

    it('delegates to persisted state when persistedState is present', () => {
      const persistedState = {
        data: {
          AnalyticsController: {
            analyticsId: 'persisted-id',
            optedIn: true,
          },
          MetaMetricsController: {
            completedMetaMetricsOnboarding: true,
          },
        },
      };
      expect(getMetaMetricsStateFromAppState({ persistedState })).toStrictEqual(
        {
          participateInMetaMetrics: true,
          metaMetricsId: 'persisted-id',
        },
      );
    });

    it('returns state from appState.state.metamask when present', () => {
      expect(
        getMetaMetricsStateFromAppState({
          state: {
            metamask: {
              participateInMetaMetrics: true,
              metaMetricsId: 'metamask-id',
            },
          },
        }),
      ).toStrictEqual({
        participateInMetaMetrics: true,
        metaMetricsId: 'metamask-id',
      });
    });

    it('returns null participation from appState.state.metamask before opt-in selection', () => {
      expect(
        getMetaMetricsStateFromAppState({
          state: {
            metamask: {
              participateInMetaMetrics: null,
              metaMetricsId: 'metamask-id',
            },
          },
        }),
      ).toStrictEqual({
        participateInMetaMetrics: null,
        metaMetricsId: 'metamask-id',
      });
    });

    it('returns state from controller state when state has no metamask', () => {
      expect(
        getMetaMetricsStateFromAppState({
          state: {
            AnalyticsController: {
              analyticsId: 'controller-id',
              optedIn: true,
            },
            MetaMetricsController: {
              completedMetaMetricsOnboarding: true,
            },
          },
        }),
      ).toStrictEqual({
        participateInMetaMetrics: true,
        metaMetricsId: 'controller-id',
      });
    });

    it('returns participateInMetaMetrics false and no metaMetricsId when not opted in', () => {
      expect(
        getMetaMetricsStateFromAppState({
          state: {
            AnalyticsController: {
              analyticsId: 'controller-id',
              optedIn: false,
            },
            MetaMetricsController: {
              completedMetaMetricsOnboarding: true,
            },
          },
        }),
      ).toStrictEqual({
        participateInMetaMetrics: false,
        metaMetricsId: 'controller-id',
      });
    });

    it('returns participateInMetaMetrics null when onboarding is incomplete', () => {
      expect(
        getMetaMetricsStateFromAppState({
          state: {
            AnalyticsController: {
              analyticsId: 'controller-id',
              optedIn: true,
            },
            MetaMetricsController: {
              completedMetaMetricsOnboarding: false,
            },
          },
        }),
      ).toStrictEqual({
        participateInMetaMetrics: null,
        metaMetricsId: 'controller-id',
      });
    });
  });
});
