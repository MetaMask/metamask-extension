import { getManifestFlags } from '../../../shared/lib/manifestFlags';
import { sentryLogger as log } from '../../../shared/lib/sentry';

type SentryAppStateSnapshot = Record<string, unknown>;

export type MetaMetricsParticipation = {
  participateInMetaMetrics: boolean;
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
      const metamask = state.metamask as {
        participateInMetaMetrics?: boolean;
        metaMetricsId?: string;
      };
      const enabled = Boolean(metamask.participateInMetaMetrics);
      return {
        participateInMetaMetrics: enabled,
        metaMetricsId: enabled ? metamask.metaMetricsId : undefined,
      };
    }
    const controller = state.MetaMetricsController as
      | {
          participateInMetaMetrics?: boolean;
          metaMetricsId?: string;
        }
      | undefined;
    const enabled = Boolean(controller?.participateInMetaMetrics);
    return {
      participateInMetaMetrics: enabled,
      metaMetricsId: enabled ? controller?.metaMetricsId : undefined,
    };
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
  const controller = data?.MetaMetricsController as
    | {
        participateInMetaMetrics?: boolean;
        metaMetricsId?: string;
      }
    | undefined;
  const enabled = Boolean(controller?.participateInMetaMetrics);
  return {
    participateInMetaMetrics: enabled,
    metaMetricsId: enabled ? controller?.metaMetricsId : undefined,
  };
}

/**
 * Returns MetaMetrics state from backup state (e.g. IndexedDB).
 * @param backupState
 */
function getMetaMetricsStateFromBackupState(
  backupState: unknown,
): Exclude<MetaMetricsParticipation, null> {
  const controller = (backupState as Record<string, unknown> | undefined)
    ?.MetaMetricsController as
    | {
        participateInMetaMetrics?: boolean;
        metaMetricsId?: string;
      }
    | undefined;
  const enabled = Boolean(controller?.participateInMetaMetrics);
  return {
    participateInMetaMetrics: enabled,
    metaMetricsId: enabled ? controller?.metaMetricsId : undefined,
  };
}
