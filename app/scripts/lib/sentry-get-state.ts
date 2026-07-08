import { getManifestFlags } from '../../../shared/lib/manifestFlags';
import { sentryLogger as log } from '../../../shared/lib/sentry';
import type { Backup } from '../../../shared/lib/stores/persistence-manager';

type SentryAppStateSnapshot = Record<string, unknown>;

type AnalyticsState = {
  analyticsId?: unknown;
  optedIn?: unknown;
};

type MetaMetricsState = {
  completedMetaMetricsOnboarding?: unknown;
};

export type AnalyticsParticipation = {
  analyticsId?: string;
  optedIn: boolean;
  completedMetaMetricsOnboarding: boolean;
} | null;

/**
 * Reads the current Sentry debug snapshot from global hooks (sync).
 */
export function getState(): SentryAppStateSnapshot {
  return globalThis.stateHooks?.getSentryState?.() || {};
}

/**
 * Resolves analytics state: sync snapshot first, then persisted / backup.
 */
export async function getAnalyticsState(): Promise<AnalyticsParticipation> {
  const flags = getManifestFlags();

  if (flags.ci && flags.sentry?.forceEnable) {
    return {
      analyticsId: undefined,
      optedIn: true,
      completedMetaMetricsOnboarding: true,
    };
  }

  const appState = getState();

  if (appState.state || appState.persistedState) {
    return getAnalyticsStateFromAppState(appState);
  }

  try {
    const persistedState = await globalThis.stateHooks.getPersistedState({
      reportErrors: false,
    });
    return getAnalyticsStateFromPersistedState(persistedState);
  } catch (error) {
    log('Error retrieving persisted state, falling back to backup', error);
    try {
      const { getBackupState } = globalThis.stateHooks;
      if (!getBackupState) {
        return null;
      }
      const backupState = await getBackupState();
      return getAnalyticsStateFromBackupState(backupState);
    } catch (backupError) {
      log('Error retrieving backup state', backupError);
      return null;
    }
  }
}

/**
 * Returns analytics state from app snapshot (persisted vs in-memory `state`).
 * @param appState
 */
export function getAnalyticsStateFromAppState(
  appState: SentryAppStateSnapshot,
): AnalyticsParticipation {
  if (appState.persistedState) {
    return getAnalyticsStateFromPersistedState(appState.persistedState);
  }
  if (appState.state) {
    const state = appState.state as Record<string, unknown>;
    if ('metamask' in state && state.metamask !== undefined) {
      return getAnalyticsStateFromUIState(state.metamask);
    }
    return getAnalyticsStateFromControllerState(state);
  }
  return null;
}

/**
 * Returns analytics state from persisted state (e.g. extension storage).
 * @param persistedState
 */
function getAnalyticsStateFromPersistedState(
  persistedState: unknown,
): Exclude<AnalyticsParticipation, null> {
  const data = (
    persistedState as { data?: Record<string, unknown> } | undefined
  )?.data;
  return getAnalyticsStateFromControllerState(data);
}

/**
 * Returns analytics state from backup state (e.g. IndexedDB).
 * @param backupState
 */
function getAnalyticsStateFromBackupState(
  backupState: Backup | null,
): Exclude<AnalyticsParticipation, null> {
  return getAnalyticsStateFromControllerState(backupState);
}

function getAnalyticsStateFromUIState(
  metamaskState: unknown,
): Exclude<AnalyticsParticipation, null> {
  const { analyticsId, completedMetaMetricsOnboarding, optedIn } =
    metamaskState as AnalyticsState & MetaMetricsState;

  return {
    analyticsId: typeof analyticsId === 'string' ? analyticsId : undefined,
    optedIn: optedIn === true,
    completedMetaMetricsOnboarding: completedMetaMetricsOnboarding === true,
  };
}

function getAnalyticsStateFromControllerState(
  state: unknown,
): Exclude<AnalyticsParticipation, null> {
  const controllerState = isRecord(state) ? state : {};
  const analyticsController = getControllerState<AnalyticsState>(
    controllerState.AnalyticsController,
  );
  const metaMetricsController = getControllerState<MetaMetricsState>(
    controllerState.MetaMetricsController,
  );

  const { analyticsId, optedIn } = analyticsController ?? {};

  return {
    analyticsId: typeof analyticsId === 'string' ? analyticsId : undefined,
    optedIn: optedIn === true,
    completedMetaMetricsOnboarding:
      metaMetricsController?.completedMetaMetricsOnboarding === true,
  };
}

function getControllerState<TControllerState>(
  state: unknown,
): TControllerState | undefined {
  return isRecord(state) ? (state as TControllerState) : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}
