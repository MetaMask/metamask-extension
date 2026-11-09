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
  | 'recent_ui_open'
  | 'recent_ui_interaction'
  | 'recent_connected_dapp_rpc'
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
const STEADY_STATE_PHASES = new Set<ReportedStartupPhase>([
  'initialized',
  'reinitialized',
  'repair-initialized',
]);

/**
 * Placeholder thresholds, to be tuned once `idle_status` data is collected in
 * production.
 */
export const UI_CLOSE_GRACE_MS = 10_000;
export const UI_OPEN_GRACE_MS = 10_000;
export const UI_INTERACTION_GRACE_MS = 30_000;
export const EXTERNAL_RPC_GRACE_MS = 30_000;

/**
 * @param ms - Milliseconds since the signal last fired, if it ever has.
 * @param graceMs - The grace period for this signal.
 * @returns Whether the signal fired within the grace period. `undefined`
 * (never fired) is never "recent".
 */
function isRecent(ms: number | undefined, graceMs: number): ms is number {
  return ms !== undefined && ms < graceMs;
}

type RecentActivityStatus = Extract<
  IdleStatus,
  | 'active_recent_ui_closed'
  | 'active_recent_ui_open'
  | 'active_recent_ui_interaction'
  | 'active_recent_connected_dapp_rpc'
  | 'active_recent_external_extension_rpc'
>;

/**
 * Elapsed-time signals that can mark a write active. Order is the tie-break
 * when two signals share the same timestamp. The smaller elapsed time wins
 * otherwise.
 */
const RECENT_ACTIVITY_CHECKS: {
  status: RecentActivityStatus;
  graceMs: number;
  readMs: (lastActivity: LastActivityContext) => number | undefined;
}[] = [
  {
    status: 'active_recent_ui_closed',
    graceMs: UI_CLOSE_GRACE_MS,
    readMs: (lastActivity) => lastActivity.msSinceLastUiClosed,
  },
  {
    status: 'active_recent_ui_open',
    graceMs: UI_OPEN_GRACE_MS,
    readMs: (lastActivity) => lastActivity.msSinceLastUiOpen,
  },
  {
    status: 'active_recent_ui_interaction',
    graceMs: UI_INTERACTION_GRACE_MS,
    readMs: (lastActivity) => lastActivity.msSinceLastUiInteraction,
  },
  {
    status: 'active_recent_connected_dapp_rpc',
    graceMs: EXTERNAL_RPC_GRACE_MS,
    readMs: (lastActivity) => lastActivity.msSinceLastConnectedDappRpc,
  },
  {
    status: 'active_recent_external_extension_rpc',
    graceMs: EXTERNAL_RPC_GRACE_MS,
    readMs: (lastActivity) => lastActivity.msSinceLastExternalExtensionRpc,
  },
];

/**
 * Picks the qualifying elapsed-time signal with the smallest elapsed time.
 * A signal outside its own grace window does not qualify, even if it is the
 * newest event overall.
 *
 * @param lastActivity - Elapsed-time signals since the last occurrence of
 * each tracked event.
 * @returns The matching active status, or `'idle'` when none qualify.
 */
function mostRecentActivityStatus(
  lastActivity: LastActivityContext,
): IdleStatus {
  let mostRecentMs = Infinity;
  let mostRecentStatus: IdleStatus = 'idle';

  for (const check of RECENT_ACTIVITY_CHECKS) {
    const ms = check.readMs(lastActivity);
    if (!isRecent(ms, check.graceMs)) {
      continue;
    }
    if (ms < mostRecentMs) {
      mostRecentMs = ms;
      mostRecentStatus = check.status;
    }
  }

  return mostRecentStatus;
}

/**
 * Classifies why a sampled State Persist write is or isn't "idle".
 *
 * A non-steady startup phase and an open confirmation describe the current
 * state, so they win over elapsed-time signals. Among elapsed-time signals
 * still inside their own grace window, the most recent one is reported.
 *
 * `msSinceLastWindowEvent` is not checked. Window focus alone is not evidence
 * of MetaMask-specific activity.
 *
 * `msSinceLastDappRpc` and `msSinceLastSnapRpc` are not checked. Unpermissioned
 * pages probe the provider, and Snaps poll housekeeping methods, so both stay
 * hot while the wallet is otherwise quiet. Those signals are still reported on
 * the State Persist trace. Connected-dapp RPC is the dapp input. A user-facing
 * Snap signal is a follow-up. External-extension RPC stays in the classifier
 * because those callers are rare and high-intent.
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

  if (!STEADY_STATE_PHASES.has(currentActivity.startupPhase)) {
    const reason =
      currentActivity.startupPhase === 'unknown'
        ? 'unknown_startup_phase'
        : currentActivity.startupPhase.replaceAll('-', '_');
    return `active_${reason}` as IdleStatus;
  }

  if (currentActivity.notificationIsOpen) {
    return 'active_pending_confirmation';
  }

  return mostRecentActivityStatus(lastActivity);
}
