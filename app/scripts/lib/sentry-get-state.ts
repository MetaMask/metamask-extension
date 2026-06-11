import { getManifestFlags } from '../../../shared/lib/manifestFlags';
import { sentryLogger as log } from '../../../shared/lib/sentry';
import type { Backup } from '../../../shared/lib/stores/persistence-manager';

type SentryAppStateSnapshot = Record<string, unknown>;

type AnalyticsControllerStateFields = {
  analyticsId?: unknown;
  optedIn?: unknown;
};

type MetaMetricsControllerState = {
  completedMetaMetricsOnboarding?: unknown;
};

export type AnalyticsState = {
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
export async function getAnalyticsState(): Promise<AnalyticsState> {
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
    const persistedState = await globalThis.stateHooks.getPersistedState();
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
): AnalyticsState {
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
): Exclude<AnalyticsState, null> {
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
): Exclude<AnalyticsState, null> {
  return getAnalyticsStateFromControllerState(backupState);
}

function getAnalyticsStateFromUIState(
  metamaskState: unknown,
): Exclude<AnalyticsState, null> {
  const { analyticsId, completedMetaMetricsOnboarding, optedIn } =
    metamaskState as AnalyticsControllerStateFields &
      MetaMetricsControllerState;

  return {
    analyticsId: typeof analyticsId === 'string' ? analyticsId : undefined,
    optedIn: optedIn === true,
    completedMetaMetricsOnboarding: completedMetaMetricsOnboarding === true,
  };
}

function getAnalyticsStateFromControllerState(
  state: unknown,
): Exclude<AnalyticsState, null> {
  const controllerState = isRecord(state) ? state : {};
  const analyticsController =
    getControllerState<AnalyticsControllerStateFields>(
      controllerState.AnalyticsController,
    );
  const metaMetricsController = getControllerState<MetaMetricsControllerState>(
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
