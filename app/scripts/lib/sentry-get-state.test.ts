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
            MetaMetricsController: {
              participateInMetaMetrics: true,
              metaMetricsId: 'id-123',
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
            MetaMetricsController: { participateInMetaMetrics: false },
          },
        }),
        getBackupState: async () => ({}),
      };

      await expect(getMetaMetricsState()).resolves.toStrictEqual({
        participateInMetaMetrics: false,
        metaMetricsId: undefined,
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
        participateInMetaMetrics: false,
        metaMetricsId: undefined,
      });

      globalThis.stateHooks = {
        ...globalThis.stateHooks,
        getSentryState: () => emptySentrySnapshot(),
        getPersistedState: async () => ({ data: {} }),
        getBackupState: async () => ({}),
      };

      await expect(getMetaMetricsState()).resolves.toStrictEqual({
        participateInMetaMetrics: false,
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
          MetaMetricsController: {
            participateInMetaMetrics: true,
            metaMetricsId: 'backup-id',
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
          MetaMetricsController: { participateInMetaMetrics: false },
        }),
      };

      await expect(getMetaMetricsState()).resolves.toStrictEqual({
        participateInMetaMetrics: false,
        metaMetricsId: undefined,
      });
    });

    it('treats missing or empty backup state as not opted in after persisted throws', async () => {
      globalThis.stateHooks = {
        ...globalThis.stateHooks,
        getSentryState: () => emptySentrySnapshot(),
        getPersistedState: async () => {
          throw new Error('persisted unavailable');
        },
        getBackupState: async () => undefined,
      };

      await expect(getMetaMetricsState()).resolves.toStrictEqual({
        participateInMetaMetrics: false,
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
        participateInMetaMetrics: false,
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
          MetaMetricsController: {
            participateInMetaMetrics: true,
            metaMetricsId: 'persisted-id',
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

    it('returns state from appState.state.MetaMetricsController when state has no metamask', () => {
      expect(
        getMetaMetricsStateFromAppState({
          state: {
            MetaMetricsController: {
              participateInMetaMetrics: true,
              metaMetricsId: 'controller-id',
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
            MetaMetricsController: { participateInMetaMetrics: false },
          },
        }),
      ).toStrictEqual({
        participateInMetaMetrics: false,
        metaMetricsId: undefined,
      });
    });
  });
});
