import * as Sentry from '@sentry/browser';
import { Primitive, StartSpanOptions } from '@sentry/types';
import { createModuleLogger } from '@metamask/utils';
import { log as sentryLogger } from '../../app/scripts/lib/setupSentry';

const log = createModuleLogger(sentryLogger, 'trace');

const tracesByKey: Map<string, PendingTrace> = new Map();

type PendingTrace = {
  end: (timestamp?: number) => void;
  request: TraceRequest;
  startTime: number;
};

export type TraceContext = unknown;

export type TraceCallback<T> = (context?: TraceContext) => Promise<T>;

export type TraceRequest = {
  data?: Record<string, number | string | boolean>;
  id?: string;
  name: string;
  parentContext?: TraceContext;
  tags?: Record<string, number | string | boolean>;
};

export type EndTraceRequest = {
  id: string;
  name: string;
  timestamp?: number;
};

export async function trace<T>(
  request: TraceRequest,
  fn: TraceCallback<T>,
): Promise<T>;

export async function trace(request: TraceRequest): Promise<TraceContext>;

export async function trace<T>(
  request: TraceRequest,
  fn?: TraceCallback<T>,
): Promise<T | TraceContext> {
  const isSentryEnabled =
    (await globalThis.sentry.getMetaMetricsEnabled()) as boolean;

  if (!fn) {
    return await startTrace(request, isSentryEnabled);
  }

  return await traceCallback(request, fn, isSentryEnabled);
}

export function endTrace(request: EndTraceRequest) {
  const { id, name, timestamp } = request;
  const key = getTraceKey(request);
  const pendingTrace = tracesByKey.get(key);

  if (!pendingTrace) {
    log('No pending trace found', name, id);
    return;
  }

  pendingTrace.end(timestamp);

  tracesByKey.delete(key);

  const { request: pendingRequest, startTime } = pendingTrace;
  const endTime = timestamp ?? Date.now();
  const duration = endTime - startTime;

  log('Finished trace', name, id, duration, { request: pendingRequest });
}

async function traceCallback<T>(
  request: TraceRequest,
  fn: TraceCallback<T>,
  isSentryEnabled: boolean,
): Promise<T> {
  const { name } = request;

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
    return await callback(null);
  }

  return await startSpan(request, (spanOptions) =>
    Sentry.startSpan(spanOptions, callback),
  );
}

async function startTrace(
  request: TraceRequest,
  isSentryEnabled: boolean,
): Promise<TraceContext> {
  const { id, name } = request;
  const startTime = performance.timeOrigin + performance.now();

  if (!id) {
    log('No trace ID provided', name, request);
    return;
  }

  const callback = async (span: Sentry.Span | null) => {
    const end = (timestamp?: number) => {
      span?.end(timestamp);
    };

    const pendingTrace = { end, request, startTime };
    const key = getTraceKey(request);
    tracesByKey.set(key, pendingTrace);

    log('Started trace', name, id, request);

    return span;
  };

  if (!isSentryEnabled) {
    return await callback(null);
  }

  return await startSpan(request, (spanOptions) =>
    Sentry.startSpanManual(spanOptions, callback),
  );
}

async function startSpan<T>(
  request: TraceRequest,
  callback: (spanOptions: StartSpanOptions) => Promise<T>,
) {
  const { data: attributes, name, parentContext, tags } = request;
  const parentSpan = (parentContext ?? null) as Sentry.Span | null;
  const spanOptions = { name, parentSpan, attributes };

  return await Sentry.withIsolationScope(async (scope) => {
    scope.setTags(tags as Record<string, Primitive>);

    return await callback(spanOptions);
  });
}

function getTraceKey(request: TraceRequest) {
  const { id, name } = request;
  return [name, id].join(':');
}