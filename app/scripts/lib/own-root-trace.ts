import {
  spanToJSON,
  startInactiveSpan,
  startNewTrace,
  withActiveSpan,
} from '@sentry/browser';
import { SPAN_STATUS_ERROR, type Span } from '@sentry/core';
import type { TraceName } from '../../../shared/lib/trace';
import { claimBackendRequests } from './sentry-trace-propagation';

// The service worker has no async context: the SDK keeps one scope stack and
// pops it when a callback settles, so a span left as the active span across an
// `await` parents whatever starts meanwhile. A root here is therefore the
// active span only while its own code runs synchronously.

function isRunning(span: Span): boolean {
  return spanToJSON(span).timestamp === undefined;
}

function runWithActiveSpan<Result>(span: Span, fn: () => Result): Result {
  // Boxed so the scope is popped on return, not when a returned promise settles.
  return withActiveSpan(span, () => ({ result: fn() })).result;
}

function endWithError(span: Span): void {
  span.setStatus({ code: SPAN_STATUS_ERROR, message: 'internal_error' });
  span.end();
}

/**
 * Run `fn` as the root of a trace of its own, regardless of the active span.
 * The root is the active span while `fn` runs synchronously, and ends when its
 * result settles.
 *
 * @param name - The root's transaction name.
 * @param fn - The operation, given its root span.
 * @returns The result of `fn`.
 */
export function runAsOwnRoot<Result>(
  name: TraceName,
  fn: (span: Span) => Result,
): Result {
  const span = startNewTrace(() =>
    startInactiveSpan({ name, op: 'custom', parentSpan: null }),
  );
  let result: Result;
  try {
    result = runWithActiveSpan(span, () => fn(span));
  } catch (error) {
    endWithError(span);
    throw error;
  }
  if (!(result instanceof Promise)) {
    span.end();
    return result;
  }
  return result.then(
    (value) => {
      span.end();
      return value;
    },
    (error) => {
      endWithError(span);
      throw error;
    },
  ) as Result;
}

/**
 * Run `fn` as the root of a trace of its own, for an operation whose requests
 * leave from code that has awaited and calls the global `fetch`: while the
 * root runs, a backend request whose URL `claims` accepts is sent under it.
 *
 * @param name - The root's transaction name.
 * @param claims - Whether a request URL belongs to the operation.
 * @param fn - The operation.
 * @returns The result of `fn`.
 */
export function runAsOwnRootClaiming<Result>(
  name: TraceName,
  claims: (url: string) => boolean,
  fn: () => Promise<Result>,
): Promise<Result> {
  return runAsOwnRoot(name, (span) => {
    const release = claimBackendRequests(span, claims);
    return fn().finally(release);
  });
}

/**
 * Wrap `fn` so each call runs as the root of a trace of its own.
 *
 * @param name - The root's transaction name.
 * @param fn - The function to wrap; its requests must start synchronously.
 * @returns The wrapped function.
 */
export function withOwnRootTrace<Args extends unknown[], Result>(
  name: TraceName,
  fn: (...args: Args) => Result,
): (...args: Args) => Result {
  return (...args) => runAsOwnRoot(name, () => fn(...args));
}

/**
 * A root whose later requests leave from code that has awaited since the root
 * stopped being the active span. `bindFetch` gives that code a `fetch` that
 * sends a request under the root while the root runs.
 *
 * @param name - The root's transaction name.
 * @returns `run`, which runs an operation as the root, and `bindFetch`.
 */
export function createOwnRoot(name: TraceName) {
  let current: Span | undefined;
  return {
    run<Result>(fn: () => Result): Result {
      return runAsOwnRoot(name, (span) => {
        current = span;
        return fn();
      });
    },
    bindFetch(fetchFn: typeof fetch): typeof fetch {
      return (...args) =>
        current && isRunning(current)
          ? runWithActiveSpan(current, () => fetchFn(...args))
          : fetchFn(...args);
    },
  };
}
