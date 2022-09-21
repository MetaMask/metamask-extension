import nock from 'nock';
import sinon from 'sinon';
import { JsonRpcEngine } from 'json-rpc-engine';
import { providerFromEngine } from 'eth-json-rpc-middleware';
import EthQuery from 'eth-query';
import createInfuraClient from '../createInfuraClient';

/**
 * @typedef {import('nock').Scope} NockScope
 *
 * A object returned by `nock(...)` for mocking requests to a particular base
 * URL.
 */

/**
 * @typedef {{makeRpcCall: (request: Partial<JsonRpcRequest>) => Promise<any>, makeRpcCallsInSeries: (requests: Partial<JsonRpcRequest>[]) => Promise<any>}} InfuraClient
 *
 * Provides methods to interact with the suite of middleware that
 * `createInfuraClient` exposes.
 */

/**
 * @typedef {{network: string}} WithInfuraClientOptions
 *
 * The options bag that `withInfuraClient` takes.
 */

/**
 * @typedef {(client: InfuraClient) => Promise<any>} WithInfuraClientCallback
 *
 * The callback that `withInfuraClient` takes.
 */

/**
 * @typedef {[WithInfuraClientOptions, WithInfuraClientCallback] | [WithInfuraClientCallback]} WithInfuraClientArgs
 *
 * The arguments to `withInfuraClient`.
 */

/**
 * @typedef {{ nockScope: NockScope, blockNumber: string }} MockNextBlockTrackerRequestOptions
 *
 * The options to `mockNextBlockTrackerRequest`.
 */

/**
 * @typedef {{ nockScope: NockScope, request: object, response: object, delay?: number }} MockSuccessfulInfuraRpcCallOptions
 *
 * The options to `mockSuccessfulInfuraRpcCall`.
 */

/**
 * @typedef {{mockNextBlockTrackerRequest: (options: Omit<MockNextBlockTrackerRequestOptions, 'nockScope'>) => void, mockSuccessfulInfuraRpcCall: (options: Omit<MockSuccessfulInfuraRpcCallOptions, 'nockScope'>) => NockScope}} InfuraCommunications
 *
 * Provides methods to mock different kinds of requests to Infura.
 */

/**
 * @typedef {{network: string}} MockingInfuraCommunicationsOptions
 *
 * The options bag that `mockingInfuraCommunications` takes.
 */

/**
 * @typedef {(comms: InfuraCommunications) => Promise<any>} MockingInfuraCommunicationsCallback
 *
 * The callback that `mockingInfuraCommunications` takes.
 */

/**
 * @typedef {[MockingInfuraCommunicationsOptions, MockingInfuraCommunicationsCallback] | [MockingInfuraCommunicationsCallback]} MockingInfuraCommunicationsArgs
 *
 * The arguments to `mockingInfuraCommunications`.
 */

const INFURA_PROJECT_ID = 'abc123';
const DEFAULT_LATEST_BLOCK_NUMBER = '0x42';

/**
 * If you're having trouble writing a test and you're wondering why the test
 * keeps failing, you can set `process.env.DEBUG_PROVIDER_TESTS` to `1`. This
 * will turn on some extra logging.
 *
 * @param {any[]} args - The arguments that `console.log` takes.
 */
function debug(...args) {
  if (process.env.DEBUG_PROVIDER_TESTS === '1') {
    console.log(...args);
  }
}

/**
 * Builds a Nock scope object for mocking requests to a particular network that
 * Infura supports.
 *
 * @param {object} options - The options.
 * @param {string} options.network - The Infura network you're testing with
 * (default: "mainnet").
 * @returns {NockScope} The nock scope.
 */
function buildScopeForMockingInfuraRequests({ network = 'mainnet' } = {}) {
  return nock(`https://${network}.infura.io`).filteringRequestBody((body) => {
    const copyOfBody = JSON.parse(body);
    // some ids are random, so remove them entirely from the request to
    // make it possible to mock these requests
    delete copyOfBody.id;
    return JSON.stringify(copyOfBody);
  });
}

/**
 * Mocks the next request for the latest block that the block tracker will make.
 *
 * @param {MockNextBlockTrackerRequestOptions} args - The arguments.
 * @param {NockScope} args.nockScope - A nock scope (a set of mocked requests
 * scoped to a certain base URL).
 * @param {string} args.blockNumber - The block number that the block tracker
 * should report, as a 0x-prefixed hex string.
 */
async function mockNextBlockTrackerRequest({
  nockScope,
  blockNumber = DEFAULT_LATEST_BLOCK_NUMBER,
}) {
  await mockSuccessfulInfuraRpcCall({
    nockScope,
    request: { method: 'eth_blockNumber', params: [] },
    response: { result: blockNumber },
  });
}

/**
 * Mocks a JSON-RPC request sent to Infura with the given response.
 *
 * @param {MockSuccessfulInfuraRpcCallOptions} args - The arguments.
 * @param {NockScope} args.nockScope - A nock scope (a set of mocked requests
 * scoped to a certain base URL).
 * @param {object} args.request - The request data.
 * @param {object} args.response - The response that the request should have.
 * @param {number} args.delay - The amount of time that should pass before the
 * request resolves with the response.
 * @returns {NockScope} The nock scope.
 */
