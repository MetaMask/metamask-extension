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
  document.removeEventListener('visibilitychange', onVisibilityChange);
  window.removeEventListener('pagehide', discard);
}

function onVisibilityChange(): void {
  if (document.visibilityState !== 'visible') {
    discard();
  }
}

/** Track document visibility before waiting for background initialization. */
export function trackUsefulScreenVisibility(): void {
  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('pagehide', discard);
  // The bundle itself may have loaded after the document became visible.
  const visibilityEntries = performance.getEntriesByType('visibility-state');
  if (visibilityEntries.some((entry) => entry.name === 'hidden')) {
    discard();
  }
  onVisibilityChange();
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
