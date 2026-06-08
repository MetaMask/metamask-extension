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

export type MetaMetricsParticipation = {
  participateInMetaMetrics: boolean | null;
  metaMetricsId?: string;
} | null;

/**
 * Reads the current Sentry debug snapshot from global hooks (sync).
 */
export function getState(): SentryAppStateSnapshot {
  return globalThis.stateHooks?.getSentryState?.() || {};
}

/**
 * Resolves MetaMetrics participation: sync snapshot first, then persisted / backup.
 */
export async function getMetaMetricsState(): Promise<MetaMetricsParticipation> {
  const flags = getManifestFlags();

  if (flags.ci && flags.sentry?.forceEnable) {
    return { participateInMetaMetrics: true, metaMetricsId: undefined };
  }

  const appState = getState();

  if (appState.state || appState.persistedState) {
    return getMetaMetricsStateFromAppState(appState);
  }

  try {
    const persistedState = await globalThis.stateHooks.getPersistedState();
    return getMetaMetricsStateFromPersistedState(persistedState);
  } catch (error) {
    log('Error retrieving persisted state, falling back to backup', error);
    try {
      const { getBackupState } = globalThis.stateHooks;
      if (!getBackupState) {
        return null;
      }
      const backupState = await getBackupState();
      return getMetaMetricsStateFromBackupState(backupState);
    } catch (backupError) {
      log('Error retrieving backup state', backupError);
      return null;
    }
  }
}

/**
 * Returns MetaMetrics state from app snapshot (persisted vs in-memory `state`).
 * @param appState
 */
export function getMetaMetricsStateFromAppState(
  appState: SentryAppStateSnapshot,
): MetaMetricsParticipation {
  if (appState.persistedState) {
    return getMetaMetricsStateFromPersistedState(appState.persistedState);
  }
  if (appState.state) {
    const state = appState.state as Record<string, unknown>;
    if ('metamask' in state && state.metamask !== undefined) {
      return getMetaMetricsStateFromUIState(state.metamask);
    }
    return getMetaMetricsStateFromControllerState(state);
  }
  return null;
}

/**
 * Returns MetaMetrics state from persisted state (e.g. extension storage).
 * @param persistedState
 */
function getMetaMetricsStateFromPersistedState(
  persistedState: unknown,
): Exclude<MetaMetricsParticipation, null> {
  const data = (
    persistedState as { data?: Record<string, unknown> } | undefined
  )?.data;
  return getMetaMetricsStateFromControllerState(data);
}

/**
 * Returns MetaMetrics state from backup state (e.g. IndexedDB).
 * @param backupState
 */
function getMetaMetricsStateFromBackupState(
  backupState: Backup | null,
): Exclude<MetaMetricsParticipation, null> {
  return getMetaMetricsStateFromControllerState(backupState);
}

function getMetaMetricsStateFromUIState(
  metamaskState: unknown,
): Exclude<MetaMetricsParticipation, null> {
  const { analyticsId, completedMetaMetricsOnboarding, optedIn } =
    metamaskState as AnalyticsState & MetaMetricsState;

  return {
    participateInMetaMetrics:
      completedMetaMetricsOnboarding === true ? optedIn === true : null,
    metaMetricsId: typeof analyticsId === 'string' ? analyticsId : undefined,
  };
}

function getMetaMetricsStateFromControllerState(
  state: unknown,
): Exclude<MetaMetricsParticipation, null> {
  const controllerState = isRecord(state) ? state : {};
  const analyticsController = getControllerState<AnalyticsState>(
    controllerState.AnalyticsController,
  );
  const metaMetricsController = getControllerState<MetaMetricsState>(
    controllerState.MetaMetricsController,
  );

  const { analyticsId } = analyticsController ?? {};
  const participateInMetaMetrics =
    analyticsController &&
    metaMetricsController?.completedMetaMetricsOnboarding === true
      ? analyticsController.optedIn === true
      : null;

  return {
    participateInMetaMetrics,
    metaMetricsId: typeof analyticsId === 'string' ? analyticsId : undefined,
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
