import type { ReportedStartupPhase } from './startup-phase';
import type { LastActivityContext } from './last-activity';

/**
 * UI presence from `uiPresence` plus {@link ReportedStartupPhase} at write
 * time. All fields undefined when no provider ran (UI context, not wired yet,
 * or threw).
 */
export type CurrentActivity = {
  startupPhase?: ReportedStartupPhase;
  popupCount?: number;
  notificationIsOpen?: boolean;
  fullscreenCount?: number;
  sidePanelCount?: number;
};

/**
 * Non-steady-state {@link ReportedStartupPhase} values, snake_cased, plus the
 * literal `'unknown'` phase (renamed to avoid colliding with the overall
 * `'unknown'` {@link IdleStatus}).
 */
type StartupActiveReason =
  | 'initializing'
  | 'setting_up_controller'
  | 'reinitializing'
  | 'resetting_up_controller'
  | 'repairing'
  | 'repair_resetting'
  | 'repair_initializing'
  | 'repair_setting_up_controller'
  | 'shutting_down'
  | 'unknown_startup_phase';

type ActiveReason =
  | StartupActiveReason
  | 'pending_confirmation'
  | 'recent_ui_closed'
  | 'recent_ui_interaction'
  | 'recent_dapp_rpc'
  | 'recent_snap_rpc'
  | 'recent_external_extension_rpc';

/**
 * Classification of a sampled State Persist write.
 *
 * `'unknown'` means there isn't enough data to tell (no current-activity
 * provider wired, or running in a UI context). `active_*` values each name
 * the single reason the write wasn't considered idle.
 */
export type IdleStatus = 'unknown' | 'idle' | `active_${ActiveReason}`;

/**
 * Startup phases considered steady state (not a lifecycle transition).
 * Covers cold start, warm restart, and vault repair.
 */
const STEADY_STATE_PHASES: ReportedStartupPhase[] = [
  'initialized',
  'reinitialized',
  'repair-initialized',
];

/**
 * Placeholder thresholds, to be tuned once `idle_status` data is collected in
 * production.
 */
export const UI_CLOSE_GRACE_MS = 5_000;
export const UI_INTERACTION_GRACE_MS = 30_000;
export const EXTERNAL_RPC_GRACE_MS = 30_000;

/**
 * @param ms - Milliseconds since the signal last fired, if it ever has.
 * @param graceMs - The grace period for this signal.
 * @returns Whether the signal fired within the grace period. `undefined`
 * (never fired) is never "recent".
 */
function isRecent(ms: number | undefined, graceMs: number): boolean {
  return ms !== undefined && ms < graceMs;
}

/**
 * Classifies why a sampled State Persist write is or isn't "idle".
 *
 * Checks run in priority order; only the first match is reported. Lifecycle
 * transitions and a pending confirmation always win. `msSinceLastWindowEvent`
 * is deliberately not checked: window focus alone isn't evidence of
 * MetaMask-specific activity.
 *
 * @param currentActivity - Snapshot of open UIs and startup phase.
 * @param lastActivity - Elapsed-time signals since the last occurrence of
 * each tracked event.
 * @returns The classification for this write.
 */
export function getIdleStatus(
  currentActivity: CurrentActivity,
  lastActivity: LastActivityContext,
): IdleStatus {
  if (currentActivity.startupPhase === undefined) {
    return 'unknown';
  }

  if (!STEADY_STATE_PHASES.includes(currentActivity.startupPhase)) {
    const reason =
      currentActivity.startupPhase === 'unknown'
        ? 'unknown_startup_phase'
        : currentActivity.startupPhase.replaceAll('-', '_');
    return `active_${reason}` as IdleStatus;
  }

  if (currentActivity.notificationIsOpen) {
    return 'active_pending_confirmation';
  }

  if (isRecent(lastActivity.msSinceLastUiClosed, UI_CLOSE_GRACE_MS)) {
    return 'active_recent_ui_closed';
  }

  if (
    isRecent(lastActivity.msSinceLastUiInteraction, UI_INTERACTION_GRACE_MS)
  ) {
    return 'active_recent_ui_interaction';
  }

  if (isRecent(lastActivity.msSinceLastDappRpc, EXTERNAL_RPC_GRACE_MS)) {
    return 'active_recent_dapp_rpc';
  }

  if (isRecent(lastActivity.msSinceLastSnapRpc, EXTERNAL_RPC_GRACE_MS)) {
    return 'active_recent_snap_rpc';
  }

  if (
    isRecent(
      lastActivity.msSinceLastExternalExtensionRpc,
      EXTERNAL_RPC_GRACE_MS,
    )
  ) {
    return 'active_recent_external_extension_rpc';
  }

  return 'idle';
}
