import type { SerializedTraceContext, TraceRequest } from './trace';
import {
  withTraceContextDispatch,
  withTraceContextHandler,
} from './with-trace-context';

/**
 * Method decorator: injects the current trace context into the method's args
 * before dispatching. Sugar over `withTraceContextDispatch`.
 *
 * The `inject` callback embeds the serialized context into the outgoing args.
 * When no active span exists or the kill switch is set, the method runs
 * unchanged.
 *
 * Usage:
 * ```ts
 * class BackgroundClient {
 *   `@propagateTraceContext`({
 *     inject: ([method, args], ctx) => [
 *       method,
 *       [...(args ?? []), { _traceContext: ctx }],
 *     ],
 *   })
 *   async send<R>(method: keyof Api, args?: Parameters<Api[typeof method]>): Promise<R> {
 *     return background[method](...(args ?? [])) as Promise<R>;
 *   }
 * }
 * ```
 * @param options
 * @param options.inject
 */
export function propagateTraceContext<Args extends unknown[]>({
  inject,
}: {
  inject: (args: Args, context: SerializedTraceContext) => Args;
}) {
  return function decorator<This, Result>(
    target: (this: This, ...args: Args) => Promise<Result>,
    _context: ClassMethodDecoratorContext<This, typeof target>,
  ) {
    return function (this: This, ...args: Args): Promise<Result> {
      return withTraceContextDispatch<Args, Result>({
        dispatch: (...dispatchArgs) => target.apply(this, dispatchArgs),
        inject,
      })(...args);
    };
  };
}

/**
 * Method decorator: extracts incoming trace context from the method's
 * argument, branches on `shouldSampleWrappers`, and forwards the cleaned
 * input to the underlying method. Sugar over `withTraceContextHandler`.
 *
 * `extract` returns the cleaned input plus the context (if any).
 * `getSpanRequest` derives span name/op/data from the cleaned input. Both
 * callbacks have `this` bound to the class instance, so they can read
 * instance state (e.g., look up a handler in `this.api`).
 *
 * Usage:
 * ```ts
 * class RpcDispatcher {
 *   constructor(public api: MetaRpcApi) {}
 *
 *   `@extractTraceContext`<RpcDispatcher, JsonRpcRequest, unknown>({
 *     extract: (data) => { ... },
 *     getSpanRequest(data) { return { name: ..., op: 'rpc.handler', data: ... }; },
 *   })
 *   async dispatch(data: JsonRpcRequest): Promise<unknown> { ... }
 * }
 * ```
 * @param options
 * @param options.extract
 * @param options.getSpanRequest
 */
export function extractTraceContext<This, Input, Return>({
  extract,
  getSpanRequest,
}: {
  extract: (input: Input) => {
    cleanInput: Input;
    context: SerializedTraceContext | undefined;
  };
  getSpanRequest: (
    this: This,
    cleanInput: Input,
  ) => Pick<TraceRequest, 'name' | 'op' | 'data'>;
}) {
  return function decorator(
    target: (this: This, input: Input) => Promise<Return> | Return,
    _context: ClassMethodDecoratorContext<This, typeof target>,
  ) {
    return function (this: This, input: Input): Promise<Return> {
      return withTraceContextHandler<[Input], [Input], Return>({
        handler: (cleanInput) => target.call(this, cleanInput),
        extract: ([rawInput]) => {
          const { cleanInput, context } = extract(rawInput);
          return { cleanArgs: [cleanInput], context };
        },
        getSpanRequest: ([cleanInput]) => getSpanRequest.call(this, cleanInput),
      })(input);
    };
  };
}
