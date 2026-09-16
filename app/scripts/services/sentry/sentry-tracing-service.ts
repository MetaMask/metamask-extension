import type { AnalyticsControllerGetStateAction } from '@metamask/analytics-controller';
import type { Messenger } from '@metamask/messenger';
import {
  endTrace,
  trace,
  type EndTraceRequest,
  type TraceRequest,
} from '../../../../shared/lib/trace';
import type { SentryTracingServiceMethodActions } from './sentry-tracing-service-method-action-types';

const SERVICE_NAME = 'SentryTracingService';

const MESSENGER_EXPOSED_METHODS = [
  'bufferedTrace',
  'bufferedEndTrace',
  'trackTracesAfterMetricsOptIn',
  'clearTracesAfterMetricsOptIn',
] as const;

type BufferedTrace =
  | { type: 'start'; request: TraceRequest }
  | { type: 'end'; request: EndTraceRequest };

export type SentryTracingServiceMessenger = Messenger<
  typeof SERVICE_NAME,
  SentryTracingServiceMethodActions | AnalyticsControllerGetStateAction,
  never
>;

/**
 * Owns Sentry traces buffered until the user makes a MetaMetrics consent
 * decision.
 */
export class SentryTracingService {
  readonly name: typeof SERVICE_NAME = SERVICE_NAME;

  readonly #messenger: SentryTracingServiceMessenger;

  readonly #tracesBeforeMetricsOptIn: BufferedTrace[] = [];

  constructor({ messenger }: { messenger: SentryTracingServiceMessenger }) {
    this.#messenger = messenger;
    this.#messenger.registerMethodActionHandlers(
      this,
      MESSENGER_EXPOSED_METHODS,
    );
  }

  /**
   * Start a trace immediately when metrics are enabled, or buffer it until the
   * user opts in.
   *
   * @param request - The trace request.
   */
  bufferedTrace(request: TraceRequest): void {
    if (this.#isMetricsOptedIn()) {
      trace(request);
      return;
    }

    this.#tracesBeforeMetricsOptIn.push({
      type: 'start',
      request: {
        ...request,
        startTime: request.startTime ?? Date.now(),
      },
    });
  }

  /**
   * End a trace immediately when metrics are enabled, or buffer it until the
   * user opts in.
   *
   * @param request - The end trace request.
   */
  bufferedEndTrace(request: EndTraceRequest): void {
    if (this.#isMetricsOptedIn()) {
      endTrace(request);
      return;
    }

    this.#tracesBeforeMetricsOptIn.push({
      type: 'end',
      request: {
        ...request,
        timestamp: request.timestamp ?? Date.now(),
      },
    });
  }

  /**
   * Track all traces buffered before the user opted into metrics.
   */
  trackTracesAfterMetricsOptIn(): void {
    this.#tracesBeforeMetricsOptIn.forEach((bufferedTrace) => {
      if (bufferedTrace.type === 'start') {
        trace(bufferedTrace.request);
      } else {
        endTrace(bufferedTrace.request);
      }
    });
  }

  /**
   * Clear all traces buffered before the user made a consent decision.
   */
  clearTracesAfterMetricsOptIn(): void {
    this.#tracesBeforeMetricsOptIn.length = 0;
  }

  #isMetricsOptedIn(): boolean {
    return (
      this.#messenger.call('AnalyticsController:getState').optedIn === true
    );
  }
}
