import { hasProperty, isObject } from '@metamask/utils';
import {
  circuitBreaker,
  ConsecutiveBreaker,
  ExponentialBackoff,
  handleAll,
  type IPolicy,
  retry,
  wrap,
  CircuitState,
} from 'cockatiel';
import getFetchWithTimeout from '../../../../../shared/modules/fetch-with-timeout';
import { CurrentRegulationStatus, RegulationId } from '../types';

const DEFAULT_ANALYTICS_DATA_DELETION_SOURCE_ID =
  process.env.ANALYTICS_DATA_DELETION_SOURCE_ID ?? 'test';
const DEFAULT_ANALYTICS_DATA_DELETION_ENDPOINT =
  process.env.ANALYTICS_DATA_DELETION_ENDPOINT ??
  'https://metametrics.metamask.test/';

const fetchWithTimeout = getFetchWithTimeout();

/**
 * The number of times we retry a specific failed request to the data deletion API.
 */
const RETRIES = 3;

/**
 * The maximum conseutive failures allowed before treating the server as inaccessible, and
 * breaking the circuit.
 *
 * Each update attempt will result (1 + retries) calls if the server is down.
 */
const MAX_CONSECUTIVE_FAILURES = (1 + RETRIES) * 3;

/**
 * When the circuit breaks, we wait for this period of time (in milliseconds) before allowing
 * a request to go through to the API.
 */
const CIRCUIT_BREAK_DURATION = 30 * 60 * 1000;

/**
 * The threshold (in milliseconds) for when a successful request is considered "degraded".
 */
const DEFAULT_DEGRADED_THRESHOLD = 5_000;

/**
 * Type guard for Fetch network responses with a `statusCode` property.
 *
 * @param response - A suspected Fetch network response.
 * @returns A type checked Fetch network response.
 */
function isValidResponse(
  response: unknown,
): response is { statusCode: number } {
  return (
    isObject(response) &&
    hasProperty(response, 'statusCode') &&
    typeof response.statusCode === 'number'
  );
}

/**
 * Returns `true` if the parameter is a Fetch network response with a status code that indiciates
 * server failure.
 *
 * @param response - The response to check.
 * @returns `true` if the response indicates a server failure, `false` otherwise.
 */
function onServerFailure(response: unknown) {
  return isValidResponse(response) && response.statusCode >= 500;
}

/**
 * Create a Cockatiel retry policy.
 *
 * This policy uses a retry and circuit breaker strategy. Callbacks are accepted for circuit breaks
 * and degraded responses as well.
 *
 * @param args - Arguments
 * @param args.circuitBreakDuration - The amount of time to wait when the circuit breaks
 * from too many consecutive failures.
 * @param args.degradedThreshold - The threshold between "normal" and "degrated" service,
 * in milliseconds.
 * @param args.maximumConsecutiveFailures - The maximum number of consecutive failures
 * allowed before breaking the circuit and pausing further updates.
 * @param args.onBreak - An event handler for when the circuit breaks, useful for capturing
 * metrics about network failures.
 * @param args.onDegraded - An event handler for when the circuit remains closed, but requests
 * are failing or resolving too slowly (i.e. resolving more slowly than the `degradedThreshold`).
 * @param args.retries - Number of retry attempts.
 * @returns A Cockatiel retry policy.
 */
function createRetryPolicy({
  circuitBreakDuration,
  degradedThreshold,
  maximumConsecutiveFailures,
  onBreak,
  onDegraded,
  retries,
}: {
  circuitBreakDuration: number;
  degradedThreshold: number;
  maximumConsecutiveFailures: number;
  onBreak?: () => void;
  onDegraded?: () => void;
  retries: number;
}) {
  const retryPolicy = retry(handleAll.orWhenResult(onServerFailure), {
    maxAttempts: retries,
    backoff: new ExponentialBackoff(),
  });
  const circuitBreakerPolicy = circuitBreaker(handleAll, {
    halfOpenAfter: circuitBreakDuration,
    breaker: new ConsecutiveBreaker(maximumConsecutiveFailures),
  });
  if (onBreak) {
    circuitBreakerPolicy.onBreak(onBreak);
  }
  if (onDegraded) {
    retryPolicy.onGiveUp(() => {
      if (circuitBreakerPolicy.state === CircuitState.Closed) {
        onDegraded();
      }
    });
    retryPolicy.onSuccess(({ duration }) => {
      if (
        circuitBreakerPolicy.state === CircuitState.Closed &&
        duration > degradedThreshold
      ) {
        onDegraded();
      }
    });
  }
  return wrap(retryPolicy, circuitBreakerPolicy);
}

