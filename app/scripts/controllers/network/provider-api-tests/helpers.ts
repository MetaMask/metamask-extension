import nock, { Scope as NockScope } from 'nock';
import sinon from 'sinon';
import type { JSONRPCResponse } from '@json-rpc-specification/meta-schema';
import EthQuery from 'eth-query';
import { Hex } from '@metamask/utils';
import { BuiltInInfuraNetwork } from '../../../../../shared/constants/network';
import {
  createNetworkClient,
  NetworkClientType,
} from '../create-network-client';

/**
 * A dummy value for the `infuraProjectId` option that `createInfuraClient`
 * needs. (Infura should not be hit during tests, but just in case, this should
 * not refer to a real project ID.)
 */
const MOCK_INFURA_PROJECT_ID = 'abc123';

/**
 * A dummy value for the `rpcUrl` option that `createJsonRpcClient` needs. (This
 * should not be hit during tests, but just in case, this should also not refer
 * to a real Infura URL.)
 */
const MOCK_RPC_URL = 'http://foo.com';

/**
 * A default value for the `eth_blockNumber` request that the block tracker
 * makes.
 */
const DEFAULT_LATEST_BLOCK_NUMBER = '0x42';

/**
 * A reference to the original `setTimeout` function so that we can use it even
 * when using fake timers.
 */
const originalSetTimeout = setTimeout;

/**
 * If you're having trouble writing a test and you're wondering why the test
 * keeps failing, you can set `process.env.DEBUG_PROVIDER_TESTS` to `1`. This
 * will turn on some extra logging.
 *
 * @param args - The arguments that `console.log` takes.
 */
function debug(...args: any) {
  if (process.env.DEBUG_PROVIDER_TESTS === '1') {
    console.log(...args);
  }
}

/**
 * Builds a Nock scope object for mocking provider requests.
 *
 * @param rpcUrl - The URL of the RPC endpoint.
 * @returns The nock scope.
 */
function buildScopeForMockingRequests(rpcUrl: string): NockScope {
  return nock(rpcUrl).filteringRequestBody((body) => {
    debug('Nock Received Request: ', body);
    return body;
  });
}

type Request = { method: string; params?: any[] };
type Response = {
  id?: number | string;
  jsonrpc?: '2.0';
  error?: any;
  result?: any;
  httpStatus?: number;
};
type ResponseBody = { body: JSONRPCResponse };
type BodyOrResponse = ResponseBody | Response;
type CurriedMockRpcCallOptions = {
  request: Request;
  // The response data.
  response?: BodyOrResponse;
  /**
   * An error to throw while making the request.
   * Takes precedence over `response`.
   */
  error?: Error | string;
  /**
   * The amount of time that should pass before the
   * request resolves with the response.
   */
  delay?: number;
  /**
   * The number of times that the request is
   * expected to be made.
   */
  times?: number;
};

type MockRpcCallOptions = {
  // A nock scope (a set of mocked requests scoped to a certain base URL).
  nockScope: nock.Scope;
} & CurriedMockRpcCallOptions;

type MockRpcCallResult = nock.Interceptor | nock.Scope;

/**
 * Mocks a JSON-RPC request sent to the provider with the given response.
 * Provider type is inferred from the base url set on the nockScope.
 *
 * @param args - The arguments.
 * @param args.nockScope - A nock scope (a set of mocked requests scoped to a
 * certain base URL).
 * @param args.request - The request data.
 * @param args.response - Information concerning the response that the request
 * should have. If a `body` property is present, this is taken as the complete
 * response body. If an `httpStatus` property is present, then it is taken as
 * the HTTP status code to respond with. Properties other than these two are
 * used to build a complete response body (including `id` and `jsonrpc`
 * properties).
 * @param args.error - An error to throw while making the request. Takes
 * precedence over `response`.
 * @param args.delay - The amount of time that should pass before the request
 * resolves with the response.
 * @param args.times - The number of times that the request is expected to be
 * made.
 * @returns The nock scope.
 */
