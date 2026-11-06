import type { SplitStateWriteEvent } from '../stores/persistence-manager';
import { trace, TraceName, TraceOperation } from '../trace';
import { buildActivityAttributes } from './activity-attributes';

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
    'state.write.measurement_duration_ms': event.measurementDurationMs,
    'state.write.sample_rate': event.sampleRate,
    'state.write.size_measurement_source': event.sizeMeasurementSource,
    'state.write.total_bytes': event.totalBytes,
    'state.write.write_duration_ms': event.writeDurationMs,
  };

  const activity = buildActivityAttributes(
    event.currentActivity,
    event.lastActivity,
    event.idleStatus,
    event.environmentType,
  );
  for (const [key, value] of Object.entries(activity)) {
    data[`state.write.${key}`] = value;
  }

  for (const [controllerKey, bytes] of event.bytesByController) {
    data[`state.write.bytes.${controllerKey}`] = bytes;
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
