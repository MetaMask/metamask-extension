import { inspect, isDeepStrictEqual } from 'util';
import {
  JsonRpcEngine,
  JsonRpcSuccess,
  JsonRpcFailure,
  JsonRpcRequest,
  JsonRpcResponse,
} from 'json-rpc-engine';
import { SafeEventEmitterProvider } from '@metamask/eth-json-rpc-provider/dist/safe-event-emitter-provider';

// Store this in case it gets stubbed later
const originalSetTimeout = global.setTimeout;

/**
 * An object that allows specifying the behavior of a specific invocation of
 * `sendAsync`. The `method` always identifies the stub, but the behavior
 * may be specified multiple ways: `sendAsync` can either return a promise or
 * throw an error, and if it returns a promise, that promise can either be
 * resolved with a response object or reject with an error.
 *
 * @property request - Looks for a request matching these specifications.
 * @property request.method - The RPC method to which this stub will be matched.
 * @property request.params - The params to which this stub will be matched.
 * @property response - Instructs `sendAsync` to return a promise that resolves
 * with a response object.
 * @property response.result - Specifies a successful response, with this as the
 * `result`.
 * @property response.error - Specifies an error response, with this as the
 * `error`.
 * @property error - Instructs `sendAsync` to return a promise that rejects with
 * this error.
 * @property implementation - Allows overriding `sendAsync` entirely. Useful if
 * you want it to throw an error.
 * @property delay - The amount of time that will pass after the callback is
 * called with the response.
 * @property discardAfterMatching - Usually after the stub matches a request, it
 * is discarded, but setting this to true prevents that from happening. True by
 * default.
 */
export type FakeProviderStub<Params, Response> = {
  request: {
    method: string;
    params?: Params[];
  };
  delay?: number;
  discardAfterMatching?: boolean;
  beforeCompleting?: () => void | Promise<void>;
} & (
  | {
      response:
        | (Omit<JsonRpcSuccess<Response>, 'id' | 'jsonrpc' | 'result'> & {
            result: Response;
          })
        | (Omit<JsonRpcFailure, 'id' | 'jsonrpc'> & { error: string });
    }
  | {
      error: unknown;
    }
  | {
      implementation: () => void;
    }
);

/**
 * The set of options that the FakeProviderEngine constructor takes.
 *
 * @property stubs - A set of objects that allow specifying the behavior
 * of specific invocations of `sendAsync` matching a `method`.
 */
interface FakeProviderEngineOptions {
  stubs?: FakeProviderStub<any, any>[];
}

/**
 * FakeProviderEngine is an implementation of the provider that
 * NetworkController exposes, which is actually an instance of
 * Web3ProviderEngine (from the `web3-provider-engine` package). Hence it
 * supports the same interface as Web3ProviderEngine, except that fake responses
 * for any RPC methods that are accessed can be supplied via an API that is more
 * succinct than using Jest's mocking API.
 */
// NOTE: We shouldn't need to extend from the "real" provider here, but
// we'd need a `SafeEventEmitterProvider` _interface_ and that doesn't exist (at
// least not yet).
export class FakeProvider extends SafeEventEmitterProvider {
  calledStubs: FakeProviderStub<any, any>[];

  #originalStubs: FakeProviderStub<any, any>[];

  #stubs: FakeProviderStub<any, any>[];

  /**
   * Makes a new instance of the fake provider.
   *
   * @param options - The options.
   * @param options.stubs - A set of objects that allow specifying the behavior
   * of specific invocations of `sendAsync` matching a `method`.
   */
  constructor({ stubs = [] }: FakeProviderEngineOptions) {
    super({ engine: new JsonRpcEngine() });
    this.#originalStubs = stubs;
    this.#stubs = this.#originalStubs.slice();
    this.calledStubs = [];
  }

  send = <Params, Response>(
    payload: JsonRpcRequest<Params>,
    callback: (error: unknown, response?: JsonRpcResponse<Response>) => void,
  ) => {
    return this.#handleSend(payload, callback);
  };

  sendAsync = <Params, Response>(
    payload: JsonRpcRequest<Params>,
    callback: (error: unknown, response?: JsonRpcResponse<Response>) => void,
  ) => {
    return this.#handleSend(payload, callback);
  };

  #handleSend<Params, Response>(
    payload: JsonRpcRequest<Params>,
    callback?: (error: unknown, response?: JsonRpcResponse<Response>) => void,
  ) {
    if (Array.isArray(payload)) {
      throw new Error("Arrays aren't supported");
    }

    const index = this.#stubs.findIndex((stub) => {
      return (
        stub.request.method === payload.method &&
        (!('params' in stub.request) ||
          isDeepStrictEqual(stub.request.params, payload.params))
      );
    });

    if (index === -1) {
      const matchingCalledStubs = this.calledStubs.filter((stub) => {
        return (
          stub.request.method === payload.method &&
          (!('params' in stub.request) ||
            isDeepStrictEqual(stub.request.params, payload.params))
        );
      });
      let message = `Could not find any stubs matching: ${inspect(payload, {
        depth: null,
      })}`;
      if (matchingCalledStubs.length > 0) {
        message += `\n\nIt appears the following stubs were defined, but have been called already:\n\n${inspect(
          matchingCalledStubs,
          { depth: null },
        )}`;
      }

      throw new Error(message);
    } else {
      const stub = this.#stubs[index];

      if (stub.discardAfterMatching !== false) {
        this.#stubs.splice(index, 1);
      }

      if (callback === undefined) {
        this.#handleRequest(stub, (error, response) => {
          console.warn(
            'got result or error but not doing anything with it',
            error,
            response,
          );
        });
      } else if (stub.delay) {
        originalSetTimeout(() => {
          this.#handleRequest(stub, callback);
        }, stub.delay);
      } else {
        this.#handleRequest(stub, callback);
      }

      this.calledStubs.push({ ...stub });
    }
  }

  #handleRequest<Params, Response>(
    stub: FakeProviderStub<Params, Response>,
    callback: (error: unknown, response?: JsonRpcResponse<Response>) => void,
  ) {
    const promiseForBeforeCompleting =
      stub.beforeCompleting === undefined
        ? Promise.resolve()
        : Promise.resolve(stub.beforeCompleting());

    promiseForBeforeCompleting.then(() => {
      if ('implementation' in stub) {
        stub.implementation();
      } else if ('response' in stub) {
        if ('result' in stub.response) {
          return callback(null, {
            jsonrpc: '2.0',
            id: 1,
            result: stub.response.result,
          });
        } else if ('error' in stub.response) {
          if (typeof stub.response.error === 'string') {
            return callback(null, {
              jsonrpc: '2.0',
              id: 1,
              error: {
                code: -999,
                message: stub.response.error,
              },
            });
          }
          return callback(null, {
            jsonrpc: '2.0',
            id: 1,
            error: stub.response.error,
          });
        }
      } else if ('error' in stub) {
        return callback(stub.error);
      }
      return undefined;
    });
  }
}