function mockSuccessfulInfuraRpcCall({ nockScope, request, response, delay }) {
  // eth-query always passes `params`, so even if we don't supply this property
  // for consistency with makeRpcCall, assume that the `body` contains it
  const { method, params = [], ...rest } = request;
  const completeResponse = {
    id: 1,
    jsonrpc: '2.0',
    ...response,
  };
  const nockRequest = nockScope.post(`/v3/${INFURA_PROJECT_ID}`, {
    jsonrpc: '2.0',
    method,
    params,
    ...rest,
  });

  if (delay !== undefined) {
    nockRequest.delay(delay);
  }

  return nockRequest.reply(200, completeResponse);
}

/**
 * Makes a JSON-RPC call through the given eth-query object.
 *
 * @param {any} ethQuery - The eth-query object.
 * @param {object} request - The request data.
 * @returns {Promise<any>} A promise that either resolves with the result from
 * the JSON-RPC response if it is successful or rejects with the error from the
 * JSON-RPC response otherwise.
 */
function makeRpcCall(ethQuery, request) {
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
 * Sets up request mocks for requests to Infura.
 *
 * @param {MockingInfuraCommunicationsArgs} args - Either an options bag + a
 * function, or just a function. The options bag, at the moment, may contain
 * `network` (that is, the Infura network; defaults to "mainnet"). The function
 * is called with an object that allows you to mock different kinds of requests.
 * @returns {Promise<any>} The return value of the given function.
 */
export async function withMockedInfuraCommunications(...args) {
  const [options, fn] = args.length === 2 ? args : [{}, args[0]];
  const { network = 'mainnet' } = options;

  const nockScope = buildScopeForMockingInfuraRequests({ network });
  const curriedMockNextBlockTrackerRequest = (localOptions) =>
    mockNextBlockTrackerRequest({ nockScope, ...localOptions });
  const curriedMockSuccessfulInfuraRpcCall = (localOptions) =>
    mockSuccessfulInfuraRpcCall({ nockScope, ...localOptions });
  const comms = {
    mockNextBlockTrackerRequest: curriedMockNextBlockTrackerRequest,
    mockSuccessfulInfuraRpcCall: curriedMockSuccessfulInfuraRpcCall,
  };

  try {
    return await fn(comms);
  } finally {
    nock.isDone();
    nock.cleanAll();
  }
}

/**
 * Builds a provider from the Infura middleware along with a block tracker, runs
 * the given function with those two things, and then ensures the block tracker
 * is stopped at the end.
 *
 * @param {WithInfuraClientArgs} args - Either an options bag + a function, or
 * just a function. The options bag, at the moment, may contain `network` (that
 * is, the Infura network; defaults to "mainnet"). The function is called with
 * an object that allows you to interact with the client via a couple of methods
 * on that object.
 * @returns {Promise<any>} The return value of the given function.
 */
export async function withInfuraClient(...args) {
  const [options, fn] = args.length === 2 ? args : [{}, args[0]];
  const { network = 'mainnet' } = options;

  const { networkMiddleware, blockTracker } = createInfuraClient({
    network,
    projectId: INFURA_PROJECT_ID,
  });

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
    makeRpcCall: curriedMakeRpcCall,
    makeRpcCallsInSeries,
    clock,
  };

  try {
    return await fn(client);
  } finally {
    await blockTracker.destroy();

    clock.restore();
  }
}

/**
 * Some JSON-RPC endpoints take a "block" param (example: `eth_blockNumber`)
 * which can optionally be left out. Additionally, the endpoint may support some
 * number of arguments, although the "block" param will always be last, even if
 * it is optional. Given this, this function builds a mock `params` array for
 * such an endpoint, filling it with arbitrary values, but with the "block"
 * param missing.
 *
 * @param {number} index - The index within the `params` array where the "block"
 * param *would* appear.
 * @returns {string[]} The mock params.
 */
export function buildMockParamsWithoutBlockParamAt(index) {
  const params = [];
  for (let i = 0; i < index; i++) {
    params.push('some value');
  }
  return params;
}

/**
 * Some JSON-RPC endpoints take a "block" param (example: `eth_blockNumber`)
 * which can optionally be left out. Additionally, the endpoint may support some
 * number of arguments, although the "block" param will always be last, even if
 * it is optional. Given this, this function builds a `params` array for such an
 * endpoint with the given "block" param added at the end.
 *
 * @param {number} index - The index within the `params` array to add the
 * "block" param.
 * @param {any} blockParam - The desired "block" param to add.
 * @returns {any[]} The mock params.
 */
export function buildMockParamsWithBlockParamAt(index, blockParam) {
  const params = buildMockParamsWithoutBlockParamAt(index);
  params.push(blockParam);
  return params;
}

/**
 * Returns a partial JSON-RPC request object, with the "block" param replaced
 * with the given value.
 *
 * @param {object} request - The request object.
 * @param {string} request.method - The request method.
 * @param {params} [request.params] - The request params.
 * @param {number} blockParamIndex - The index within the `params` array of the
 * block param.
 * @param {any} blockParam - The desired block param value.
 * @returns {object} The updated request object.
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
