import type { SplitStateWriteEvent } from '../../../shared/lib/stores/persistence-manager';
import { trace, TraceName, TraceOperation } from '../../../shared/lib/trace';

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
    'state.write.controller_count': event.controllerKeys.length,
    'state.write.controllers': event.controllerKeys.join(','),
    'state.write.idle_status': event.idleStatus,
    'state.write.measurement_duration_ms': event.measurementDurationMs,
    'state.write.sample_rate': event.sampleRate,
    'state.write.total_bytes': event.totalBytes,
    'state.write.write_duration_ms': event.writeDurationMs,
  };

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
