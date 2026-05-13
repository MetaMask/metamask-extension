import {
  continueTraceContext,
  getSerializedTraceContext,
  trace,
  type SerializedTraceContext,
  type TraceRequest,
} from './trace';
import { shouldSampleWrappers } from './wrapper-sampling';

/**
 * Wraps an async dispatch so it propagates the current trace context to a
 * receiver across a process boundary (UI ↔ background, background ↔ snap
 * iframe, background ↔ content-script, native bridge, custom worker, etc.).
 *
 * The `inject` callback embeds the serialized context into the dispatch
 * payload — e.g., appending it as a final RPC arg, adding a header to a
 * fetch request, attaching metadata to `postMessage`.
 *
 * When no active span exists or the kill switch is set, `getSerializedTraceContext`
 * returns `undefined` and dispatch runs with the original args.
 * @param options
 * @param options.dispatch
 * @param options.inject
 */
export function withTraceContextDispatch<Args extends unknown[], Result>({
  dispatch,
  inject,
}: {
  dispatch: (...args: Args) => Promise<Result>;
  inject: (args: Args, context: SerializedTraceContext) => Args;
}) {
  return (...args: Args) => {
    const context = getSerializedTraceContext();
    return dispatch(...(context ? inject(args, context) : args));
  };
}

/**
 * Wraps a handler so it continues the trace context propagated by a matching
 * `withTraceContextDispatch` on the sender side.
 *
 * Branches on `shouldSampleWrappers(traceId)`:
 * - No incoming context: handler called unwrapped.
 * - Context + sampled in: handler runs inside `trace()` with the propagated `parentContext`, emitting one wrapper span per receiver invocation.
 * - Context + sampled out: handler runs inside `continueTraceContext` so auto-instrumented and core-package spans still attach to the originating trace.
 *
 * `extract` unpacks the context from the incoming payload and returns the
 * cleaned args forwarded to the handler. `getSpanRequest` derives wrapper
 * span name/op/data from those cleaned args so spans can be method-specific.
 * @param options
 * @param options.handler
 * @param options.extract
 * @param options.getSpanRequest
 */
export function withTraceContextHandler<
  Input extends unknown[],
  HandlerArgs extends unknown[],
  Result,
>({
  handler,
  extract,
  getSpanRequest,
}: {
  handler: (...args: HandlerArgs) => Promise<Result> | Result;
  extract: (args: Input) => {
    cleanArgs: HandlerArgs;
    context: SerializedTraceContext | undefined;
  };
  getSpanRequest: (
    cleanArgs: HandlerArgs,
  ) => Pick<TraceRequest, 'name' | 'op' | 'data'>;
}) {
  return async (...args: Input) => {
    const { cleanArgs, context } = extract(args);
    if (!context) {
      return handler(...cleanArgs);
    }
    if (shouldSampleWrappers(context._traceId)) {
      return trace(
        { ...getSpanRequest(cleanArgs), parentContext: context },
        () => handler(...cleanArgs),
      );
    }
    return continueTraceContext(context, () => handler(...cleanArgs));
  };
}
