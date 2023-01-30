import nock from 'nock';
import sinon from 'sinon';
import {
  JsonRpcEngine,
  JsonRpcRequest,
  JsonRpcResponse,
} from 'json-rpc-engine';
import { providerFromEngine } from 'eth-json-rpc-middleware';
import EthQuery from 'eth-query';
import { Hex } from '@metamask/utils';
import {
  createNetworkClient,
  NetworkClientType,
} from '../create-network-client';

/**
 * Provides methods to interact with the suite of middleware that
 * `createInfuraClient` or `createJsonRpcClient` exposes.
 */
type Client = {
  blockTracker: import('eth-block-tracker').PollingBlockTracker;
  clock: sinon.SinonFakeTimers;
  makeRpcCall: (request: Partial<JsonRpcRequest<unknown>>) => Promise<any>;
  makeRpcCallsInSeries: (
    requests: Partial<JsonRpcRequest<unknown>>[],
  ) => Promise<any>;
};

/**
 * The options bag that `withNetworkClient` takes.
 */
type WithClientOptions = {
  providerType: NetworkClientType;
  infuraNetwork?: string;
  customRpcUrl?: string;
  customChainId?: string;
};

type WithClientCallback = (client: Client) => Promise<any>;

/**
 * @typedef {} WithClientCallback
 *
 * The callback that `withNetworkClient` takes.
 */

/**
 * @typedef {{ nockScope: NockScope, blockNumber: string }} MockBlockTrackerRequestOptions
 *
 * The options to `mockNextBlockTrackerRequest` and `mockAllBlockTrackerRequests`.
 */

/**
 * @typedef {{ nockScope: NockScope, request: object, response: object, delay?: number }} MockRpcCallOptions
 *
 * The options to `mockRpcCall`.
 */

/**
 * @typedef {{mockNextBlockTrackerRequest: (options: Omit<MockBlockTrackerRequestOptions, 'nockScope'>) => void, mockAllBlockTrackerRequests: (options: Omit<MockBlockTrackerRequestOptions, 'nockScope'>) => void, mockRpcCall: (options: Omit<MockRpcCallOptions, 'nockScope'>) => NockScope, rpcUrl: string, infuraNetwork: string}} Communications
 *
 * Provides methods to mock different kinds of requests to the provider.
 */

/**
 * @typedef {{providerType: 'infura' | 'custom', infuraNetwork?: string}} WithMockedCommunicationsOptions
 *
 * The options bag that `Communications` takes.
 */

/**
 * @typedef {(comms: Communications) => Promise<any>} WithMockedCommunicationsCallback
 *
 * The callback that `mockingCommunications` takes.
 */

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
 * If you're having trouble writing a test and you're wondering why the test
 * keeps failing, you can set `process.env.DEBUG_PROVIDER_TESTS` to `1`. This
 * will turn on some extra logging.
 *
 * @param args - The arguments that `console.log` takes.
 */
