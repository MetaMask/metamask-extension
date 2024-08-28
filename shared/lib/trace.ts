import * as Sentry from '@sentry/browser';
import { Primitive, StartSpanOptions } from '@sentry/types';
import { createModuleLogger } from '@metamask/utils';
import { log as sentryLogger } from '../../app/scripts/lib/setupSentry';

export enum TraceName {
  BackgroundConnect = 'Background Connect',
  DeveloperTest = 'Developer Test',
  FirstRender = 'First Render',
  GetState = 'Get State',
  InitialActions = 'Initial Actions',
  LoadScripts = 'Load Scripts',
  Middleware = 'Middleware',
  NestedTest1 = 'Nested Test 1',
  NestedTest2 = 'Nested Test 2',
  NotificationDisplay = 'Notification Display',
  PPOMValidation = 'PPOM Validation',
  SetupStore = 'Setup Store',
  Transaction = 'Transaction',
  UIStartup = 'UI Startup',
}

const log = createModuleLogger(sentryLogger, 'trace');

const ID_DEFAULT = 'default';
const OP_DEFAULT = 'custom';

const tracesByKey: Map<string, PendingTrace> = new Map();

type PendingTrace = {
  end: (timestamp?: number) => void;
  request: TraceRequest;
  startTime: number;
};

export type TraceContext = unknown;

export type TraceCallback<T> = (context?: TraceContext) => T;

export type TraceRequest = {
  data?: Record<string, number | string | boolean>;
  id?: string;
  name: TraceName;
  parentContext?: TraceContext;
  startTime?: number;
  tags?: Record<string, number | string | boolean>;
};

export type EndTraceRequest = {
  id?: string;
  name: TraceName;
  timestamp?: number;
};

export function trace<T>(request: TraceRequest, fn: TraceCallback<T>): T;

export function trace(request: TraceRequest): TraceContext;

export function trace<T>(
  request: TraceRequest,
  fn?: TraceCallback<T>,
): T | TraceContext {
  if (!fn) {
    return startTrace(request);
  }

  return traceCallback(request, fn);
}

export function endTrace(request: EndTraceRequest) {
  const { name, timestamp } = request;
  const id = getTraceId(request);
  const key = getTraceKey(request);
  const pendingTrace = tracesByKey.get(key);

  if (!pendingTrace) {
    log('No pending trace found', name, id);
    return;
  }

  pendingTrace.end(timestamp);

  tracesByKey.delete(key);

  const { request: pendingRequest, startTime } = pendingTrace;
  const endTime = timestamp ?? getPerformanceTimestamp();
  const duration = endTime - startTime;

  log('Finished trace', name, id, duration, { request: pendingRequest });
}

function traceCallback<T>(request: TraceRequest, fn: TraceCallback<T>): T {
  const { name } = request;

  const callback = (span: Sentry.Span | null) => {
    log('Starting trace', name, request);

    const start = Date.now();
    let error: unknown;

    return tryCatchMaybePromise<T>(
      () => fn(span),
      (currentError) => {
        error = currentError;
        throw currentError;
      },
      () => {
        const end = Date.now();
        const duration = end - start;

        log('Finished trace', name, duration, { error, request });
      },
    ) as T;
  };

  return startSpan(request, (spanOptions) =>
    Sentry.startSpan(spanOptions, callback),
  );
}

function startTrace(request: TraceRequest): TraceContext {
  const { name, startTime: requestStartTime } = request;
  const startTime = requestStartTime ?? getPerformanceTimestamp();
  const id = getTraceId(request);

  const callback = (span: Sentry.Span | null) => {
    const end = (timestamp?: number) => {
      span?.end(timestamp);
    };

    const pendingTrace = { end, request, startTime };
    const key = getTraceKey(request);
    tracesByKey.set(key, pendingTrace);

    log('Started trace', name, id, request);

    return span;
  };

  return startSpan(request, (spanOptions) =>
    Sentry.startSpanManual(spanOptions, callback),
  );
}

function startSpan<T>(
  request: TraceRequest,
  callback: (spanOptions: StartSpanOptions) => T,
) {
  const { data: attributes, name, parentContext, startTime, tags } = request;
  const parentSpan = (parentContext ?? null) as Sentry.Span | null;

  const spanOptions: StartSpanOptions = {
    attributes,
    name,
    op: OP_DEFAULT,
    parentSpan,
    startTime,
  };

  return Sentry.withIsolationScope((scope) => {
    scope.setTags(tags as Record<string, Primitive>);

    return callback(spanOptions);
  });
}

function getTraceId(request: TraceRequest) {
  return request.id ?? ID_DEFAULT;
}

function getTraceKey(request: TraceRequest) {
  const { name } = request;
  const id = getTraceId(request);

  return [name, id].join(':');
}

function getPerformanceTimestamp(): number {
  return performance.timeOrigin + performance.now();
}

function tryCatchMaybePromise<T>(
  tryFn: () => T,
  catchFn: (error: unknown) => void,
  finallyFn: () => void,
): T | undefined {
  let isPromise = false;

  try {
    const result = tryFn() as T;

    if (result instanceof Promise) {
      isPromise = true;
      return result.catch(catchFn).finally(finallyFn) as T;
    }

    return result;
  } catch (error) {
    if (!isPromise) {
      catchFn(error);
    }
  } finally {
    if (!isPromise) {
      finallyFn();
    }
  }

  return undefined;
}
