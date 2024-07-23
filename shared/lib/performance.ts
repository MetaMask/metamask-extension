import * as Sentry from '@sentry/browser';
import { Primitive } from '@sentry/types';
import { createModuleLogger } from '@metamask/utils';
import { log as sentryLogger } from '../../app/scripts/lib/setupSentry';

const log = createModuleLogger(sentryLogger, 'performance');

export type PerformanceTraceRequest = {
  data?: Record<string, number | string | boolean>;
  name: string;
  parentContext?: unknown;
  tags?: Record<string, number | string | boolean>;
};

export async function trace<T>(
  request: PerformanceTraceRequest,
  fn: (context?: unknown) => Promise<T>,
): Promise<T> {
  const { data: attributes, name, parentContext, tags } = request;
  const parentSpan = (parentContext ?? null) as Sentry.Span | null;

  const isSentryEnabled =
    (await globalThis.sentry.getSentryEnabled()) as boolean;

  const callback = async () => {
    log('Starting trace', name, request);

    const start = Date.now();
    const result = await fn(parentSpan);
    const end = Date.now();

    log('Finished trace', name, end - start, request);

    return result;
  };

  if (!isSentryEnabled) {
    log('Skipping Sentry trace as metrics disabled', name, request);
    return callback();
  }

  return Sentry.withIsolationScope((scope) => {
    scope.setTags(tags as Record<string, Primitive>);

    return Sentry.startSpan({ name, parentSpan, attributes }, callback);
  });
}