function debug(...args: Parameters<Console['log']>) {
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
function buildScopeForMockingRequests(rpcUrl: string) {
  return nock(rpcUrl).filteringRequestBody((body) => {
    const copyOfBody = JSON.parse(body);
    // Some IDs are random, so remove them entirely from the request to make it
    // possible to mock these requests
    delete copyOfBody.id;
    return JSON.stringify(copyOfBody);
  });
}

/**
 * Mocks the next request for the latest block that the block tracker will make.
 *
 * @param args - The arguments.
 * @param args.nockScope - A nock scope (a set of mocked requests
 * scoped to a certain base URL).
 * @param args.blockNumber - The block number that the block tracker
 * should report, as a 0x-prefixed hex string.
 */
async function mockNextBlockTrackerRequest({
  nockScope,
  blockNumber = DEFAULT_LATEST_BLOCK_NUMBER,
}: {
  nockScope: nock.Scope;
  blockNumber: Hex;
}) {
  await mockRpcCall({
    nockScope,
    request: { method: 'eth_blockNumber', params: [] },
    response: { result: blockNumber },
  });
}

/**
 * Mocks all requests for the latest block that the block tracker will make.
 *
 * @param args - The arguments.
 * @param args.nockScope - A nock scope (a set of mocked requests
 * scoped to a certain base URL).
 * @param args.blockNumber - The block number that the block tracker
 * should report, as a 0x-prefixed hex string.
 */
async function mockAllBlockTrackerRequests({
  nockScope,
  blockNumber = DEFAULT_LATEST_BLOCK_NUMBER,
}: {
  nockScope: nock.Scope;
  blockNumber: Hex;
}) {
  await mockRpcCall({
    nockScope,
    request: { method: 'eth_blockNumber', params: [] },
    response: { result: blockNumber },
  }).persist();
}

/**
 * Mocks a JSON-RPC request sent to the provider with the given response.
 * Provider type is inferred from the base url set on the nockScope.
 *
 * @param args - The arguments.
 * @param args.nockScope - A nock scope (a set of mocked requests
 * scoped to a certain base URL).
 * @param args.request - The request data.
 * @param [args.response] - Information
 * concerning the response that the request should have. If a `body` property is
 * present, this is taken as the complete response body. If an `httpStatus`
 * property is present, then it is taken as the HTTP status code to respond
 * with. Properties other than these two are used to build a complete response
 * body (including `id` and `jsonrpc` properties).
 * @param [args.error] - An error to throw while making the
 * request. Takes precedence over `response`.
 * @param [args.delay] - The amount of time that should pass before the
 * request resolves with the response.
 * @param [args.times] - The number of times that the request is
 * expected to be made.
 * @returns The nock scope.
 */
function mockRpcCall({
  nockScope,
  request,
  response,
  error,
  delay,
  times,
}: {
  nockScope: nock.Scope;
  request: JsonRpcRequest<any>;
  response?: JsonRpcResponse<any>;
  error?: Error;
  delay?: number;
  times?: number;
}) {
  // eth-query always passes `params`, so even if we don't supply this property,
  // for consistency with makeRpcCall, assume that the `body` contains it
  const { method, params = [], ...rest } = request;
  const httpStatus = response?.httpStatus ?? 200;
  let completeResponse;
  if (response !== undefined) {
    if (response.body === undefined) {
      completeResponse = { id: 1, jsonrpc: '2.0' };
      ['id', 'jsonrpc', 'result', 'error'].forEach((prop) => {
        if (response[prop] !== undefined) {
          completeResponse[prop] = response[prop];
        }
      });
    } else {
      completeResponse = response.body;
    }
  }
  const url = nockScope.basePath.includes('infura.io')
    ? `/v3/${MOCK_INFURA_PROJECT_ID}`
    : '/';
  let nockRequest = nockScope.post(url, {
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
    return nockRequest.reply(httpStatus, completeResponse);
  }
  return nockRequest;
}

/**
 * Makes a JSON-RPC call through the given eth-query object.
 *
 * @param ethQuery - The eth-query object.
 * @param request - The request data.
 * @returns A promise that either resolves with the result from
 * the JSON-RPC response if it is successful or rejects with the error from the
 * JSON-RPC response otherwise.
 */
function makeRpcCall<T>(
  ethQuery: EthQuery,
  request: JsonRpcRequest<T>,
): Promise<JsonRpcResponse<T>> {
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

/**
 * Sets up request mocks for requests to the provider.
 *
 * @param options - An options bag.
 * @param options.providerType - The type of network
 * client being tested.
 * @param [options.infuraNetwork] - The name of the Infura network being
 * tested, assuming that `providerType` is "infura" (default: "mainnet").
 * @param [options.customRpcUrl] - The URL of the custom RPC endpoint,
 * assuming that `providerType` is "custom".
 * @param fn - A function which will be
 * called with an object that allows interaction with the network client.
 * @returns The return value of the given function.
 */
export async function withMockedCommunications(
  {
    providerType,
    infuraNetwork = 'mainnet',
    customRpcUrl = MOCK_RPC_URL,
  }: {
    providerType: NetworkClientType;
    infuraNetwork: 'mainnet' | 'goerli' | 'sepolia';
    customRpcUrl: string;
  },
  fn: (Client) => unknown,
) {
  const rpcUrl =
    providerType === 'infura'
      ? `https://${infuraNetwork}.infura.io`
      : customRpcUrl;
  const nockScope = buildScopeForMockingRequests(rpcUrl);
  const curriedMockNextBlockTrackerRequest = (localOptions) =>
    mockNextBlockTrackerRequest({ nockScope, ...localOptions });
  const curriedMockAllBlockTrackerRequests = (localOptions) =>
    mockAllBlockTrackerRequests({ nockScope, ...localOptions });
  const curriedMockRpcCall = (localOptions) =>
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

/**
 * Builds a provider from the middleware (for the provider type) along with a
 * block tracker, runs the given function with those two things, and then
 * ensures the block tracker is stopped at the end.
 *
 * @param options - An options bag.
 * @param options.providerType - The type of network
 * client being tested.
 * @param [options.infuraNetwork] - The name of the Infura network being
 * tested, assuming that `providerType` is "infura" (default: "mainnet").
 * @param [options.customRpcUrl] - The URL of the custom RPC endpoint,
 * assuming that `providerType` is "custom".
 * @param [options.customChainId] - The chain id belonging to the
 * custom RPC endpoint, assuming that `providerType` is "custom" (default:
 * "0x1").
 * @param fn - A function which will be called with an
 * object that allows interaction with the network client.
 * @returns The return value of the given function.
 */
export async function withNetworkClient(
  {
    providerType,
    infuraNetwork = 'mainnet',
    customRpcUrl = MOCK_RPC_URL,
    customChainId = '0x1',
  }: {
    providerType: NetworkClientType;
    infuraNetwork: 'mainnet' | 'goerli' | 'sepolia';
    customRpcUrl: string;
    customChainId: Hex;
  },
  fn,
) {
  // The JSON-RPC client wraps `eth_estimateGas` so that it takes 2 seconds longer
  // than it usually would to complete. Or at least it should — this doesn't
  // appear to be working correctly. Unset `IN_TEST` on `process.env` to prevent
  // this behavior.
  const inTest = process.env.IN_TEST;
  delete process.env.IN_TEST;
  const clientUnderTest =
    providerType === NetworkClientType.INFURA
      ? createNetworkClient({
          network: infuraNetwork,
          projectId: MOCK_INFURA_PROJECT_ID,
          type: providerType,
        })
      : createNetworkClient({
          chainId: customChainId,
          rpcUrl: customRpcUrl,
          type: providerType,
        });
  process.env.IN_TEST = inTest;

  const { networkMiddleware, blockTracker } = clientUnderTest;

  const engine = new JsonRpcEngine();
  engine.push(networkMiddleware);
  const provider = providerFromEngine(engine);
  const ethQuery = new EthQuery(provider);

  const curriedMakeRpcCall = (request) => makeRpcCall(ethQuery, request);
  const makeRpcCallsInSeries = async (requests) => {
    const responses = [];
    for (const request of requests) {
      responses.push(await curriedMakeRpcCall(request));
    }
    return responses;
  };
  // Faking timers ends up doing two things:
  // 1. Halting the block tracker (which depends on `setTimeout` to periodically
  // request the latest block) set up in `eth-json-rpc-middleware`
  // 2. Halting the retry logic in `@metamask/eth-json-rpc-infura` (which also
  // depends on `setTimeout`)
  const clock = sinon.useFakeTimers();
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
 * @param [args.blockParam] - The block parameter value to set.
 * @returns The mock params.
 */
export function buildMockParams({ blockParam, blockParamIndex }) {
  if (blockParamIndex === undefined) {
    throw new Error(`Missing 'blockParamIndex'`);
  }

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
 * @param [request.params] - The request params.
 * @param blockParamIndex - The index within the `params` array of the
 * block param.
 * @param blockParam - The desired block param value.
 * @returns The updated request object.
 */
export function buildRequestWithReplacedBlockParam(
  { method, params = [] },
  blockParamIndex,
  blockParam,
) {
  const updatedParams = params.slice();
  updatedParams[blockParamIndex] = blockParam;
  return { method, params: updatedParams };
}
