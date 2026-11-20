import { spanToJSON } from '@sentry/browser';
import {
  sentryGetActiveSpan,
  trace,
  type TraceName,
} from '../../../shared/lib/trace';

// An ended span can stay active (concurrent async spans pop the scope stack
// out of order), and work under it would join a trace already sent.
function hasRunningCaller(): boolean {
  const activeSpan = sentryGetActiveSpan();
  return activeSpan !== null && spanToJSON(activeSpan).timestamp === undefined;
}

// With no running span a request records no `http.client` span and leaves
// without trace headers, so a call with no caller gets a trace of its own.
export function withOwnTraceWithoutCaller<Args extends unknown[], Result>(
  name: TraceName,
  fn: (...args: Args) => Result,
): (...args: Args) => Result {
  return (...args) =>
    hasRunningCaller()
      ? fn(...args)
      : trace({ name, root: true }, () => fn(...args));
}
