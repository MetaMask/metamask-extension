import type { EnvironmentType } from '../../constants/app';
import type { CurrentActivity, IdleStatus } from './idle-status';
import type { LastActivityContext } from './last-activity';

/**
 * Flattens the activity snapshot attached to sampled state writes into bare
 * attribute keys. Callers add their own prefix (`state.write.` on traces,
 * `persistence.` on error reports). Unset signals are omitted.
 *
 * @param currentActivity - Open UIs and startup phase at the time of the event.
 * @param lastActivity - Elapsed time since each tracked event.
 * @param idleStatus - Derived idle classification for this event.
 * @param environmentType - Extension context that observed the event.
 * @returns Value-free attributes. `idle_status` and `environment_type` are
 * always present.
 */
export function buildActivityAttributes(
  currentActivity: CurrentActivity,
  lastActivity: LastActivityContext,
  idleStatus: IdleStatus,
  environmentType: EnvironmentType | 'unknown',
): Record<string, number | string | boolean> {
  const attributes: Record<string, number | string | boolean> = {};
  attributes.environment_type = environmentType;
  attributes.idle_status = idleStatus;

  if (currentActivity.startupPhase !== undefined) {
    attributes.startup_phase = currentActivity.startupPhase;
  }

  if (currentActivity.notificationIsOpen !== undefined) {
    attributes.notification_is_open = currentActivity.notificationIsOpen;
  }

  const uiCounts = {
    popup: currentActivity.popupCount,
    fullscreen: currentActivity.fullscreenCount,
    sidepanel: currentActivity.sidePanelCount,
  } as const;
  for (const [uiType, count] of Object.entries(uiCounts)) {
    if (count !== undefined) {
      attributes[`ui_count.${uiType}`] = count;
    }
  }

  const msSinceSignals: [string, number | undefined][] = [
    ['app_start', lastActivity.msSinceLastAppStart],
    ['last_write', lastActivity.msSinceLastWrite],
    ['ui_open', lastActivity.msSinceLastUiOpen],
    ['ui_closed', lastActivity.msSinceLastUiClosed],
    ['ui_interaction', lastActivity.msSinceLastUiInteraction],
    ['window_event', lastActivity.msSinceLastWindowEvent],
    ['dapp_rpc', lastActivity.msSinceLastDappRpc],
    ['connected_dapp_rpc', lastActivity.msSinceLastConnectedDappRpc],
    ['snap_rpc', lastActivity.msSinceLastSnapRpc],
    ['external_extension_rpc', lastActivity.msSinceLastExternalExtensionRpc],
    ['last_service_worker_reload', lastActivity.msSinceLastServiceWorkerReload],
  ];
  for (const [signal, ms] of msSinceSignals) {
    if (ms !== undefined) {
      attributes[`ms_since_${signal}`] = ms;
    }
  }

  if (lastActivity.serviceWorkerReloadCount !== undefined) {
    attributes.service_worker_reload_count =
      lastActivity.serviceWorkerReloadCount;
  }

  return attributes;
}
