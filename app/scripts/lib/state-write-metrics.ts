import type { Span, SpanAttributes } from '@sentry/types';
import type { SplitStateWriteEvent } from '../../../shared/lib/stores/persistence-manager';

const STATE_WRITE_TRACE_NAME = 'State Persist';
const STATE_WRITE_TRACE_OPERATION = 'state.write';

/**
 * Reports a sampled split-state persistence write without exposing state
 * values.
 *
 * @param event - Value-free measurements for one persisted batch.
 */
export function trackSplitStateWrite(event: SplitStateWriteEvent): void {
  const { sentry } = globalThis;
  if (!sentry) {
    return;
  }

  const attributes: SpanAttributes = {
    'state.write.coalesced_updates': event.coalescedUpdates,
    'state.write.controller_count': event.controllerKeys.length,
    'state.write.controllers': event.controllerKeys.join(','),
    'state.write.idle_status': event.idleStatus,
    'state.write.measurement_duration_ms': event.measurementDurationMs,
    'state.write.sample_rate': event.sampleRate,
    'state.write.total_bytes': event.totalBytes,
    'state.write.write_duration_ms': event.writeDurationMs,
  };

  for (const [controllerKey, bytes] of Object.entries(
    event.bytesByController,
  )) {
    attributes[`state.write.bytes.${controllerKey}`] = bytes;
  }

  sentry.startSpan(
    {
      attributes,
      forceTransaction: true,
      name: STATE_WRITE_TRACE_NAME,
      op: STATE_WRITE_TRACE_OPERATION,
    },
    (span: Span) => {
      span.setStatus({ code: 1 });
    },
  );
}
