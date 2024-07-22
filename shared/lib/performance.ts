import * as Sentry from '@sentry/browser';
import { Primitive } from '@sentry/types';

export type PerformanceTraceRequest = {
  data?: Record<string, number | string | boolean>;
  name: string;
  parentContext?: unknown;
  tags?: Record<string, number | string | boolean>;
};

export function trace<T>(
  request: PerformanceTraceRequest,
  fn: (context?: unknown) => T,
): T {
  const { data: attributes, name, parentContext, tags } = request;
  const parentSpan = (parentContext ?? null) as Sentry.Span | null;

  return Sentry.withIsolationScope((scope) => {
    scope.setTags(tags as Record<string, Primitive>);

    return Sentry.startSpan({ name, parentSpan, attributes }, fn);
  });
}
