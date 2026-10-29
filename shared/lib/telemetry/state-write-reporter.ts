import type { SplitStateWriteEvent } from '../stores/persistence-manager';
import { trace, TraceName, TraceOperation } from '../trace';

/**
 * Sentry transaction name for sampled split-state persistence writes.
 * Must match the `State Persist` early-return in `createTracesSampler`.
 */
export const STATE_WRITE_TRACE_NAME = TraceName.StatePersist;

/**
 * Reports a sampled split-state persistence write without exposing state
 * values.
 *
 * @param event - Value-free measurements for one persisted batch.
 */
export function trackSplitStateWrite(event: SplitStateWriteEvent): void {
  const data: Record<string, number | string | boolean> = {
    'state.write.coalesced_updates': event.coalescedUpdates,
    'state.write.controller_count': event.bytesByController.size,
    'state.write.controllers': [...event.bytesByController.keys()].join(','),
    'state.write.environment_type': event.environmentType,
    'state.write.idle_status': event.idleStatus,
    'state.write.measurement_duration_ms': event.measurementDurationMs,
    'state.write.sample_rate': event.sampleRate,
    'state.write.size_measurement_source': event.sizeMeasurementSource,
    'state.write.total_bytes': event.totalBytes,
    'state.write.write_duration_ms': event.writeDurationMs,
  };

  if (event.currentActivity.startupPhase !== undefined) {
    data['state.write.startup_phase'] = event.currentActivity.startupPhase;
  }

  if (event.currentActivity.notificationIsOpen !== undefined) {
    data['state.write.notification_is_open'] =
      event.currentActivity.notificationIsOpen;
  }

  const uiCounts = {
    popup: event.currentActivity.popupCount,
    fullscreen: event.currentActivity.fullscreenCount,
    sidepanel: event.currentActivity.sidePanelCount,
  } as const;
  for (const [uiType, count] of Object.entries(uiCounts)) {
    if (count !== undefined) {
      data[`state.write.ui_count.${uiType}`] = count;
    }
  }

  for (const [controllerKey, bytes] of event.bytesByController) {
    data[`state.write.bytes.${controllerKey}`] = bytes;
  }

  const msSinceSignals: [string, number | undefined][] = [
    ['app_start', event.lastActivity.msSinceLastAppStart],
    ['last_write', event.lastActivity.msSinceLastWrite],
    ['ui_open', event.lastActivity.msSinceLastUiOpen],
    ['ui_closed', event.lastActivity.msSinceLastUiClosed],
    ['ui_interaction', event.lastActivity.msSinceLastUiInteraction],
    ['window_event', event.lastActivity.msSinceLastWindowEvent],
    ['dapp_rpc', event.lastActivity.msSinceLastDappRpc],
    ['snap_rpc', event.lastActivity.msSinceLastSnapRpc],
    [
      'external_extension_rpc',
      event.lastActivity.msSinceLastExternalExtensionRpc,
    ],
    [
      'last_service_worker_reload',
      event.lastActivity.msSinceLastServiceWorkerReload,
    ],
  ];
  for (const [signal, ms] of msSinceSignals) {
    if (ms !== undefined) {
      data[`state.write.ms_since_${signal}`] = ms;
    }
  }

  if (event.lastActivity.serviceWorkerReloadCount !== undefined) {
    data['state.write.service_worker_reload_count'] =
      event.lastActivity.serviceWorkerReloadCount;
  }

  trace(
    {
      data,
      name: TraceName.StatePersist,
      op: TraceOperation.StateWrite,
    },
    () => undefined,
  );
}
