import * as Sentry from '@sentry/browser';
import { Primitive } from '@sentry/types';
import { createModuleLogger } from '@metamask/utils';
import { log as sentryLogger } from '../../app/scripts/lib/setupSentry';

const log = createModuleLogger(sentryLogger, 'trace');

export type TraceRequest = {
  data?: Record<string, number | string | boolean>;
  name: string;
  parentContext?: unknown;
  tags?: Record<string, number | string | boolean>;
};

export async function trace<T>(
  request: TraceRequest,
  fn: (context?: unknown) => Promise<T>,
): Promise<T> {
  const { data: attributes, name, parentContext, tags } = request;
  const parentSpan = (parentContext ?? null) as Sentry.Span | null;

  const isSentryEnabled =
    (await globalThis.sentry.getMetaMetricsEnabled()) as boolean;

  const callback = async (span: Sentry.Span | null) => {
    log('Starting trace', name, request);

    const start = Date.now();
    let error;

    try {
      return await fn(span);
    } catch (currentError) {
      error = currentError;
      throw currentError;
    } finally {
      const end = Date.now();
      const duration = end - start;

      log('Finished trace', name, duration, { error, request });
    }
  };

  if (!isSentryEnabled) {
    log('Skipping Sentry trace as metrics disabled', name, request);
    return callback(null);
  }

  return await Sentry.withIsolationScope(async (scope) => {
    scope.setTags(tags as Record<string, Primitive>);

    return await Sentry.startSpan({ name, parentSpan, attributes }, callback);
  });
}
