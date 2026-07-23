import * as Sentry from '@sentry/browser';
import { getAnalyticsState } from './sentry-get-state';

/**
 * Custom Sentry transport: skip network when MetaMetrics is off. Event bodies are already
 * processed in {@link rewriteReport} via `beforeSend`.
 *
 * @param options - Sentry transport options passed to {@link Sentry.makeFetchTransport}.
 */
export function makeTransport(
  options: Parameters<typeof Sentry.makeFetchTransport>[0],
) {
  return Sentry.makeFetchTransport(options, async (...args) => {
    const state = await getAnalyticsState();

    if (!state?.completedMetaMetricsOnboarding || !state.optedIn) {
      throw new Error('Network request skipped as metrics disabled');
    }

    return await fetch(...args);
  });
}
