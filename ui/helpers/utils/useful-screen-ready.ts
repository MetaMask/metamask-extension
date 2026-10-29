import { getBackgroundInitializedAt } from '../../../shared/lib/ui-startup-timing';
import {
  endTrace,
  getPerformanceTimestamp,
  trace,
  TraceName,
  TraceOperation,
} from '../../../shared/lib/trace';

export type LoadMeasurement = {
  reportReady: () => void;
  discard: () => void;
};

let finished = false;

/** Permanently exclude this document from useful-screen readiness sampling. */
function discard(): void {
  finished = true;
  window.removeEventListener('pagehide', discard);
}

/** Track document closure before waiting for background initialization. */
export function trackDocumentPageClose(): void {
  window.addEventListener('pagehide', discard);
}

/**
 * Register a page-owned measurement of initial document loading.
 * The caller owns eligibility, navigation lifetime, and readiness scheduling.
 * Reporting or discarding permanently ends sampling for this document.
 *
 * @param options - Page label and initial trace metadata.
 * @param options.screen - A static label, never a URL or request identifier.
 * @param options.tags - Metadata captured at registration.
 */
export function registerDocumentLoadMeasurement({
  screen,
  tags,
}: {
  screen: string;
  tags: Record<string, number | string | boolean>;
}): LoadMeasurement {
  const backgroundInitializedAt = getBackgroundInitializedAt();
  const initialTags = { ...tags };

  return {
    discard,
    reportReady() {
      if (finished) {
        return;
      }
      const timestamp = getPerformanceTimestamp();
      discard();
      trace({
        name: TraceName.UsefulScreenReady,
        op: TraceOperation.UiScreenPerformance,
        startTime: performance.timeOrigin,
        // Same document load as the pageload span, so keep it in that trace.
        allowActiveSpanFallback: true,
        tags: {
          ...initialTags,
          screen,
          'ui.navigation': 'document',
          'ui.readiness_version': '1',
          'ui.background_initialized_before_navigation':
            backgroundInitializedAt === undefined
              ? 'unknown'
              : backgroundInitializedAt <= performance.timeOrigin,
        },
        data: { success: true },
      });
      endTrace({ name: TraceName.UsefulScreenReady, timestamp });
    },
  };
}
