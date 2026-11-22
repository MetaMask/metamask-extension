import {
  getAnalyticsState,
  getAnalyticsStateFromAppState,
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
        state: {
          metamask: { consentDecisionMade: true, optedIn: true },
        },
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

  describe('getAnalyticsState', () => {
    afterEach(() => {
      deleteStateHookProperty('getPersistedState');
      deleteStateHookProperty('getBackupState');
    });

    it('resolves participation from persisted state when snapshot has no state keys', async () => {
      const getPersistedState = jest.fn().mockResolvedValue({
        data: {
          AnalyticsController: {
            analyticsId: 'id-123',
            optedIn: true,
            consentDecisionMade: true,
          },
        },
      });

      globalThis.stateHooks = {
        ...globalThis.stateHooks,
        getSentryState: () => emptySentrySnapshot(),
        getPersistedState,
        getBackupState: async () => ({}),
      };

      await expect(getAnalyticsState()).resolves.toStrictEqual({
        consentDecisionMade: true,
        optedIn: true,
        analyticsId: 'id-123',
      });
      expect(getPersistedState).toHaveBeenCalledWith({
        reportErrors: false,
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
              consentDecisionMade: true,
            },
          },
        }),
        getBackupState: async () => ({}),
      };

      await expect(getAnalyticsState()).resolves.toStrictEqual({
        consentDecisionMade: true,
        optedIn: false,
        analyticsId: 'id-123',
      });
    });

    it('treats missing or malformed persisted state as not opted in', async () => {
      globalThis.stateHooks = {
        ...globalThis.stateHooks,
        getSentryState: () => emptySentrySnapshot(),
        getPersistedState: async () => undefined,
        getBackupState: async () => ({}),
      };

      await expect(getAnalyticsState()).resolves.toStrictEqual({
        consentDecisionMade: false,
        optedIn: false,
        analyticsId: undefined,
      });

      globalThis.stateHooks = {
        ...globalThis.stateHooks,
        getSentryState: () => emptySentrySnapshot(),
        getPersistedState: async () => ({ data: {} }),
        getBackupState: async () => ({}),
      };

      await expect(getAnalyticsState()).resolves.toStrictEqual({
        consentDecisionMade: false,
        optedIn: false,
        analyticsId: undefined,
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
            consentDecisionMade: true,
          },
        }),
      };

      await expect(getAnalyticsState()).resolves.toStrictEqual({
        consentDecisionMade: true,
        optedIn: true,
        analyticsId: 'backup-id',
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
            consentDecisionMade: true,
          },
        }),
      };

      await expect(getAnalyticsState()).resolves.toStrictEqual({
        consentDecisionMade: true,
        optedIn: false,
        analyticsId: 'backup-id',
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

      await expect(getAnalyticsState()).resolves.toStrictEqual({
        consentDecisionMade: false,
        optedIn: false,
        analyticsId: undefined,
      });

      globalThis.stateHooks = {
        ...globalThis.stateHooks,
        getSentryState: () => emptySentrySnapshot(),
        getPersistedState: async () => {
          throw new Error('persisted unavailable');
        },
        getBackupState: async () => ({}),
      };

      await expect(getAnalyticsState()).resolves.toStrictEqual({
        consentDecisionMade: false,
        optedIn: false,
        analyticsId: undefined,
      });
    });
  });

  describe('getAnalyticsStateFromAppState', () => {
    it('returns null when appState has no state or persistedState', () => {
      expect(getAnalyticsStateFromAppState({})).toBeNull();
    });

    it('delegates to persisted state when persistedState is present', () => {
      const persistedState = {
        data: {
          AnalyticsController: {
            analyticsId: 'persisted-id',
            optedIn: true,
            consentDecisionMade: true,
          },
        },
      };
      expect(getAnalyticsStateFromAppState({ persistedState })).toStrictEqual({
        consentDecisionMade: true,
        optedIn: true,
        analyticsId: 'persisted-id',
      });
    });

    it('returns state from appState.state.metamask when present', () => {
      expect(
        getAnalyticsStateFromAppState({
          state: {
            metamask: {
              analyticsId: 'metamask-id',
              consentDecisionMade: true,
              optedIn: true,
            },
          },
        }),
      ).toStrictEqual({
        consentDecisionMade: true,
        optedIn: true,
        analyticsId: 'metamask-id',
      });
    });

    it('returns incomplete onboarding from appState.state.metamask before opt-in selection', () => {
      expect(
        getAnalyticsStateFromAppState({
          state: {
            metamask: {
              analyticsId: 'metamask-id',
              consentDecisionMade: false,
              optedIn: true,
            },
          },
        }),
      ).toStrictEqual({
        consentDecisionMade: false,
        optedIn: true,
        analyticsId: 'metamask-id',
      });
    });

    it('returns state from controller state when state has no metamask', () => {
      expect(
        getAnalyticsStateFromAppState({
          state: {
            AnalyticsController: {
              analyticsId: 'controller-id',
              optedIn: true,
              consentDecisionMade: true,
            },
          },
        }),
      ).toStrictEqual({
        consentDecisionMade: true,
        optedIn: true,
        analyticsId: 'controller-id',
      });
    });

    it('returns optedIn false with analyticsId when not opted in', () => {
      expect(
        getAnalyticsStateFromAppState({
          state: {
            AnalyticsController: {
              analyticsId: 'controller-id',
              optedIn: false,
              consentDecisionMade: true,
            },
          },
        }),
      ).toStrictEqual({
        consentDecisionMade: true,
        optedIn: false,
        analyticsId: 'controller-id',
      });
    });

    it('returns incomplete onboarding when metrics prompt has not been completed', () => {
      expect(
        getAnalyticsStateFromAppState({
          state: {
            AnalyticsController: {
              analyticsId: 'controller-id',
              optedIn: true,
              consentDecisionMade: false,
            },
          },
        }),
      ).toStrictEqual({
        consentDecisionMade: false,
        optedIn: true,
        analyticsId: 'controller-id',
      });
    });
  });
});