function mockRpcCall({
  nockScope,
  request,
  response,
  error,
  delay,
  times,
}: MockRpcCallOptions): MockRpcCallResult {
  // eth-query always passes `params`, so even if we don't supply this property,
  // for consistency with makeRpcCall, assume that the `body` contains it
  const { method, params = [], ...rest } = request;
  let httpStatus = 200;
  let completeResponse: JSONRPCResponse = { id: 2, jsonrpc: '2.0' };
  if (response !== undefined) {
    if ('body' in response) {
      completeResponse = response.body;
    } else {
      if (response.error) {
        completeResponse.error = response.error;
      } else {
        completeResponse.result = response.result;
      }
      if (response.httpStatus) {
        httpStatus = response.httpStatus;
      }
    }
  }
  /* @ts-expect-error The types for Nock do not include `basePath` in the interface for Nock.Scope. */
  const url = new URL(nockScope.basePath).hostname.match(/(\.|^)infura.io$/u)
    ? `/v3/${MOCK_INFURA_PROJECT_ID}`
    : '/';

  debug('Mocking request:', {
    url,
    method,
    params,
    response,
    error,
    ...rest,
    times,
  });

  let nockRequest = nockScope.post(url, {
    id: /\d*/u,
    jsonrpc: '2.0',
    method,
    params,
    ...rest,
  });

  if (delay !== undefined) {
    nockRequest = nockRequest.delay(delay);
  }

  if (times !== undefined) {
    nockRequest = nockRequest.times(times);
  }

  if (error !== undefined) {
    return nockRequest.replyWithError(error);
  } else if (completeResponse !== undefined) {
    return nockRequest.reply(httpStatus, (_, requestBody: any) => {
      if (response !== undefined && !('body' in response)) {
        if (response.id === undefined) {
          completeResponse.id = requestBody.id;
        } else {
          completeResponse.id = response.id;
        }
      }
      debug('Nock returning Response', completeResponse);
      return completeResponse;
    });
  }
  return nockRequest;
}

type MockBlockTrackerRequestOptions = {
  /**
   * A nock scope (a set of mocked requests scoped to a certain base url).
   */
  nockScope: NockScope;
  /**
   * The block number that the block tracker should report, as a 0x-prefixed hex
   * string.
   */
  blockNumber: string;
};

/**
 * Mocks the next request for the latest block that the block tracker will make.
 *
 * @param args - The arguments.
 * @param args.nockScope - A nock scope (a set of mocked requests scoped to a
 * certain base URL).
 * @param args.blockNumber - The block number that the block tracker should
 * report, as a 0x-prefixed hex string.
 */
function mockNextBlockTrackerRequest({
  nockScope,
  blockNumber = DEFAULT_LATEST_BLOCK_NUMBER,
}: MockBlockTrackerRequestOptions) {
  mockRpcCall({
    nockScope,
    request: { method: 'eth_blockNumber', params: [] },
    response: { result: blockNumber },
  });
}

/**
 * Mocks all requests for the latest block that the block tracker will make.
 *
 * @param args - The arguments.
 * @param args.nockScope - A nock scope (a set of mocked requests scoped to a
 * certain base URL).
 * @param args.blockNumber - The block number that the block tracker should
 * report, as a 0x-prefixed hex string.
 */
async function mockAllBlockTrackerRequests({
  nockScope,
  blockNumber = DEFAULT_LATEST_BLOCK_NUMBER,
}: MockBlockTrackerRequestOptions) {
  const result = await mockRpcCall({
    nockScope,
    request: { method: 'eth_blockNumber', params: [] },
    response: { result: blockNumber },
  });

  if ('persist' in result) {
    result.persist();
  }
}

/**
 * Makes a JSON-RPC call through the given eth-query object.
 *
 * @param ethQuery - The eth-query object.
 * @param request - The request data.
 * @returns A promise that either resolves with the result from the JSON-RPC
 * response if it is successful or rejects with the error from the JSON-RPC
 * response otherwise.
 */