/**
 * A serivce for requesting the deletion of analytics data.
 */
export class DataDeletionService {
  #analyticsDataDeletionEndpoint: string;

  #analyticsDataDeletionSourceId: string;

  #fetchStatusPolicy: IPolicy;

  #createDataDeletionTaskPolicy: IPolicy;

  /**
   * Construct a data deletion service.
   *
   * @param options - Options.
   * @param options.analyticsDataDeletionEndpoint - The base URL for the data deletion API.
   * @param options.analyticsDataDeletionSourceId - The Segment source ID to delete data from.
   * @param options.onBreak - An event handler for when the circuit breaks, useful for capturing
   * metrics about network failures.
   * @param options.onDegraded - An event handler for when the circuit remains closed, but requests
   * are failing or resolving too slowly (i.e. resolving more slowly than the `degradedThreshold`).
   */
  constructor({
    analyticsDataDeletionEndpoint = DEFAULT_ANALYTICS_DATA_DELETION_ENDPOINT,
    analyticsDataDeletionSourceId = DEFAULT_ANALYTICS_DATA_DELETION_SOURCE_ID,
    onBreak,
    onDegraded,
  }: {
    analyticsDataDeletionEndpoint?: string;
    analyticsDataDeletionSourceId?: string;
    onBreak?: () => void;
    onDegraded?: () => void;
  } = {}) {
    if (!analyticsDataDeletionEndpoint) {
      throw new Error('Missing ANALYTICS_DATA_DELETION_ENDPOINT');
    } else if (!analyticsDataDeletionSourceId) {
      throw new Error('Missing ANALYTICS_DATA_DELETION_SOURCE_ID');
    }
    this.#analyticsDataDeletionEndpoint = analyticsDataDeletionEndpoint;
    this.#analyticsDataDeletionSourceId = analyticsDataDeletionSourceId;
    this.#createDataDeletionTaskPolicy = createRetryPolicy({
      circuitBreakDuration: CIRCUIT_BREAK_DURATION,
      degradedThreshold: DEFAULT_DEGRADED_THRESHOLD,
      maximumConsecutiveFailures: MAX_CONSECUTIVE_FAILURES,
      onBreak,
      onDegraded,
      retries: RETRIES,
    });
    this.#fetchStatusPolicy = createRetryPolicy({
      circuitBreakDuration: CIRCUIT_BREAK_DURATION,
      degradedThreshold: DEFAULT_DEGRADED_THRESHOLD,
      maximumConsecutiveFailures: MAX_CONSECUTIVE_FAILURES,
      onBreak,
      onDegraded,
      retries: RETRIES,
    });
  }

  /**
   * Submit a deletion request.
   *
   * We use Segment for this request. Segment calls this deletion request a "regulation", and
   * returns a "regulation ID" to keep track of this request and get status updates for it.
   *
   * @param metaMetricsId - The ID associated with the analytics data that we will be deleting.
   * @returns The regulation ID for the deletion request.
   */
  async createDataDeletionRegulationTask(
    metaMetricsId: string,
  ): Promise<RegulationId> {
    const response = await this.#createDataDeletionTaskPolicy.execute(() =>
      fetchWithTimeout(
        `${this.#analyticsDataDeletionEndpoint}/regulations/sources/${
          this.#analyticsDataDeletionSourceId
        }`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/vnd.segment.v1+json' },
          body: JSON.stringify({
            regulationType: 'DELETE_ONLY',
            subjectType: 'USER_ID',
            subjectIds: [metaMetricsId],
          }),
        },
      ),
    );
    return response.json();
  }

  /**
   * Fetch the status of the given deletion request.
   *
   * @param deleteRegulationId - The Segment "regulation ID" for the deletion request to check.
   * @returns The status of the given deletion request.
   */
  async fetchDeletionRegulationStatus(
    deleteRegulationId: string,
  ): Promise<CurrentRegulationStatus> {
    const response = await this.#fetchStatusPolicy.execute(() =>
      fetchWithTimeout(
        `${
          this.#analyticsDataDeletionEndpoint
        }/regulations/${deleteRegulationId}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/vnd.segment.v1+json' },
        },
      ),
    );
    return response.json();
  }
}