function makeRpcCall(ethQuery: EthQuery, request: Request) {
  return new Promise((resolve, reject) => {
    debug('[makeRpcCall] making request', request);
    ethQuery.sendAsync(request, (error, result) => {
      debug('[makeRpcCall > ethQuery handler] error', error, 'result', result);
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
}

export type ProviderType = 'infura' | 'custom';

export type MockOptions = {
  infuraNetwork?: BuiltInInfuraNetwork;
  providerType: ProviderType;
  customRpcUrl?: string;
  customChainId?: Hex;
};

export type MockCommunications = {
  mockNextBlockTrackerRequest: (options?: any) => void;
  mockAllBlockTrackerRequests: (options?: any) => void;
  mockRpcCall: (options: CurriedMockRpcCallOptions) => MockRpcCallResult;
  rpcUrl: string;
  infuraNetwork: BuiltInInfuraNetwork;
};

/**
 * Sets up request mocks for requests to the provider.
 *
 * @param options - An options bag.
 * @param options.providerType - The type of network client being tested.
 * @param options.infuraNetwork - The name of the Infura network being tested,
 * assuming that `providerType` is "infura" (default: "mainnet").
 * @param options.customRpcUrl - The URL of the custom RPC endpoint, assuming
 * that `providerType` is "custom".
 * @param fn - A function which will be called with an object that allows
 * interaction with the network client.
 * @returns The return value of the given function.
 */
export async function withMockedCommunications(
  {
    providerType,
    infuraNetwork = 'mainnet',
    customRpcUrl = MOCK_RPC_URL,
  }: MockOptions,
  fn: (comms: MockCommunications) => Promise<void>,
) {
  if (providerType !== 'infura' && providerType !== 'custom') {
    throw new Error(
      `providerType must be either "infura" or "custom", was "${providerType}" instead`,
    );
  }

  const rpcUrl =
    providerType === 'infura'
      ? `https://${infuraNetwork}.infura.io`
      : customRpcUrl;
  const nockScope = buildScopeForMockingRequests(rpcUrl);
  const curriedMockNextBlockTrackerRequest = (localOptions: any) =>
    mockNextBlockTrackerRequest({ nockScope, ...localOptions });
  const curriedMockAllBlockTrackerRequests = (localOptions: any) =>
    mockAllBlockTrackerRequests({ nockScope, ...localOptions });
  const curriedMockRpcCall = (localOptions: any) =>
    mockRpcCall({ nockScope, ...localOptions });

  const comms = {
    mockNextBlockTrackerRequest: curriedMockNextBlockTrackerRequest,
    mockAllBlockTrackerRequests: curriedMockAllBlockTrackerRequests,
    mockRpcCall: curriedMockRpcCall,
    rpcUrl,
    infuraNetwork,
  };

  try {
    return await fn(comms);
  } finally {
    nock.isDone();
    nock.cleanAll();
  }
}

type MockNetworkClient = {
  blockTracker: any;
  clock: sinon.SinonFakeTimers;
  makeRpcCall: (request: Request) => Promise<any>;
  makeRpcCallsInSeries: (requests: Request[]) => Promise<any[]>;
};

/**
 * Some middleware contain logic which retries the request if some condition
 * applies. This retrying always happens out of band via `setTimeout`, and
 * because we are stubbing time via Jest's fake timers, we have to manually
 * advance the clock so that the `setTimeout` handlers get fired. We don't know
 * when these timers will get created, however, so we have to keep advancing
 * timers until the request has been made an appropriate number of times.
 * Unfortunately we don't have a good way to know how many times a request has
 * been retried, but the good news is that the middleware won't end, and thus
 * the promise which the RPC call returns won't get fulfilled, until all retries
 * have been made.
 *
 * @param promise - The promise which is returned by the RPC call.
 * @param clock - A Sinon clock object which can be used to advance to the next
 * `setTimeout` handler.
 */
export async function waitForPromiseToBeFulfilledAfterRunningAllTimers(
  promise: any,
  clock: any,
) {
  let hasPromiseBeenFulfilled = false;
  let numTimesClockHasBeenAdvanced = 0;

  promise
    .catch((error: any) => {
      // This is used to silence Node.js warnings about the rejection
      // being handled asynchronously. The error is handled later when
      // `promise` is awaited, but we log it here anyway in case it gets
      // swallowed.
      debug(error);
    })
    .finally(() => {
      hasPromiseBeenFulfilled = true;
    });

  // `hasPromiseBeenFulfilled` is modified asynchronously.
  /* eslint-disable-next-line no-unmodified-loop-condition */
  while (!hasPromiseBeenFulfilled && numTimesClockHasBeenAdvanced < 15) {
    clock.runAll();
    await new Promise((resolve) => originalSetTimeout(resolve, 10));
    numTimesClockHasBeenAdvanced += 1;
  }

  return promise;
}

/**
 * Builds a provider from the middleware (for the provider type) along with a
 * block tracker, runs the given function with those two things, and then
 * ensures the block tracker is stopped at the end.
 *
 * @param options - An options bag.
 * @param options.providerType - The type of network client being tested.
 * @param options.infuraNetwork - The name of the Infura network being tested,
 * assuming that `providerType` is "infura" (default: "mainnet").
 * @param options.customRpcUrl - The URL of the custom RPC endpoint, assuming
 * that `providerType` is "custom".
 * @param options.customChainId - The chain id belonging to the custom RPC
 * endpoint, assuming that `providerType` is "custom" (default: "0x1").
 * @param fn - A function which will be called with an object that allows
 * interaction with the network client.
 * @returns The return value of the given function.
 */
export async function withNetworkClient(
  {
    providerType,
    infuraNetwork = 'mainnet',
    customRpcUrl = MOCK_RPC_URL,
    customChainId = '0x1',
  }: MockOptions,
  fn: (client: MockNetworkClient) => Promise<any>,
) {
  if (providerType !== 'infura' && providerType !== 'custom') {
    throw new Error(
      `providerType must be either "infura" or "custom", was "${providerType}" instead`,
    );
  }

  // Faking timers ends up doing two things:
  // 1. Halting the block tracker (which depends on `setTimeout` to periodically
  // request the latest block) set up in `eth-json-rpc-middleware`
  // 2. Halting the retry logic in `@metamask/eth-json-rpc-infura` (which also
  // depends on `setTimeout`)
  const clock = sinon.useFakeTimers();

  // The JSON-RPC client wraps `eth_estimateGas` so that it takes 2 seconds longer
  // than it usually would to complete. Or at least it should — this doesn't
  // appear to be working correctly. Unset `IN_TEST` on `process.env` to prevent
  // this behavior.
  const inTest = process.env.IN_TEST;
  delete process.env.IN_TEST;
  const clientUnderTest =
    providerType === 'infura'
      ? createNetworkClient({
          network: infuraNetwork,
          infuraProjectId: MOCK_INFURA_PROJECT_ID,
          type: NetworkClientType.Infura,
        })
      : createNetworkClient({
          chainId: customChainId,
          rpcUrl: customRpcUrl,
          type: NetworkClientType.Custom,
        });
  process.env.IN_TEST = inTest;

  const { provider, blockTracker } = clientUnderTest;

  const ethQuery = new EthQuery(provider);
  const curriedMakeRpcCall = (request: Request) =>
    makeRpcCall(ethQuery, request);
  const makeRpcCallsInSeries = async (requests: Request[]) => {
    const responses = [];
    for (const request of requests) {
      responses.push(await curriedMakeRpcCall(request));
    }
    return responses;
  };

  const client = {
    blockTracker,
    clock,
    makeRpcCall: curriedMakeRpcCall,
    makeRpcCallsInSeries,
  };

  try {
    return await fn(client);
  } finally {
    await blockTracker.destroy();

    clock.restore();
  }
}

type BuildMockParamsOptions = {
  // The block parameter value to set.
  blockParam: any;
  // The index of the block parameter.
  blockParamIndex: number;
};

/**
 * Build mock parameters for a JSON-RPC call.
 *
 * The string 'some value' is used as the default value for each entry. The
 * block parameter index determines the number of parameters to generate.
 *
 * The block parameter can be set to a custom value. If no value is given, it
 * is set as undefined.
 *
 * @param args - Arguments.
 * @param args.blockParamIndex - The index of the block parameter.
 * @param args.blockParam - The block parameter value to set.
 * @returns The mock params.
 */
export function buildMockParams({
  blockParam,
  blockParamIndex,
}: BuildMockParamsOptions) {
  const params = new Array(blockParamIndex).fill('some value');
  params[blockParamIndex] = blockParam;

  return params;
}

/**
 * Returns a partial JSON-RPC request object, with the "block" param replaced
 * with the given value.
 *
 * @param request - The request object.
 * @param request.method - The request method.
 * @param request.params - The request params.
 * @param blockParamIndex - The index within the `params` array of the block
 * param.
 * @param blockParam - The desired block param value.
 * @returns The updated request object.
 */
export function buildRequestWithReplacedBlockParam(
  { method, params = [] }: Request,
  blockParamIndex: number,
  blockParam: any,
) {
  const updatedParams = params.slice();
  updatedParams[blockParamIndex] = blockParam;
  return { method, params: updatedParams };
}
