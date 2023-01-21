/* eslint-disable jest/require-top-level-describe, jest/no-export, jest/no-identical-title */

import { fill } from 'lodash';
import {
  withMockedCommunications,
  withNetworkClient,
  buildMockParams,
  buildRequestWithReplacedBlockParam,
} from './helpers';

const originalSetTimeout = setTimeout;

/**
 * Constructs an error message that the Infura client would produce in the event
 * that it has attempted to retry the request to Infura and has failed.
 *
 * @param reason - The exact reason for failure.
 * @returns The error message.
 */
function buildInfuraClientRetriesExhaustedErrorMessage(reason) {
  return new RegExp(
    `^InfuraProvider - cannot complete request. All retries exhausted\\..+${reason}`,
    'us',
  );
}

/**
 * Constructs an error message that JsonRpcEngine would produce in the event
 * that the response object is empty as it leaves the middleware.
 *
 * @param method - The RPC method.
 * @returns The error message.
 */
function buildJsonRpcEngineEmptyResponseErrorMessage(method) {
  return new RegExp(
    `^JsonRpcEngine: Response has no error or result for request:.+"method": "${method}"`,
    'us',
  );
}

/**
 * Constructs an error message that `fetch` with throw if it cannot make a
 * request.
 *
 * @param url - The URL being fetched
 * @param reason - The reason.
 * @returns The error message.
 */
function buildFetchFailedErrorMessage(url, reason) {
  return new RegExp(
    `^request to ${url}(/[^/ ]*)+ failed, reason: ${reason}`,
    'us',
  );
}

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
async function waitForPromiseToBeFulfilledAfterRunningAllTimers(
  promise,
  clock,
) {
  let hasPromiseBeenFulfilled = false;
  let numTimesClockHasBeenAdvanced = 0;

  promise
    .catch(() => {
      // This is used to silence Node.js warnings about the rejection
      // being handled asynchronously. The error is handled later when
      // `promise` is awaited.
    })
    .finally(() => {
      hasPromiseBeenFulfilled = true;
    });

  // `isPromiseFulfilled` is modified asynchronously.
  /* eslint-disable-next-line no-unmodified-loop-condition */
  while (!hasPromiseBeenFulfilled && numTimesClockHasBeenAdvanced < 15) {
    clock.runAll();
    await new Promise((resolve) => originalSetTimeout(resolve, 10));
    numTimesClockHasBeenAdvanced += 1;
  }

  return promise;
}

/**
 * Defines tests that are common to both the Infura and JSON-RPC network client.
 *
 * @param providerType - The type of provider being tested, which determines
 * which suite of middleware is being tested. If `infura`, then the middleware
 * exposed by `createInfuraClient` is tested; if `custom`, then the middleware
 * exposed by `createJsonRpcClient` will be tested.
 */
/* eslint-disable-next-line jest/no-export */
export function testsForProviderType(providerType) {
  // Ethereum JSON-RPC spec: <https://ethereum.github.io/execution-apis/api-documentation/>
  // Infura documentation: <https://docs.infura.io/infura/networks/ethereum/json-rpc-methods>

  describe('methods included in the Ethereum JSON-RPC spec', () => {
    describe('methods not handled by middleware', () => {
      const notHandledByMiddleware = [
        { name: 'eth_accounts', numberOfParameters: 0 },
        { name: 'eth_coinbase', numberOfParameters: 0 },
        { name: 'eth_feeHistory', numberOfParameters: 3 },
        { name: 'eth_getFilterChanges', numberOfParameters: 1 },
        { name: 'eth_getLogs', numberOfParameters: 1 },
        { name: 'eth_getWork', numberOfParameters: 0 },
        { name: 'eth_hashrate', numberOfParameters: 0 },
        { name: 'eth_mining', numberOfParameters: 0 },
        { name: 'eth_newBlockFilter', numberOfParameters: 0 },
        { name: 'eth_newFilter', numberOfParameters: 1 },
        { name: 'eth_newPendingTransactionFilter', numberOfParameters: 0 },
        { name: 'eth_sendRawTransaction', numberOfParameters: 1 },
        { name: 'eth_sendTransaction', numberOfParameters: 1 },
        { name: 'eth_sign', numberOfParameters: 2 },
        { name: 'eth_submitWork', numberOfParameters: 3 },
        { name: 'eth_syncing', numberOfParameters: 0 },
        { name: 'eth_uninstallFilter', numberOfParameters: 1 },
      ];
      notHandledByMiddleware.forEach(({ name, numberOfParameters }) => {
        describe(`method name: ${name}`, () => {
          testsForRpcMethodNotHandledByMiddleware(name, {
            providerType,
            numberOfParameters,
          });
        });
      });
    });

    describe('methods that have a param to specify the block', () => {
      const supportingBlockParam = [
        {
          name: 'eth_call',
          blockParamIndex: 1,
          numberOfParameters: 2,
        },
        {
          name: 'eth_getBalance',
          blockParamIndex: 1,
          numberOfParameters: 2,
        },
        {
          name: 'eth_getBlockByNumber',
          blockParamIndex: 0,
          numberOfParameters: 2,
        },
        { name: 'eth_getCode', blockParamIndex: 1, numberOfParameters: 2 },
        {
          name: 'eth_getStorageAt',
          blockParamIndex: 2,
          numberOfParameters: 3,
        },
        {
          name: 'eth_getTransactionCount',
          blockParamIndex: 1,
          numberOfParameters: 2,
        },
      ];
      supportingBlockParam.forEach(
        ({ name, blockParamIndex, numberOfParameters }) => {
          describe(`method name: ${name}`, () => {
            testsForRpcMethodSupportingBlockParam(name, {
              providerType,
              blockParamIndex,
              numberOfParameters,
            });
          });
        },
      );
    });

    describe('methods that assume there is no block param', () => {
      const assumingNoBlockParam = [
        { name: 'eth_blockNumber', numberOfParameters: 0 },
        { name: 'eth_estimateGas', numberOfParameters: 2 },
        { name: 'eth_gasPrice', numberOfParameters: 0 },
        { name: 'eth_getBlockByHash', numberOfParameters: 2 },
        // NOTE: eth_getBlockTransactionCountByNumber does take a block param at
        // the 0th index, but this is not handled by our cache middleware
        // currently
        {
          name: 'eth_getBlockTransactionCountByNumber',
          numberOfParameters: 1,
        },
        // NOTE: eth_getTransactionByBlockNumberAndIndex does take a block param
        // at the 0th index, but this is not handled by our cache middleware
        // currently
        {
          name: 'eth_getTransactionByBlockNumberAndIndex',
          numberOfParameters: 2,
        },
        {
          name: 'eth_getBlockTransactionCountByHash',
          numberOfParameters: 1,
        },
        { name: 'eth_getFilterLogs', numberOfParameters: 1 },
        {
          name: 'eth_getTransactionByBlockHashAndIndex',
          numberOfParameters: 2,
        },
        { name: 'eth_getUncleByBlockHashAndIndex', numberOfParameters: 2 },
        // NOTE: eth_getUncleByBlockNumberAndIndex does take a block param at
        // the 0th index, but this is not handled by our cache middleware
        // currently
        { name: 'eth_getUncleByBlockNumberAndIndex', numberOfParameters: 2 },
        { name: 'eth_getUncleCountByBlockHash', numberOfParameters: 1 },
        // NOTE: eth_getUncleCountByBlockNumber does take a block param at the
        // 0th index, but this is not handled by our cache middleware currently
        { name: 'eth_getUncleCountByBlockNumber', numberOfParameters: 1 },
      ];
      assumingNoBlockParam.forEach(({ name, numberOfParameters }) =>
        describe(`method name: ${name}`, () => {
          testsForRpcMethodAssumingNoBlockParam(name, {
            providerType,
            numberOfParameters,
          });
        }),
      );
    });

    describe('methods with block hashes in their result', () => {
      const methodsWithBlockHashInResponse = [
        { name: 'eth_getTransactionByHash', numberOfParameters: 1 },
        { name: 'eth_getTransactionReceipt', numberOfParameters: 1 },
      ];
      methodsWithBlockHashInResponse.forEach(({ name, numberOfParameters }) => {
        describe(`method name: ${name}`, () => {
          testsForRpcMethodsThatCheckForBlockHashInResponse(name, {
            numberOfParameters,
            providerType,
          });
        });
      });
    });

    describe('other methods', () => {
      describe('eth_getTransactionByHash', () => {
        it("refreshes the block tracker's current block if it is less than the block number that comes back in the response", async () => {
          const method = 'eth_getTransactionByHash';

          await withMockedCommunications({ providerType }, async (comms) => {
            const request = { method };

            comms.mockNextBlockTrackerRequest({ blockNumber: '0x100' });
            // This is our request.
            comms.mockRpcCall({
              request,
              response: {
                result: {
                  blockNumber: '0x200',
                },
              },
            });
            comms.mockNextBlockTrackerRequest({ blockNumber: '0x300' });

            await withNetworkClient(
              { providerType },
              async ({ makeRpcCall, blockTracker }) => {
                await makeRpcCall(request);
                expect(blockTracker.getCurrentBlock()).toStrictEqual('0x300');
              },
            );
          });
        });
      });

      describe('eth_getTransactionReceipt', () => {
        it("refreshes the block tracker's current block if it is less than the block number that comes back in the response", async () => {
          const method = 'eth_getTransactionReceipt';

          await withMockedCommunications({ providerType }, async (comms) => {
            const request = { method };

            comms.mockNextBlockTrackerRequest({ blockNumber: '0x100' });
            // This is our request.
            comms.mockRpcCall({
              request,
              response: {
                result: {
                  blockNumber: '0x200',
                },
              },
            });
            comms.mockNextBlockTrackerRequest({ blockNumber: '0x300' });

            await withNetworkClient(
              { providerType },
              async ({ makeRpcCall, blockTracker }) => {
                await makeRpcCall(request);
                expect(blockTracker.getCurrentBlock()).toStrictEqual('0x300');
              },
            );
          });
        });
      });

      describe('eth_chainId', () => {
        it('does not hit the RPC endpoint, instead returning the configured chain id', async () => {
          const networkId = await withNetworkClient(
            { providerType: 'custom', customChainId: '0x1' },
            ({ makeRpcCall }) => {
              return makeRpcCall({ method: 'eth_chainId' });
            },
          );

          expect(networkId).toStrictEqual('0x1');
        });
      });
    });
  });

  describe('methods not included in the Ethereum JSON-RPC spec', () => {
    describe('methods not handled by middleware', () => {
      const notHandledByMiddleware = [
        { name: 'custom_rpc_method', numberOfParameters: 1 },
        { name: 'eth_subscribe', numberOfParameters: 1 },
        { name: 'eth_unsubscribe', numberOfParameters: 1 },
        { name: 'net_listening', numberOfParameters: 0 },
        { name: 'net_peerCount', numberOfParameters: 0 },
        { name: 'parity_nextNonce', numberOfParameters: 1 },
      ];
      notHandledByMiddleware.forEach(({ name, numberOfParameters }) => {
        describe(`method name: ${name}`, () => {
          testsForRpcMethodNotHandledByMiddleware(name, {
            providerType,
            numberOfParameters,
          });
        });
      });
    });

    describe('methods that assume there is no block param', () => {
      const assumingNoBlockParam = [
        { name: 'eth_protocolVersion', numberOfParameters: 0 },
        { name: 'web3_clientVersion', numberOfParameters: 0 },
      ];
      assumingNoBlockParam.forEach(({ name, numberOfParameters }) =>
        describe(`method name: ${name}`, () => {
          testsForRpcMethodAssumingNoBlockParam(name, {
            providerType,
            numberOfParameters,
          });
        }),
      );
    });

    describe('other methods', () => {
      describe('net_version', () => {
        // The Infura middleware includes `net_version` in its scaffold
        // middleware, whereas the custom RPC middleware does not.
        if (providerType === 'infura') {
          it('does not hit Infura, instead returning the network ID that maps to the Infura network, as a decimal string', async () => {
            const networkId = await withNetworkClient(
              { providerType: 'infura', infuraNetwork: 'goerli' },
              ({ makeRpcCall }) => {
                return makeRpcCall({
                  method: 'net_version',
                });
              },
            );
            expect(networkId).toStrictEqual('5');
          });
        } else {
          it('hits the RPC endpoint', async () => {
            await withMockedCommunications(
              { providerType: 'custom' },
              async (comms) => {
                comms.mockRpcCall({
                  request: { method: 'net_version' },
                  response: { result: '1' },
                });

                const networkId = await withNetworkClient(
                  { providerType: 'custom' },
                  ({ makeRpcCall }) => {
                    return makeRpcCall({
                      method: 'net_version',
                    });
                  },
                );

                expect(networkId).toStrictEqual('1');
              },
            );
          });
        }
      });
    });
  });
}

/**
 * Defines tests which exercise the behavior exhibited by an RPC method that
 * is not handled specially by the network client middleware.
 *
 * @param method - The name of the RPC method under test.
 * @param additionalArgs - Additional arguments.
 * @param additionalArgs.providerType - The type of provider being tested;
 * either `infura` or `custom`.
 * @param additionalArgs.numberOfParameters - The number of parameters that this
 * RPC method takes.
 */
/* eslint-disable-next-line jest/no-export */
export function testsForRpcMethodNotHandledByMiddleware(
  method,
  { providerType, numberOfParameters },
) {
  if (providerType !== 'infura' && providerType !== 'custom') {
    throw new Error(
      `providerType must be either "infura" or "custom", was "${providerType}" instead`,
    );
  }

  it('attempts to pass the request off to the RPC endpoint', async () => {
    const request = {
      method,
      params: fill(Array(numberOfParameters), 'some value'),
    };
    const expectedResult = 'the result';

    await withMockedCommunications({ providerType }, async (comms) => {
      // The first time a block-cacheable request is made, the latest block
      // number is retrieved through the block tracker first. It doesn't
      // matter what this is — it's just used as a cache key.
      comms.mockNextBlockTrackerRequest();
      comms.mockRpcCall({
        request,
        response: { result: expectedResult },
      });
      const actualResult = await withNetworkClient(
        { providerType },
        ({ makeRpcCall }) => makeRpcCall(request),
      );

      expect(actualResult).toStrictEqual(expectedResult);
    });
  });
}

/**
 * Defines tests which exercise the behavior exhibited by an RPC method which is
 * assumed to not take a block parameter. Even if it does, the value of this
 * parameter will not be used in determining how to cache the method.
 *
 * @param method - The name of the RPC method under test.
 * @param additionalArgs - Additional arguments.
 * @param additionalArgs.numberOfParameters - The number of parameters supported by the method under test.
 * @param additionalArgs.providerType - The type of provider being tested;
 * either `infura` or `custom` (default: "infura").
 */
export function testsForRpcMethodAssumingNoBlockParam(
  method,
  { numberOfParameters, providerType },
) {
  if (providerType !== 'infura' && providerType !== 'custom') {
    throw new Error(
      `providerType must be either "infura" or "custom", was "${providerType}" instead`,
    );
  }

  it('does not hit the RPC endpoint more than once for identical requests', async () => {
    const requests = [{ method }, { method }];
    const mockResults = ['first result', 'second result'];

    await withMockedCommunications({ providerType }, async (comms) => {
      // The first time a block-cacheable request is made, the latest block
      // number is retrieved through the block tracker first. It doesn't
      // matter what this is — it's just used as a cache key.
      comms.mockNextBlockTrackerRequest();
      comms.mockRpcCall({
        request: requests[0],
        response: { result: mockResults[0] },
      });

      const results = await withNetworkClient(
        { providerType },
        ({ makeRpcCallsInSeries }) => makeRpcCallsInSeries(requests),
      );

      expect(results).toStrictEqual([mockResults[0], mockResults[0]]);
    });
  });

  for (const paramIndex of [...Array(numberOfParameters).keys()]) {
    it(`does not reuse the result of a previous request if parameter at index "${paramIndex}" differs`, async () => {
      const firstMockParams = [
        ...new Array(numberOfParameters).fill('some value'),
      ];
      const secondMockParams = firstMockParams.slice();
      secondMockParams[paramIndex] = 'another value';
      const requests = [
        {
          method,
          params: firstMockParams,
        },
        { method, params: secondMockParams },
      ];
      const mockResults = ['some result', 'another result'];

      await withMockedCommunications({ providerType }, async (comms) => {
        // The first time a block-cacheable request is made, the latest block
        // number is retrieved through the block tracker first. It doesn't
        // matter what this is — it's just used as a cache key.
        comms.mockNextBlockTrackerRequest();
        comms.mockRpcCall({
          request: requests[0],
          response: { result: mockResults[0] },
        });
        comms.mockRpcCall({
          request: requests[1],
          response: { result: mockResults[1] },
        });

        const results = await withNetworkClient(
          { providerType },
          ({ makeRpcCallsInSeries }) => makeRpcCallsInSeries(requests),
        );

        expect(results).toStrictEqual([mockResults[0], mockResults[1]]);
      });
    });
  }

  it('hits the RPC endpoint and does not reuse the result of a previous request if the latest block number was updated since', async () => {
    const requests = [{ method }, { method }];
    const mockResults = ['first result', 'second result'];

    await withMockedCommunications({ providerType }, async (comms) => {
      // Note that we have to mock these requests in a specific order. The
      // first block tracker request occurs because of the first RPC request.
      // The second block tracker request, however, does not occur because of
      // the second RPC request, but rather because we call `clock.runAll()`
      // below.
      comms.mockNextBlockTrackerRequest({ blockNumber: '0x1' });
      comms.mockRpcCall({
        request: requests[0],
        response: { result: mockResults[0] },
      });
      comms.mockNextBlockTrackerRequest({ blockNumber: '0x2' });
      comms.mockRpcCall({
        request: requests[1],
        response: { result: mockResults[1] },
      });

      const results = await withNetworkClient(
        { providerType },
        async (client) => {
          const firstResult = await client.makeRpcCall(requests[0]);
          // Proceed to the next iteration of the block tracker so that a new
          // block is fetched and the current block is updated.
          client.clock.runAll();
          const secondResult = await client.makeRpcCall(requests[1]);
          return [firstResult, secondResult];
        },
      );

      expect(results).toStrictEqual(mockResults);
    });
  });

  it.each([null, undefined, '\u003cnil\u003e'])(
    'does not reuse the result of a previous request if it was `%s`',
    async (emptyValue) => {
      const requests = [{ method }, { method }];
      const mockResults = [emptyValue, 'some result'];

      await withMockedCommunications({ providerType }, async (comms) => {
        // The first time a block-cacheable request is made, the latest block
        // number is retrieved through the block tracker first. It doesn't
        // matter what this is — it's just used as a cache key.
        comms.mockNextBlockTrackerRequest();
        comms.mockRpcCall({
          request: requests[0],
          response: { result: mockResults[0] },
        });
        comms.mockRpcCall({
          request: requests[1],
          response: { result: mockResults[1] },
        });

        const results = await withNetworkClient(
          { providerType },
          ({ makeRpcCallsInSeries }) => makeRpcCallsInSeries(requests),
        );

        expect(results).toStrictEqual(mockResults);
      });
    },
  );

  it('queues requests while a previous identical call is still pending, then runs the queue when it finishes, reusing the result from the first request', async () => {
    const requests = [{ method }, { method }, { method }];
    const mockResults = ['first result', 'second result', 'third result'];

    await withMockedCommunications({ providerType }, async (comms) => {
      // The first time a block-cacheable request is made, the latest block
      // number is retrieved through the block tracker first. It doesn't
      // matter what this is — it's just used as a cache key.
      comms.mockNextBlockTrackerRequest();
      comms.mockRpcCall({
        request: requests[0],
        response: { result: mockResults[0] },
        delay: 100,
      });
      comms.mockRpcCall({
        request: requests[1],
        response: { result: mockResults[1] },
      });
      comms.mockRpcCall({
        request: requests[2],
        response: { result: mockResults[2] },
      });

      const results = await withNetworkClient(
        { providerType },
        async (client) => {
          const resultPromises = [
            client.makeRpcCall(requests[0]),
            client.makeRpcCall(requests[1]),
            client.makeRpcCall(requests[2]),
          ];
          const firstResult = await resultPromises[0];
          // The inflight cache middleware uses setTimeout to run the handlers,
          // so run them now
          client.clock.runAll();
          const remainingResults = await Promise.all(resultPromises.slice(1));
          return [firstResult, ...remainingResults];
        },
      );

      expect(results).toStrictEqual([
        mockResults[0],
        mockResults[0],
        mockResults[0],
      ]);
    });
  });

  it('throws a custom error if the request to the RPC endpoint returns a 405 response', async () => {
    await withMockedCommunications({ providerType }, async (comms) => {
      const request = { method };

      // The first time a block-cacheable request is made, the latest block
      // number is retrieved through the block tracker first. It doesn't
      // matter what this is — it's just used as a cache key.
      comms.mockNextBlockTrackerRequest();
      comms.mockRpcCall({
        request,
        response: {
          httpStatus: 405,
        },
      });
      const promiseForResult = withNetworkClient(
        { providerType },
        async ({ makeRpcCall }) => makeRpcCall(request),
      );

      await expect(promiseForResult).rejects.toThrow(
        'The method does not exist / is not available',
      );
    });
  });

  // There is a difference in how we are testing the Infura middleware vs. the
  // custom RPC middleware (or, more specifically, the fetch middleware) because
  // of what both middleware treat as rate limiting errors. In this case, the
  // fetch middleware treats a 418 response from the RPC endpoint as such an
  // error, whereas to the Infura middleware, it is a 429 response.
  if (providerType === 'infura') {
    it('throws an undescriptive error if the request to the RPC endpoint returns a 418 response', async () => {
      await withMockedCommunications({ providerType }, async (comms) => {
        const request = { method };

        // The first time a block-cacheable request is made, the latest block
        // number is retrieved through the block tracker first. It doesn't
        // matter what this is — it's just used as a cache key.
        comms.mockNextBlockTrackerRequest();
        comms.mockRpcCall({
          request,
          response: {
            httpStatus: 418,
          },
        });
        const promiseForResult = withNetworkClient(
          { providerType },
          async ({ makeRpcCall }) => makeRpcCall(request),
        );

        await expect(promiseForResult).rejects.toThrow(
          '{"id":1,"jsonrpc":"2.0"}',
        );
      });
    });

    it('throws an error with a custom message if the request to the RPC endpoint returns a 429 response', async () => {
      await withMockedCommunications({ providerType }, async (comms) => {
        const request = { method };

        // The first time a block-cacheable request is made, the latest block
        // number is retrieved through the block tracker first. It doesn't
        // matter what this is — it's just used as a cache key.
        comms.mockNextBlockTrackerRequest();
        comms.mockRpcCall({
          request,
          response: {
            httpStatus: 429,
          },
        });
        const promiseForResult = withNetworkClient(
          { providerType },
          async ({ makeRpcCall }) => makeRpcCall(request),
        );

        await expect(promiseForResult).rejects.toThrow(
          'Request is being rate limited',
        );
      });
    });
  } else {
    it('throws a custom error if the request to the RPC endpoint returns a 418 response', async () => {
      await withMockedCommunications({ providerType }, async (comms) => {
        const request = { method };

        // The first time a block-cacheable request is made, the latest block
        // number is retrieved through the block tracker first. It doesn't
        // matter what this is — it's just used as a cache key.
        comms.mockNextBlockTrackerRequest();
        comms.mockRpcCall({
          request,
          response: {
            httpStatus: 418,
          },
        });
        const promiseForResult = withNetworkClient(
          { providerType },
          async ({ makeRpcCall }) => makeRpcCall(request),
        );

        await expect(promiseForResult).rejects.toThrow(
          'Request is being rate limited.',
        );
      });
    });

    it('throws an undescriptive error if the request to the RPC endpoint returns a 429 response', async () => {
      await withMockedCommunications({ providerType }, async (comms) => {
        const request = { method };

        // The first time a block-cacheable request is made, the latest block
        // number is retrieved through the block tracker first. It doesn't
        // matter what this is — it's just used as a cache key.
        comms.mockNextBlockTrackerRequest();
        comms.mockRpcCall({
          request,
          response: {
            httpStatus: 429,
          },
        });
        const promiseForResult = withNetworkClient(
          { providerType },
          async ({ makeRpcCall }) => makeRpcCall(request),
        );

        await expect(promiseForResult).rejects.toThrow(
          "Non-200 status code: '429'",
        );
      });
    });
  }

  it('throws a generic, undescriptive error if the request to the RPC endpoint returns a response that is not 405, 418, 429, 503, or 504', async () => {
    await withMockedCommunications({ providerType }, async (comms) => {
      const request = { method };

      // The first time a block-cacheable request is made, the latest block
      // number is retrieved through the block tracker first. It doesn't
      // matter what this is — it's just used as a cache key.
      comms.mockNextBlockTrackerRequest();
      comms.mockRpcCall({
        request,
        response: {
          id: 12345,
          jsonrpc: '2.0',
          error: 'some error',
          httpStatus: 420,
        },
      });
      const promiseForResult = withNetworkClient(
        { providerType },
        async ({ makeRpcCall }) => makeRpcCall(request),
      );

      const errorMessage =
        providerType === 'infura'
          ? '{"id":12345,"jsonrpc":"2.0","error":"some error"}'
          : "Non-200 status code: '420'";
      await expect(promiseForResult).rejects.toThrow(errorMessage);
    });
  });

  [503, 504].forEach((httpStatus) => {
    it(`retries the request to the RPC endpoint up to 5 times if it returns a ${httpStatus} response, returning the successful result if there is one on the 5th try`, async () => {
      await withMockedCommunications({ providerType }, async (comms) => {
        const request = { method };

        // The first time a block-cacheable request is made, the latest block
        // number is retrieved through the block tracker first. It doesn't
        // matter what this is — it's just used as a cache key.
        comms.mockNextBlockTrackerRequest();
        // Here we have the request fail for the first 4 tries, then succeed
        // on the 5th try.
        comms.mockRpcCall({
          request,
          response: {
            error: 'Some error',
            httpStatus,
          },
          times: 4,
        });
        comms.mockRpcCall({
          request,
          response: {
            result: 'the result',
            httpStatus: 200,
          },
        });
        const result = await withNetworkClient(
          { providerType },
          async ({ makeRpcCall, clock }) => {
            return await waitForPromiseToBeFulfilledAfterRunningAllTimers(
              makeRpcCall(request),
              clock,
            );
          },
        );

        expect(result).toStrictEqual('the result');
      });
    });

    it(`causes a request to fail with a custom error if the request to the RPC endpoint returns a ${httpStatus} response 5 times in a row`, async () => {
      await withMockedCommunications({ providerType }, async (comms) => {
        const request = { method };

        // The first time a block-cacheable request is made, the latest block
        // number is retrieved through the block tracker first. It doesn't
        // matter what this is — it's just used as a cache key.
        comms.mockNextBlockTrackerRequest();
        comms.mockRpcCall({
          request,
          response: {
            error: 'Some error',
            httpStatus,
          },
          times: 5,
        });
        comms.mockNextBlockTrackerRequest();
        const promiseForResult = withNetworkClient(
          { providerType },
          async ({ makeRpcCall, clock }) => {
            return await waitForPromiseToBeFulfilledAfterRunningAllTimers(
              makeRpcCall(request),
              clock,
            );
          },
        );
        const err =
          providerType === 'infura'
            ? buildInfuraClientRetriesExhaustedErrorMessage('Gateway timeout')
            : buildJsonRpcEngineEmptyResponseErrorMessage(method);
        await expect(promiseForResult).rejects.toThrow(err);
      });
    });
  });

  it('retries the request to the RPC endpoint up to 5 times if an "ETIMEDOUT" error is thrown while making the request, returning the successful result if there is one on the 5th try', async () => {
    await withMockedCommunications({ providerType }, async (comms) => {
      const request = { method };

      // The first time a block-cacheable request is made, the latest block
      // number is retrieved through the block tracker first. It doesn't
      // matter what this is — it's just used as a cache key.
      comms.mockNextBlockTrackerRequest();
      // Here we have the request fail for the first 4 tries, then succeed
      // on the 5th try.
      comms.mockRpcCall({
        request,
        error: 'ETIMEDOUT: Some message',
        times: 4,
      });
      comms.mockRpcCall({
        request,
        response: {
          result: 'the result',
          httpStatus: 200,
        },
      });

      const result = await withNetworkClient(
        { providerType },
        async ({ makeRpcCall, clock }) => {
          return await waitForPromiseToBeFulfilledAfterRunningAllTimers(
            makeRpcCall(request),
            clock,
          );
        },
      );

      expect(result).toStrictEqual('the result');
    });
  });

  // Both the Infura and fetch middleware detect ETIMEDOUT errors and will
  // automatically retry the request to the RPC endpoint in question, but both
  // produce a different error if the number of retries is exhausted.
  if (providerType === 'infura') {
    it('causes a request to fail with a custom error if an "ETIMEDOUT" error is thrown while making the request to the RPC endpoint 5 times in a row', async () => {
      await withMockedCommunications({ providerType }, async (comms) => {
        const request = { method };
        const errorMessage = 'ETIMEDOUT: Some message';

        // The first time a block-cacheable request is made, the latest block
        // number is retrieved through the block tracker first. It doesn't
        // matter what this is — it's just used as a cache key.
        comms.mockNextBlockTrackerRequest();
        comms.mockRpcCall({
          request,
          error: errorMessage,
          times: 5,
        });
        const promiseForResult = withNetworkClient(
          { providerType },
          async ({ makeRpcCall, clock }) => {
            return await waitForPromiseToBeFulfilledAfterRunningAllTimers(
              makeRpcCall(request),
              clock,
            );
          },
        );

        await expect(promiseForResult).rejects.toThrow(
          buildInfuraClientRetriesExhaustedErrorMessage(errorMessage),
        );
      });
    });
  } else {
    it('returns an empty response if an "ETIMEDOUT" error is thrown while making the request to the RPC endpoint 5 times in a row', async () => {
      await withMockedCommunications({ providerType }, async (comms) => {
        const request = { method };
        const errorMessage = 'ETIMEDOUT: Some message';

        // The first time a block-cacheable request is made, the latest block
        // number is retrieved through the block tracker first. It doesn't
        // matter what this is — it's just used as a cache key.
        comms.mockNextBlockTrackerRequest();
        comms.mockRpcCall({
          request,
          error: errorMessage,
          times: 5,
        });
        const promiseForResult = withNetworkClient(
          { providerType },
          async ({ makeRpcCall, clock }) => {
            return await waitForPromiseToBeFulfilledAfterRunningAllTimers(
              makeRpcCall(request),
              clock,
            );
          },
        );

        await expect(promiseForResult).rejects.toThrow(
          buildJsonRpcEngineEmptyResponseErrorMessage(method),
        );
      });
    });
  }

  // The Infura middleware treats a response that contains an ECONNRESET message
  // as an innocuous error that is likely to disappear on a retry. The custom
  // RPC middleware, on the other hand, does not specially handle this error.
  if (providerType === 'infura') {
    it('retries the request to the RPC endpoint up to 5 times if an "ECONNRESET" error is thrown while making the request, returning the successful result if there is one on the 5th try', async () => {
      await withMockedCommunications({ providerType }, async (comms) => {
        const request = { method };

        // The first time a block-cacheable request is made, the latest block
        // number is retrieved through the block tracker first. It doesn't
        // matter what this is — it's just used as a cache key.
        comms.mockNextBlockTrackerRequest();
        // Here we have the request fail for the first 4 tries, then succeed
        // on the 5th try.
        comms.mockRpcCall({
          request,
          error: 'ECONNRESET: Some message',
          times: 4,
        });
        comms.mockRpcCall({
          request,
          response: {
            result: 'the result',
            httpStatus: 200,
          },
        });

        const result = await withNetworkClient(
          { providerType },
          async ({ makeRpcCall, clock }) => {
            return await waitForPromiseToBeFulfilledAfterRunningAllTimers(
              makeRpcCall(request),
              clock,
            );
          },
        );

        expect(result).toStrictEqual('the result');
      });
    });

    it('causes a request to fail with a custom error if an "ECONNRESET" error is thrown while making the request to the RPC endpoint 5 times in a row', async () => {
      await withMockedCommunications({ providerType }, async (comms) => {
        const request = { method };
        const errorMessage = 'ECONNRESET: Some message';

        // The first time a block-cacheable request is made, the latest block
        // number is retrieved through the block tracker first. It doesn't
        // matter what this is — it's just used as a cache key.
        comms.mockNextBlockTrackerRequest();
        comms.mockRpcCall({
          request,
          error: errorMessage,
          times: 5,
        });
        const promiseForResult = withNetworkClient(
          { providerType },
          async ({ makeRpcCall, clock }) => {
            return await waitForPromiseToBeFulfilledAfterRunningAllTimers(
              makeRpcCall(request),
              clock,
            );
          },
        );

        await expect(promiseForResult).rejects.toThrow(
          buildInfuraClientRetriesExhaustedErrorMessage(errorMessage),
        );
      });
    });
  } else {
    it('does not retry the request to the RPC endpoint, but throws immediately, if an "ECONNRESET" error is thrown while making the request', async () => {
      const customRpcUrl = 'http://example.com';

      await withMockedCommunications(
        { providerType, customRpcUrl },
        async (comms) => {
          const request = { method };
          const errorMessage = 'ECONNRESET: Some message';

          // The first time a block-cacheable request is made, the latest block
          // number is retrieved through the block tracker first. It doesn't
          // matter what this is — it's just used as a cache key.
          comms.mockNextBlockTrackerRequest();
          comms.mockRpcCall({
            request,
            error: errorMessage,
          });
          const promiseForResult = withNetworkClient(
            { providerType, customRpcUrl },
            async ({ makeRpcCall }) => makeRpcCall(request),
          );

          await expect(promiseForResult).rejects.toThrow(
            buildFetchFailedErrorMessage(customRpcUrl, errorMessage),
          );
        },
      );
    });
  }

  // Both the Infura and fetch middleware will attempt to parse the response
  // body as JSON, and if this step produces an error, both middleware will also
  // attempt to retry the request. However, this error handling code is slightly
  // different between the two. As the error in this case is a SyntaxError, the
  // Infura middleware will catch it immediately, whereas the custom RPC
  // middleware will catch it and re-throw a separate error, which it then
  // catches later.
  if (providerType === 'infura') {
    it('retries the request to the RPC endpoint up to 5 times if an "SyntaxError" error is thrown while making the request, returning the successful result if there is one on the 5th try', async () => {
      await withMockedCommunications({ providerType }, async (comms) => {
        const request = { method };

        // The first time a block-cacheable request is made, the latest block
        // number is retrieved through the block tracker first. It doesn't
        // matter what this is — it's just used as a cache key.
        comms.mockNextBlockTrackerRequest();
        // Here we have the request fail for the first 4 tries, then succeed
        // on the 5th try.
        comms.mockRpcCall({
          request,
          error: 'SyntaxError: Some message',
          times: 4,
        });
        comms.mockRpcCall({
          request,
          response: {
            result: 'the result',
            httpStatus: 200,
          },
        });

        const result = await withNetworkClient(
          { providerType },
          async ({ makeRpcCall, clock }) => {
            return await waitForPromiseToBeFulfilledAfterRunningAllTimers(
              makeRpcCall(request),
              clock,
            );
          },
        );

        expect(result).toStrictEqual('the result');
      });
    });

    it('causes a request to fail with a custom error if an "SyntaxError" error is thrown while making the request to the RPC endpoint 5 times in a row', async () => {
      await withMockedCommunications({ providerType }, async (comms) => {
        const request = { method };
        const errorMessage = 'SyntaxError: Some message';

        // The first time a block-cacheable request is made, the latest block
        // number is retrieved through the block tracker first. It doesn't
        // matter what this is — it's just used as a cache key.
        comms.mockNextBlockTrackerRequest();
        comms.mockRpcCall({
          request,
          error: errorMessage,
          times: 5,
        });
        const promiseForResult = withNetworkClient(
          { providerType },
          async ({ makeRpcCall, clock }) => {
            return await waitForPromiseToBeFulfilledAfterRunningAllTimers(
              makeRpcCall(request),
              clock,
            );
          },
        );

        await expect(promiseForResult).rejects.toThrow(
          buildInfuraClientRetriesExhaustedErrorMessage(errorMessage),
        );
      });
    });

    it('does not retry the request to the RPC endpoint, but throws immediately, if a "failed to parse response body" error is thrown while making the request', async () => {
      await withMockedCommunications({ providerType }, async (comms) => {
        const request = { method };
        const errorMessage = 'failed to parse response body: some message';

        // The first time a block-cacheable request is made, the latest block
        // number is retrieved through the block tracker first. It doesn't
        // matter what this is — it's just used as a cache key.
        comms.mockNextBlockTrackerRequest();
        comms.mockRpcCall({
          request,
          error: errorMessage,
        });
        const promiseForResult = withNetworkClient(
          { providerType, infuraNetwork: comms.infuraNetwork },
          async ({ makeRpcCall }) => makeRpcCall(request),
        );

        await expect(promiseForResult).rejects.toThrow(
          buildFetchFailedErrorMessage(comms.rpcUrl, errorMessage),
        );
      });
    });
  } else {
    it('does not retry the request to the RPC endpoint, but throws immediately, if a "SyntaxError" error is thrown while making the request', async () => {
      const customRpcUrl = 'http://example.com';

      await withMockedCommunications(
        { providerType, customRpcUrl },
        async (comms) => {
          const request = { method };
          const errorMessage = 'SyntaxError: Some message';

          // The first time a block-cacheable request is made, the latest block
          // number is retrieved through the block tracker first. It doesn't
          // matter what this is — it's just used as a cache key.
          comms.mockNextBlockTrackerRequest();
          comms.mockRpcCall({
            request,
            error: errorMessage,
          });
          const promiseForResult = withNetworkClient(
            { providerType, customRpcUrl },
            async ({ makeRpcCall }) => makeRpcCall(request),
          );

          await expect(promiseForResult).rejects.toThrow(
            buildFetchFailedErrorMessage(customRpcUrl, errorMessage),
          );
        },
      );
    });

    it('retries the request to the RPC endpoint up to 5 times if a "failed to parse response body" error is thrown while making the request, returning the successful result if there is one on the 5th try', async () => {
      await withMockedCommunications({ providerType }, async (comms) => {
        const request = { method };

        // The first time a block-cacheable request is made, the latest block
        // number is retrieved through the block tracker first. It doesn't
        // matter what this is — it's just used as a cache key.
        comms.mockNextBlockTrackerRequest();
        // Here we have the request fail for the first 4 tries, then succeed
        // on the 5th try.
        comms.mockRpcCall({
          request,
          error: 'failed to parse response body: some message',
          times: 4,
        });
        comms.mockRpcCall({
          request,
          response: {
            result: 'the result',
            httpStatus: 200,
          },
        });

        const result = await withNetworkClient(
          { providerType },
          async ({ makeRpcCall, clock }) => {
            return await waitForPromiseToBeFulfilledAfterRunningAllTimers(
              makeRpcCall(request),
              clock,
            );
          },
        );

        expect(result).toStrictEqual('the result');
      });
    });

    it('returns an empty response if a "failed to parse response body" error is thrown while making the request to the RPC endpoint 5 times in a row', async () => {
      await withMockedCommunications({ providerType }, async (comms) => {
        const request = { method };
        const errorMessage = 'failed to parse response body: some message';

        // The first time a block-cacheable request is made, the latest block
        // number is retrieved through the block tracker first. It doesn't
        // matter what this is — it's just used as a cache key.
        comms.mockNextBlockTrackerRequest();
        comms.mockRpcCall({
          request,
          error: errorMessage,
          times: 5,
        });
        const promiseForResult = withNetworkClient(
          { providerType },
          async ({ makeRpcCall, clock }) => {
            return await waitForPromiseToBeFulfilledAfterRunningAllTimers(
              makeRpcCall(request),
              clock,
            );
          },
        );

        await expect(promiseForResult).rejects.toThrow(
          buildJsonRpcEngineEmptyResponseErrorMessage(method),
        );
      });
    });
  }

  // Only the custom RPC middleware will detect a "Failed to fetch" error and
  // attempt to retry the request to the RPC endpoint; the Infura middleware
  // does not.
  if (providerType === 'infura') {
    it('does not retry the request to the RPC endpoint, but throws immediately, if a "Failed to fetch" error is thrown while making the request', async () => {
      await withMockedCommunications({ providerType }, async (comms) => {
        const request = { method };
        const errorMessage = 'Failed to fetch: some message';

        // The first time a block-cacheable request is made, the latest block
        // number is retrieved through the block tracker first. It doesn't
        // matter what this is — it's just used as a cache key.
        comms.mockNextBlockTrackerRequest();
        comms.mockRpcCall({
          request,
          error: errorMessage,
        });
        const promiseForResult = withNetworkClient(
          { providerType, infuraNetwork: comms.infuraNetwork },
          async ({ makeRpcCall }) => makeRpcCall(request),
        );

        await expect(promiseForResult).rejects.toThrow(
          buildFetchFailedErrorMessage(comms.rpcUrl, errorMessage),
        );
      });
    });
  } else {
    it('retries the request to the RPC endpoint up to 5 times if a "Failed to fetch" error is thrown while making the request, returning the successful result if there is one on the 5th try', async () => {
      await withMockedCommunications({ providerType }, async (comms) => {
        const request = { method };

        // The first time a block-cacheable request is made, the latest block
        // number is retrieved through the block tracker first. It doesn't
        // matter what this is — it's just used as a cache key.
        comms.mockNextBlockTrackerRequest();
        // Here we have the request fail for the first 4 tries, then succeed
        // on the 5th try.
        comms.mockRpcCall({
          request,
          error: 'Failed to fetch: some message',
          times: 4,
        });
        comms.mockRpcCall({
          request,
          response: {
            result: 'the result',
            httpStatus: 200,
          },
        });

        const result = await withNetworkClient(
          { providerType },
          async ({ makeRpcCall, clock }) => {
            return await waitForPromiseToBeFulfilledAfterRunningAllTimers(
              makeRpcCall(request),
              clock,
            );
          },
        );

        expect(result).toStrictEqual('the result');
      });
    });

    it('returns an empty response if a "Failed to fetch" error is thrown while making the request to the RPC endpoint 5 times in a row', async () => {
      await withMockedCommunications({ providerType }, async (comms) => {
        const request = { method };
        const errorMessage = 'Failed to fetch: some message';

        // The first time a block-cacheable request is made, the latest block
        // number is retrieved through the block tracker first. It doesn't
        // matter what this is — it's just used as a cache key.
        comms.mockNextBlockTrackerRequest();
        comms.mockRpcCall({
          request,
          error: errorMessage,
          times: 5,
        });
        const promiseForResult = withNetworkClient(
          { providerType },
          async ({ makeRpcCall, clock }) => {
            return await waitForPromiseToBeFulfilledAfterRunningAllTimers(
              makeRpcCall(request),
              clock,
            );
          },
        );

        await expect(promiseForResult).rejects.toThrow(
          buildJsonRpcEngineEmptyResponseErrorMessage(method),
        );
      });
    });
  }
}

/**
 * Defines tests which exercise the behavior exhibited by an RPC method that
 * use `blockHash` in the response data to determine whether the response is
 * cacheable.
 *
 * @param method - The name of the RPC method under test.
 * @param additionalArgs - Additional arguments.
 * @param additionalArgs.numberOfParameters - The number of parameters supported by the method under test.
 * @param additionalArgs.providerType - The type of provider being tested;
 * either `infura` or `custom` (default: "infura").
 */
export function testsForRpcMethodsThatCheckForBlockHashInResponse(
  method,
  { numberOfParameters, providerType },
) {
  if (providerType !== 'infura' && providerType !== 'custom') {
    throw new Error(
      `providerType must be either "infura" or "custom", was "${providerType}" instead`,
    );
  }

  it('does not hit the RPC endpoint more than once for identical requests and it has a valid blockHash', async () => {
    const requests = [{ method }, { method }];
    const mockResult = { blockHash: '0x100' };

    await withMockedCommunications({ providerType }, async (comms) => {
      // The first time a block-cacheable request is made, the latest block
      // number is retrieved through the block tracker first. It doesn't
      // matter what this is — it's just used as a cache key.
      comms.mockNextBlockTrackerRequest();
      comms.mockRpcCall({
        request: requests[0],
        response: { result: mockResult },
      });

      const results = await withNetworkClient(
        { providerType },
        ({ makeRpcCallsInSeries }) => makeRpcCallsInSeries(requests),
      );

      expect(results).toStrictEqual([mockResult, mockResult]);
    });
  });

  for (const paramIndex of [...Array(numberOfParameters).keys()]) {
    it(`does not reuse the result of a previous request with a valid blockHash if parameter at index "${paramIndex}" differs`, async () => {
      const firstMockParams = [
        ...new Array(numberOfParameters).fill('some value'),
      ];
      const secondMockParams = firstMockParams.slice();
      secondMockParams[paramIndex] = 'another value';
      const requests = [
        {
          method,
          params: firstMockParams,
        },
        { method, params: secondMockParams },
      ];
      const mockResults = [{ blockHash: '0x100' }, { blockHash: '0x200' }];

      await withMockedCommunications({ providerType }, async (comms) => {
        // The first time a block-cacheable request is made, the latest block
        // number is retrieved through the block tracker first. It doesn't
        // matter what this is — it's just used as a cache key.
        comms.mockNextBlockTrackerRequest();
        comms.mockRpcCall({
          request: requests[0],
          response: { result: mockResults[0] },
        });
        comms.mockRpcCall({
          request: requests[1],
          response: { result: mockResults[1] },
        });

        const results = await withNetworkClient(
          { providerType },
          ({ makeRpcCallsInSeries }) => makeRpcCallsInSeries(requests),
        );

        expect(results).toStrictEqual([mockResults[0], mockResults[1]]);
      });
    });
  }

  it('hits the RPC endpoint and does not reuse the result of a previous request if the latest block number was updated since', async () => {
    const requests = [{ method }, { method }];
    const mockResults = [{ blockHash: '0x100' }, { blockHash: '0x200' }];

    await withMockedCommunications({ providerType }, async (comms) => {
      // Note that we have to mock these requests in a specific order. The
      // first block tracker request occurs because of the first RPC
      // request. The second block tracker request, however, does not occur
      // because of the second RPC request, but rather because we call
      // `clock.runAll()` below.
      comms.mockNextBlockTrackerRequest({ blockNumber: '0x1' });
      comms.mockRpcCall({
        request: requests[0],
        response: { result: mockResults[0] },
      });
      comms.mockNextBlockTrackerRequest({ blockNumber: '0x2' });
      comms.mockRpcCall({
        request: requests[1],
        response: { result: mockResults[1] },
      });

      const results = await withNetworkClient(
        { providerType },
        async (client) => {
          const firstResult = await client.makeRpcCall(requests[0]);
          // Proceed to the next iteration of the block tracker so that a new
          // block is fetched and the current block is updated.
          client.clock.runAll();
          const secondResult = await client.makeRpcCall(requests[1]);
          return [firstResult, secondResult];
        },
      );

      expect(results).toStrictEqual(mockResults);
    });
  });

  it.each([null, undefined, '\u003cnil\u003e'])(
    'does not reuse the result of a previous request if it was `%s`',
    async (emptyValue) => {
      const requests = [{ method }, { method }];
      const mockResults = [emptyValue, { blockHash: '0x100' }];

      await withMockedCommunications({ providerType }, async (comms) => {
        // The first time a block-cacheable request is made, the latest block
        // number is retrieved through the block tracker first. It doesn't
        // matter what this is — it's just used as a cache key.
        comms.mockNextBlockTrackerRequest();
        comms.mockRpcCall({
          request: requests[0],
          response: { result: mockResults[0] },
        });
        comms.mockRpcCall({
          request: requests[1],
          response: { result: mockResults[1] },
        });

        const results = await withNetworkClient(
          { providerType },
          ({ makeRpcCallsInSeries }) => makeRpcCallsInSeries(requests),
        );

        expect(results).toStrictEqual(mockResults);
      });
    },
  );

  it('does not reuse the result of a previous request if result.blockHash was null', async () => {
    const requests = [{ method }, { method }];
    const mockResults = [
      { blockHash: null, extra: 'some value' },
      { blockHash: '0x100', extra: 'some other value' },
    ];

    await withMockedCommunications({ providerType }, async (comms) => {
      // The first time a block-cacheable request is made, the latest block
      // number is retrieved through the block tracker first. It doesn't
      // matter what this is — it's just used as a cache key.
      comms.mockNextBlockTrackerRequest();
      comms.mockRpcCall({
        request: requests[0],
        response: { result: mockResults[0] },
      });
      comms.mockRpcCall({
        request: requests[1],
        response: { result: mockResults[1] },
      });

      const results = await withNetworkClient(
        { providerType },
        ({ makeRpcCallsInSeries }) => makeRpcCallsInSeries(requests),
      );

      expect(results).toStrictEqual(mockResults);
    });
  });

  it('does not reuse the result of a previous request if result.blockHash was undefined', async () => {
    const requests = [{ method }, { method }];
    const mockResults = [
      { extra: 'some value' },
      { blockHash: '0x100', extra: 'some other value' },
    ];

    await withMockedCommunications({ providerType }, async (comms) => {
      // The first time a block-cacheable request is made, the latest block
      // number is retrieved through the block tracker first. It doesn't
      // matter what this is — it's just used as a cache key.
      comms.mockNextBlockTrackerRequest();
      comms.mockRpcCall({
        request: requests[0],
        response: { result: mockResults[0] },
      });
      comms.mockRpcCall({
        request: requests[1],
        response: { result: mockResults[1] },
      });

      const results = await withNetworkClient(
        { providerType },
        ({ makeRpcCallsInSeries }) => makeRpcCallsInSeries(requests),
      );

      expect(results).toStrictEqual(mockResults);
    });
  });

  it('does not reuse the result of a previous request if result.blockHash was "0x0000000000000000000000000000000000000000000000000000000000000000"', async () => {
    const requests = [{ method }, { method }];
    const mockResults = [
      {
        blockHash:
          '0x0000000000000000000000000000000000000000000000000000000000000000',
        extra: 'some value',
      },
      { blockHash: '0x100', extra: 'some other value' },
    ];

    await withMockedCommunications({ providerType }, async (comms) => {
      // The first time a block-cacheable request is made, the latest block
      // number is retrieved through the block tracker first. It doesn't
      // matter what this is — it's just used as a cache key.
      comms.mockNextBlockTrackerRequest();
      comms.mockRpcCall({
        request: requests[0],
        response: { result: mockResults[0] },
      });
      comms.mockRpcCall({
        request: requests[1],
        response: { result: mockResults[1] },
      });

      const results = await withNetworkClient(
        { providerType },
        ({ makeRpcCallsInSeries }) => makeRpcCallsInSeries(requests),
      );

      expect(results).toStrictEqual(mockResults);
    });
  });
}

/**
 * Defines tests which exercise the behavior exhibited by an RPC method that
 * takes a block parameter. The value of this parameter can be either a block
 * number or a block tag ("latest", "earliest", or "pending") and affects how
 * the method is cached.
 *
 * @param method - The name of the RPC method under test.
 * @param additionalArgs - Additional arguments.
 * @param additionalArgs.blockParamIndex - The index of the block parameter.
 * @param additionalArgs.numberOfParameters - The number of parameters supported by the method under test.
 * @param additionalArgs.providerType - The type of provider being tested.
 * either `infura` or `custom` (default: "infura").
 */
/* eslint-disable-next-line jest/no-export */
export function testsForRpcMethodSupportingBlockParam(
  method,
  { blockParamIndex, numberOfParameters, providerType },
) {
  describe.each([
    ['given no block tag', undefined],
    ['given a block tag of "latest"', 'latest'],
  ])('%s', (_desc, blockParam) => {
    it('does not hit the RPC endpoint more than once for identical requests', async () => {
      const requests = [
        {
          method,
          params: buildMockParams({ blockParamIndex, blockParam }),
        },
        { method, params: buildMockParams({ blockParamIndex, blockParam }) },
      ];
      const mockResults = ['first result', 'second result'];

      await withMockedCommunications({ providerType }, async (comms) => {
        // The first time a block-cacheable request is made, the block-cache
        // middleware will request the latest block number through the block
        // tracker to determine the cache key. Later, the block-ref
        // middleware will request the latest block number again to resolve
        // the value of "latest", but the block number is cached once made,
        // so we only need to mock the request once.
        comms.mockNextBlockTrackerRequest({ blockNumber: '0x100' });
        // The block-ref middleware will make the request as specified
        // except that the block param is replaced with the latest block
        // number.
        comms.mockRpcCall({
          request: buildRequestWithReplacedBlockParam(
            requests[0],
            blockParamIndex,
            '0x100',
          ),
          response: { result: mockResults[0] },
        });

        const results = await withNetworkClient(
          { providerType },
          ({ makeRpcCallsInSeries }) => makeRpcCallsInSeries(requests),
        );

        expect(results).toStrictEqual([mockResults[0], mockResults[0]]);
      });
    });

    for (const paramIndex of [...Array(numberOfParameters).keys()]) {
      if (paramIndex === blockParamIndex) {
        // testing changes in block param is covered under later tests
        continue;
      }
      it(`does not reuse the result of a previous request if parameter at index "${paramIndex}" differs`, async () => {
        const firstMockParams = [
          ...new Array(numberOfParameters).fill('some value'),
        ];
        firstMockParams[blockParamIndex] = blockParam;
        const secondMockParams = firstMockParams.slice();
        secondMockParams[paramIndex] = 'another value';
        const requests = [
          {
            method,
            params: firstMockParams,
          },
          { method, params: secondMockParams },
        ];
        const mockResults = ['first result', 'second result'];

        await withMockedCommunications({ providerType }, async (comms) => {
          // The first time a block-cacheable request is made, the block-cache
          // middleware will request the latest block number through the block
          // tracker to determine the cache key. Later, the block-ref
          // middleware will request the latest block number again to resolve
          // the value of "latest", but the block number is cached once made,
          // so we only need to mock the request once.
          comms.mockNextBlockTrackerRequest({ blockNumber: '0x100' });
          // The block-ref middleware will make the request as specified
          // except that the block param is replaced with the latest block
          // number.
          comms.mockRpcCall({
            request: buildRequestWithReplacedBlockParam(
              requests[0],
              blockParamIndex,
              '0x100',
            ),
            response: { result: mockResults[0] },
          });
          comms.mockRpcCall({
            request: buildRequestWithReplacedBlockParam(
              requests[1],
              blockParamIndex,
              '0x100',
            ),
            response: { result: mockResults[1] },
          });

          const results = await withNetworkClient(
            { providerType },
            ({ makeRpcCallsInSeries }) => makeRpcCallsInSeries(requests),
          );

          expect(results).toStrictEqual([mockResults[0], mockResults[1]]);
        });
      });
    }

    it('hits the RPC endpoint and does not reuse the result of a previous request if the latest block number was updated since', async () => {
      const requests = [
        { method, params: buildMockParams({ blockParamIndex, blockParam }) },
        { method, params: buildMockParams({ blockParamIndex, blockParam }) },
      ];
      const mockResults = ['first result', 'second result'];

      await withMockedCommunications({ providerType }, async (comms) => {
        // Note that we have to mock these requests in a specific order.
        // The first block tracker request occurs because of the first RPC
        // request. The second block tracker request, however, does not
        // occur because of the second RPC request, but rather because we
        // call `clock.runAll()` below.
        comms.mockNextBlockTrackerRequest({ blockNumber: '0x100' });
        // The block-ref middleware will make the request as specified
        // except that the block param is replaced with the latest block
        // number.
        comms.mockRpcCall({
          request: buildRequestWithReplacedBlockParam(
            requests[0],
            blockParamIndex,
            '0x100',
          ),
          response: { result: mockResults[0] },
        });
        comms.mockNextBlockTrackerRequest({ blockNumber: '0x200' });
        comms.mockRpcCall({
          request: buildRequestWithReplacedBlockParam(
            requests[1],
            blockParamIndex,
            '0x200',
          ),
          response: { result: mockResults[1] },
        });

        const results = await withNetworkClient(
          { providerType },
          async (client) => {
            const firstResult = await client.makeRpcCall(requests[0]);
            // Proceed to the next iteration of the block tracker so that a
            // new block is fetched and the current block is updated.
            client.clock.runAll();
            const secondResult = await client.makeRpcCall(requests[1]);
            return [firstResult, secondResult];
          },
        );

        expect(results).toStrictEqual(mockResults);
      });
    });

    it.each([null, undefined, '\u003cnil\u003e'])(
      'does not reuse the result of a previous request if it was `%s`',
      async (emptyValue) => {
        const requests = [
          { method, params: buildMockParams({ blockParamIndex, blockParam }) },
          { method, params: buildMockParams({ blockParamIndex, blockParam }) },
        ];
        const mockResults = [emptyValue, 'some result'];

        await withMockedCommunications({ providerType }, async (comms) => {
          // The first time a block-cacheable request is made, the
          // block-cache middleware will request the latest block number
          // through the block tracker to determine the cache key. Later,
          // the block-ref middleware will request the latest block number
          // again to resolve the value of "latest", but the block number is
          // cached once made, so we only need to mock the request once.
          comms.mockNextBlockTrackerRequest({ blockNumber: '0x100' });
          // The block-ref middleware will make the request as specified
          // except that the block param is replaced with the latest block
          // number.
          comms.mockRpcCall({
            request: buildRequestWithReplacedBlockParam(
              requests[0],
              blockParamIndex,
              '0x100',
            ),
            response: { result: mockResults[0] },
          });
          comms.mockRpcCall({
            request: buildRequestWithReplacedBlockParam(
              requests[1],
              blockParamIndex,
              '0x100',
            ),
            response: { result: mockResults[1] },
          });

          const results = await withNetworkClient(
            { providerType },
            ({ makeRpcCallsInSeries }) => makeRpcCallsInSeries(requests),
          );

          expect(results).toStrictEqual(mockResults);
        });
      },
    );

    it('queues requests while a previous identical call is still pending, then runs the queue when it finishes, reusing the result from the first request', async () => {
      const requests = [{ method }, { method }, { method }];
      const mockResults = ['first result', 'second result', 'third result'];

      await withMockedCommunications({ providerType }, async (comms) => {
        // The first time a block-cacheable request is made, the
        // block-cache middleware will request the latest block number
        // through the block tracker to determine the cache key. Later,
        // the block-ref middleware will request the latest block number
        // again to resolve the value of "latest", but the block number is
        // cached once made, so we only need to mock the request once.
        comms.mockNextBlockTrackerRequest({ blockNumber: '0x100' });
        // The block-ref middleware will make the request as specified
        // except that the block param is replaced with the latest block
        // number, and we delay it.
        comms.mockRpcCall({
          delay: 100,
          request: buildRequestWithReplacedBlockParam(
            requests[0],
            blockParamIndex,
            '0x100',
          ),
          response: { result: mockResults[0] },
        });
        // The previous two requests will happen again, in the same order.
        comms.mockRpcCall({
          request: buildRequestWithReplacedBlockParam(
            requests[1],
            blockParamIndex,
            '0x100',
          ),
          response: { result: mockResults[1] },
        });
        comms.mockRpcCall({
          request: buildRequestWithReplacedBlockParam(
            requests[2],
            blockParamIndex,
            '0x100',
          ),
          response: { result: mockResults[2] },
        });

        const results = await withNetworkClient(
          { providerType },
          async (client) => {
            const resultPromises = [
              client.makeRpcCall(requests[0]),
              client.makeRpcCall(requests[1]),
              client.makeRpcCall(requests[2]),
            ];
            const firstResult = await resultPromises[0];
            // The inflight cache middleware uses setTimeout to run the
            // handlers, so run them now
            client.clock.runAll();
            const remainingResults = await Promise.all(resultPromises.slice(1));
            return [firstResult, ...remainingResults];
          },
        );

        expect(results).toStrictEqual([
          mockResults[0],
          mockResults[0],
          mockResults[0],
        ]);
      });
    });

    it('throws an error with a custom message if the request to the RPC endpoint returns a 405 response', async () => {
      await withMockedCommunications({ providerType }, async (comms) => {
        const request = { method };

        // The first time a block-cacheable request is made, the
        // block-cache middleware will request the latest block number
        // through the block tracker to determine the cache key. Later,
        // the block-ref middleware will request the latest block number
        // again to resolve the value of "latest", but the block number is
        // cached once made, so we only need to mock the request once.
        comms.mockNextBlockTrackerRequest({ blockNumber: '0x100' });
        // The block-ref middleware will make the request as specified
        // except that the block param is replaced with the latest block
        // number.
        comms.mockRpcCall({
          request: buildRequestWithReplacedBlockParam(
            request,
            blockParamIndex,
            '0x100',
          ),
          response: {
            httpStatus: 405,
          },
        });
        const promiseForResult = withNetworkClient(
          { providerType },
          async ({ makeRpcCall }) => makeRpcCall(request),
        );

        await expect(promiseForResult).rejects.toThrow(
          'The method does not exist / is not available',
        );
      });
    });

    // There is a difference in how we are testing the Infura middleware vs. the
    // custom RPC middleware (or, more specifically, the fetch middleware)
    // because of what both middleware treat as rate limiting errors. In this
    // case, the fetch middleware treats a 418 response from the RPC endpoint as
    // such an error, whereas to the Infura middleware, it is a 429 response.
    if (providerType === 'infura') {
      it('throws a generic, undescriptive error if the request to the RPC endpoint returns a 418 response', async () => {
        await withMockedCommunications({ providerType }, async (comms) => {
          const request = { method };

          // The first time a block-cacheable request is made, the
          // block-cache middleware will request the latest block number
          // through the block tracker to determine the cache key. Later,
          // the block-ref middleware will request the latest block number
          // again to resolve the value of "latest", but the block number is
          // cached once made, so we only need to mock the request once.
          comms.mockNextBlockTrackerRequest({ blockNumber: '0x100' });
          // The block-ref middleware will make the request as specified
          // except that the block param is replaced with the latest block
          // number.
          comms.mockRpcCall({
            request: buildRequestWithReplacedBlockParam(
              request,
              blockParamIndex,
              '0x100',
            ),
            response: {
              httpStatus: 418,
            },
          });
          const promiseForResult = withNetworkClient(
            { providerType },
            async ({ makeRpcCall }) => makeRpcCall(request),
          );

          await expect(promiseForResult).rejects.toThrow(
            '{"id":1,"jsonrpc":"2.0"}',
          );
        });
      });

      it('throws an error with a custom message if the request to the RPC endpoint returns a 429 response', async () => {
        await withMockedCommunications({ providerType }, async (comms) => {
          const request = { method };

          // The first time a block-cacheable request is made, the
          // block-cache middleware will request the latest block number
          // through the block tracker to determine the cache key. Later,
          // the block-ref middleware will request the latest block number
          // again to resolve the value of "latest", but the block number is
          // cached once made, so we only need to mock the request once.
          comms.mockNextBlockTrackerRequest({ blockNumber: '0x100' });
          // The block-ref middleware will make the request as specified
          // except that the block param is replaced with the latest block
          // number.
          comms.mockRpcCall({
            request: buildRequestWithReplacedBlockParam(
              request,
              blockParamIndex,
              '0x100',
            ),
            response: {
              httpStatus: 429,
            },
          });
          const promiseForResult = withNetworkClient(
            { providerType },
            async ({ makeRpcCall }) => makeRpcCall(request),
          );

          await expect(promiseForResult).rejects.toThrow(
            'Request is being rate limited',
          );
        });
      });
    } else {
      it('throws an error with a custom message if the request to the RPC endpoint returns a 418 response', async () => {
        await withMockedCommunications({ providerType }, async (comms) => {
          const request = { method };

          // The first time a block-cacheable request is made, the
          // block-cache middleware will request the latest block number
          // through the block tracker to determine the cache key. Later,
          // the block-ref middleware will request the latest block number
          // again to resolve the value of "latest", but the block number is
          // cached once made, so we only need to mock the request once.
          comms.mockNextBlockTrackerRequest({ blockNumber: '0x100' });
          // The block-ref middleware will make the request as specified
          // except that the block param is replaced with the latest block
          // number.
          comms.mockRpcCall({
            request: buildRequestWithReplacedBlockParam(
              request,
              blockParamIndex,
              '0x100',
            ),
            response: {
              httpStatus: 418,
            },
          });
          const promiseForResult = withNetworkClient(
            { providerType },
            async ({ makeRpcCall }) => makeRpcCall(request),
          );

          await expect(promiseForResult).rejects.toThrow(
            'Request is being rate limited.',
          );
        });
      });

      it('throws an undescriptive error if the request to the RPC endpoint returns a 429 response', async () => {
        await withMockedCommunications({ providerType }, async (comms) => {
          const request = { method };

          // The first time a block-cacheable request is made, the
          // block-cache middleware will request the latest block number
          // through the block tracker to determine the cache key. Later,
          // the block-ref middleware will request the latest block number
          // again to resolve the value of "latest", but the block number is
          // cached once made, so we only need to mock the request once.
          comms.mockNextBlockTrackerRequest({ blockNumber: '0x100' });
          // The block-ref middleware will make the request as specified
          // except that the block param is replaced with the latest block
          // number.
          comms.mockRpcCall({
            request: buildRequestWithReplacedBlockParam(
              request,
              blockParamIndex,
              '0x100',
            ),
            response: {
              httpStatus: 429,
            },
          });
          const promiseForResult = withNetworkClient(
            { providerType },
            async ({ makeRpcCall }) => makeRpcCall(request),
          );

          await expect(promiseForResult).rejects.toThrow(
            "Non-200 status code: '429'",
          );
        });
      });
    }

    it('throws an undescriptive error message if the request to the RPC endpoint returns a response that is not 405, 418, 429, 503, or 504', async () => {
      await withMockedCommunications({ providerType }, async (comms) => {
        const request = { method };

        // The first time a block-cacheable request is made, the
        // block-cache middleware will request the latest block number
        // through the block tracker to determine the cache key. Later,
        // the block-ref middleware will request the latest block number
        // again to resolve the value of "latest", but the block number is
        // cached once made, so we only need to mock the request once.
        comms.mockNextBlockTrackerRequest({ blockNumber: '0x100' });
        // The block-ref middleware will make the request as specified
        // except that the block param is replaced with the latest block
        // number.
        comms.mockRpcCall({
          request: buildRequestWithReplacedBlockParam(
            request,
            blockParamIndex,
            '0x100',
          ),
          response: {
            id: 12345,
            jsonrpc: '2.0',
            error: 'some error',
            httpStatus: 420,
          },
        });
        const promiseForResult = withNetworkClient(
          { providerType },
          async ({ makeRpcCall }) => makeRpcCall(request),
        );

        const msg =
          providerType === 'infura'
            ? '{"id":12345,"jsonrpc":"2.0","error":"some error"}'
            : "Non-200 status code: '420'";
        await expect(promiseForResult).rejects.toThrow(msg);
      });
    });

    [503, 504].forEach((httpStatus) => {
      it(`retries the request to the RPC endpoint up to 5 times if it returns a ${httpStatus} response, returning the successful result if there is one on the 5th try`, async () => {
        await withMockedCommunications({ providerType }, async (comms) => {
          const request = { method };

          // The first time a block-cacheable request is made, the
          // block-cache middleware will request the latest block number
          // through the block tracker to determine the cache key. Later,
          // the block-ref middleware will request the latest block number
          // again to resolve the value of "latest", but the block number is
          // cached once made, so we only need to mock the request once.
          comms.mockNextBlockTrackerRequest({ blockNumber: '0x100' });
          // The block-ref middleware will make the request as specified
          // except that the block param is replaced with the latest block
          // number.
          //
          // Here we have the request fail for the first 4 tries, then succeed
          // on the 5th try.
          comms.mockRpcCall({
            request: buildRequestWithReplacedBlockParam(
              request,
              blockParamIndex,
              '0x100',
            ),
            response: {
              error: 'some error',
              httpStatus,
            },
            times: 4,
          });
          comms.mockRpcCall({
            request: buildRequestWithReplacedBlockParam(
              request,
              blockParamIndex,
              '0x100',
            ),
            response: {
              result: 'the result',
              httpStatus: 200,
            },
          });
          const result = await withNetworkClient(
            { providerType },
            async ({ makeRpcCall, clock }) => {
              return await waitForPromiseToBeFulfilledAfterRunningAllTimers(
                makeRpcCall(request),
                clock,
              );
            },
          );

          expect(result).toStrictEqual('the result');
        });
      });

      // Both the Infura middleware and custom RPC middleware detect a 503 or 504
      // response and retry the request to the RPC endpoint automatically but
      // differ in what sort of response is returned when the number of retries is
      // exhausted.
      if (providerType === 'infura') {
        it(`causes a request to fail with a custom error if the request to the RPC endpoint returns a ${httpStatus} response 5 times in a row`, async () => {
          await withMockedCommunications({ providerType }, async (comms) => {
            const request = { method };

            // The first time a block-cacheable request is made, the
            // block-cache middleware will request the latest block number
            // through the block tracker to determine the cache key. Later,
            // the block-ref middleware will request the latest block number
            // again to resolve the value of "latest", but the block number is
            // cached once made, so we only need to mock the request once.
            comms.mockNextBlockTrackerRequest({ blockNumber: '0x100' });
            // The block-ref middleware will make the request as specified
            // except that the block param is replaced with the latest block
            // number.
            comms.mockRpcCall({
              request: buildRequestWithReplacedBlockParam(
                request,
                blockParamIndex,
                '0x100',
              ),
              response: {
                error: 'Some error',
                httpStatus,
              },
              times: 5,
            });
            const promiseForResult = withNetworkClient(
              { providerType },
              async ({ makeRpcCall, clock }) => {
                return await waitForPromiseToBeFulfilledAfterRunningAllTimers(
                  makeRpcCall(request),
                  clock,
                );
              },
            );
            await expect(promiseForResult).rejects.toThrow(
              buildInfuraClientRetriesExhaustedErrorMessage('Gateway timeout'),
            );
          });
        });
      } else {
        it(`produces an empty response if the request to the RPC endpoint returns a ${httpStatus} response 5 times in a row`, async () => {
          await withMockedCommunications({ providerType }, async (comms) => {
            const request = { method };

            // The first time a block-cacheable request is made, the
            // block-cache middleware will request the latest block number
            // through the block tracker to determine the cache key. Later,
            // the block-ref middleware will request the latest block number
            // again to resolve the value of "latest", but the block number is
            // cached once made, so we only need to mock the request once.
            comms.mockNextBlockTrackerRequest({ blockNumber: '0x100' });
            // The block-ref middleware will make the request as specified
            // except that the block param is replaced with the latest block
            // number.
            comms.mockRpcCall({
              request: buildRequestWithReplacedBlockParam(
                request,
                blockParamIndex,
                '0x100',
              ),
              response: {
                error: 'Some error',
                httpStatus,
              },
              times: 5,
            });
            const promiseForResult = withNetworkClient(
              { providerType },
              async ({ makeRpcCall, clock }) => {
                return await waitForPromiseToBeFulfilledAfterRunningAllTimers(
                  makeRpcCall(request),
                  clock,
                );
              },
            );
            await expect(promiseForResult).rejects.toThrow(
              buildJsonRpcEngineEmptyResponseErrorMessage(method),
            );
          });
        });
      }
    });

    it('retries the request to the RPC endpoint up to 5 times if an "ETIMEDOUT" error is thrown while making the request, returning the successful result if there is one on the 5th try', async () => {
      await withMockedCommunications({ providerType }, async (comms) => {
        const request = { method };

        // The first time a block-cacheable request is made, the
        // block-cache middleware will request the latest block number
        // through the block tracker to determine the cache key. Later,
        // the block-ref middleware will request the latest block number
        // again to resolve the value of "latest", but the block number is
        // cached once made, so we only need to mock the request once.
        comms.mockNextBlockTrackerRequest({ blockNumber: '0x100' });
        // The block-ref middleware will make the request as specified
        // except that the block param is replaced with the latest block
        // number.
        //
        // Here we have the request fail for the first 4 tries, then
        // succeed on the 5th try.
        comms.mockRpcCall({
          request: buildRequestWithReplacedBlockParam(
            request,
            blockParamIndex,
            '0x100',
          ),
          error: 'ETIMEDOUT: Some message',
          times: 4,
        });
        comms.mockRpcCall({
          request: buildRequestWithReplacedBlockParam(
            request,
            blockParamIndex,
            '0x100',
          ),
          response: {
            result: 'the result',
            httpStatus: 200,
          },
        });

        const result = await withNetworkClient(
          { providerType },
          async ({ makeRpcCall, clock }) => {
            return await waitForPromiseToBeFulfilledAfterRunningAllTimers(
              makeRpcCall(request),
              clock,
            );
          },
        );

        expect(result).toStrictEqual('the result');
      });
    });

    // Both the Infura and fetch middleware detect ETIMEDOUT errors and will
    // automatically retry the request to the RPC endpoint in question, but each
    // produces a different error if the number of retries is exhausted.
    if (providerType === 'infura') {
      it('causes a request to fail with a custom error if an "ETIMEDOUT" error is thrown while making the request to the RPC endpoint 5 times in a row', async () => {
        await withMockedCommunications({ providerType }, async (comms) => {
          const request = { method };
          const errorMessage = 'ETIMEDOUT: Some message';

          // The first time a block-cacheable request is made, the
          // block-cache middleware will request the latest block number
          // through the block tracker to determine the cache key. Later,
          // the block-ref middleware will request the latest block number
          // again to resolve the value of "latest", but the block number is
          // cached once made, so we only need to mock the request once.
          comms.mockNextBlockTrackerRequest({ blockNumber: '0x100' });
          // The block-ref middleware will make the request as specified
          // except that the block param is replaced with the latest block
          // number.

          comms.mockRpcCall({
            request: buildRequestWithReplacedBlockParam(
              request,
              blockParamIndex,
              '0x100',
            ),
            error: errorMessage,
            times: 5,
          });

          const promiseForResult = withNetworkClient(
            { providerType },
            async ({ makeRpcCall, clock }) => {
              return await waitForPromiseToBeFulfilledAfterRunningAllTimers(
                makeRpcCall(request),
                clock,
              );
            },
          );

          await expect(promiseForResult).rejects.toThrow(
            buildInfuraClientRetriesExhaustedErrorMessage(errorMessage),
          );
        });
      });
    } else {
      it('produces an empty response if an "ETIMEDOUT" error is thrown while making the request to the RPC endpoint 5 times in a row', async () => {
        await withMockedCommunications({ providerType }, async (comms) => {
          const request = { method };
          const errorMessage = 'ETIMEDOUT: Some message';

          // The first time a block-cacheable request is made, the
          // block-cache middleware will request the latest block number
          // through the block tracker to determine the cache key. Later,
          // the block-ref middleware will request the latest block number
          // again to resolve the value of "latest", but the block number is
          // cached once made, so we only need to mock the request once.
          comms.mockNextBlockTrackerRequest({ blockNumber: '0x100' });
          // The block-ref middleware will make the request as specified
          // except that the block param is replaced with the latest block
          // number.

          comms.mockRpcCall({
            request: buildRequestWithReplacedBlockParam(
              request,
              blockParamIndex,
              '0x100',
            ),
            error: errorMessage,
            times: 5,
          });

          const promiseForResult = withNetworkClient(
            { providerType },
            async ({ makeRpcCall, clock }) => {
              return await waitForPromiseToBeFulfilledAfterRunningAllTimers(
                makeRpcCall(request),
                clock,
              );
            },
          );

          await expect(promiseForResult).rejects.toThrow(
            buildJsonRpcEngineEmptyResponseErrorMessage(method),
          );
        });
      });
    }

    // The Infura middleware treats a response that contains an ECONNRESET
    // message as an innocuous error that is likely to disappear on a retry. The
    // custom RPC middleware, on the other hand, does not specially handle this
    // error.
    if (providerType === 'infura') {
      it('retries the request to the RPC endpoint up to 5 times if an "ECONNRESET" error is thrown while making the request, returning the successful result if there is one on the 5th try', async () => {
        await withMockedCommunications({ providerType }, async (comms) => {
          const request = { method };

          // The first time a block-cacheable request is made, the
          // block-cache middleware will request the latest block number
          // through the block tracker to determine the cache key. Later,
          // the block-ref middleware will request the latest block number
          // again to resolve the value of "latest", but the block number is
          // cached once made, so we only need to mock the request once.
          comms.mockNextBlockTrackerRequest({ blockNumber: '0x100' });
          // The block-ref middleware will make the request as specified
          // except that the block param is replaced with the latest block
          // number.
          //
          // Here we have the request fail for the first 4 tries, then
          // succeed on the 5th try.
          comms.mockRpcCall({
            request: buildRequestWithReplacedBlockParam(
              request,
              blockParamIndex,
              '0x100',
            ),
            error: 'ECONNRESET: Some message',
            times: 4,
          });
          comms.mockRpcCall({
            request: buildRequestWithReplacedBlockParam(
              request,
              blockParamIndex,
              '0x100',
            ),
            response: {
              result: 'the result',
              httpStatus: 200,
            },
          });

          const result = await withNetworkClient(
            { providerType },
            async ({ makeRpcCall, clock }) => {
              return await waitForPromiseToBeFulfilledAfterRunningAllTimers(
                makeRpcCall(request),
                clock,
              );
            },
          );

          expect(result).toStrictEqual('the result');
        });
      });

      it('causes a request to fail with a custom error if an "ECONNRESET" error is thrown while making the request to the RPC endpoint 5 times in a row', async () => {
        await withMockedCommunications({ providerType }, async (comms) => {
          const request = { method };
          const errorMessage = 'ECONNRESET: Some message';

          // The first time a block-cacheable request is made, the
          // block-cache middleware will request the latest block number
          // through the block tracker to determine the cache key. Later,
          // the block-ref middleware will request the latest block number
          // again to resolve the value of "latest", but the block number is
          // cached once made, so we only need to mock the request once.
          comms.mockNextBlockTrackerRequest({ blockNumber: '0x100' });
          // The block-ref middleware will make the request as specified
          // except that the block param is replaced with the latest block
          // number.
          comms.mockRpcCall({
            request: buildRequestWithReplacedBlockParam(
              request,
              blockParamIndex,
              '0x100',
            ),
            error: errorMessage,
            times: 5,
          });

          const promiseForResult = withNetworkClient(
            { providerType },
            async ({ makeRpcCall, clock }) => {
              return await waitForPromiseToBeFulfilledAfterRunningAllTimers(
                makeRpcCall(request),
                clock,
              );
            },
          );

          await expect(promiseForResult).rejects.toThrow(
            buildInfuraClientRetriesExhaustedErrorMessage(errorMessage),
          );
        });
      });
    } else {
      it('does not retry the request to the RPC endpoint, but throws immediately, if an "ECONNRESET" error is thrown while making the request', async () => {
        const customRpcUrl = 'http://example.com';

        await withMockedCommunications(
          { providerType, customRpcUrl },
          async (comms) => {
            const request = { method };
            const errorMessage = 'ECONNRESET: Some message';

            // The first time a block-cacheable request is made, the
            // block-cache middleware will request the latest block number
            // through the block tracker to determine the cache key. Later,
            // the block-ref middleware will request the latest block number
            // again to resolve the value of "latest", but the block number is
            // cached once made, so we only need to mock the request once.
            comms.mockNextBlockTrackerRequest({ blockNumber: '0x100' });
            // The block-ref middleware will make the request as specified
            // except that the block param is replaced with the latest block
            // number.
            comms.mockRpcCall({
              request: buildRequestWithReplacedBlockParam(
                request,
                blockParamIndex,
                '0x100',
              ),
              error: errorMessage,
            });

            const promiseForResult = withNetworkClient(
              { providerType, customRpcUrl },
              async ({ makeRpcCall }) => makeRpcCall(request),
            );

            await expect(promiseForResult).rejects.toThrow(
              buildFetchFailedErrorMessage(customRpcUrl, errorMessage),
            );
          },
        );
      });
    }

    // Both the Infura and fetch middleware will attempt to parse the response
    // body as JSON, and if this step produces an error, both middleware will
    // also attempt to retry the request. However, this error handling code is
    // slightly different between the two. As the error in this case is a
    // SyntaxError, the Infura middleware will catch it immediately, whereas the
    // custom RPC middleware will catch it and re-throw a separate error, which
    // it then catches later.
    if (providerType === 'infura') {
      it('retries the request to the RPC endpoint up to 5 times if a "SyntaxError" error is thrown while making the request, returning the successful result if there is one on the 5th try', async () => {
        await withMockedCommunications({ providerType }, async (comms) => {
          const request = { method };

          // The first time a block-cacheable request is made, the
          // block-cache middleware will request the latest block number
          // through the block tracker to determine the cache key. Later,
          // the block-ref middleware will request the latest block number
          // again to resolve the value of "latest", but the block number is
          // cached once made, so we only need to mock the request once.
          comms.mockNextBlockTrackerRequest({ blockNumber: '0x100' });
          // The block-ref middleware will make the request as specified
          // except that the block param is replaced with the latest block
          // number.
          //
          // Here we have the request fail for the first 4 tries, then
          // succeed on the 5th try.
          comms.mockRpcCall({
            request: buildRequestWithReplacedBlockParam(
              request,
              blockParamIndex,
              '0x100',
            ),
            error: 'SyntaxError: Some message',
            times: 4,
          });
          comms.mockRpcCall({
            request: buildRequestWithReplacedBlockParam(
              request,
              blockParamIndex,
              '0x100',
            ),
            response: {
              result: 'the result',
              httpStatus: 200,
            },
          });
          const result = await withNetworkClient(
            { providerType },
            async ({ makeRpcCall, clock }) => {
              return await waitForPromiseToBeFulfilledAfterRunningAllTimers(
                makeRpcCall(request),
                clock,
              );
            },
          );

          expect(result).toStrictEqual('the result');
        });
      });

      it('causes a request to fail with a custom error if a "SyntaxError" error is thrown while making the request to the RPC endpoint 5 times in a row', async () => {
        await withMockedCommunications({ providerType }, async (comms) => {
          const request = { method };
          const errorMessage = 'SyntaxError: Some message';

          // The first time a block-cacheable request is made, the
          // block-cache middleware will request the latest block number
          // through the block tracker to determine the cache key. Later,
          // the block-ref middleware will request the latest block number
          // again to resolve the value of "latest", but the block number is
          // cached once made, so we only need to mock the request once.
          comms.mockNextBlockTrackerRequest({ blockNumber: '0x100' });
          // The block-ref middleware will make the request as specified
          // except that the block param is replaced with the latest block
          // number.
          comms.mockRpcCall({
            request: buildRequestWithReplacedBlockParam(
              request,
              blockParamIndex,
              '0x100',
            ),
            error: errorMessage,
            times: 5,
          });

          const promiseForResult = withNetworkClient(
            { providerType },
            async ({ makeRpcCall, clock }) => {
              return await waitForPromiseToBeFulfilledAfterRunningAllTimers(
                makeRpcCall(request),
                clock,
              );
            },
          );

          await expect(promiseForResult).rejects.toThrow(
            buildInfuraClientRetriesExhaustedErrorMessage(errorMessage),
          );
        });
      });

      it('does not retry the request to the RPC endpoint, but throws immediately, if a "failed to parse response body" error is thrown while making the request', async () => {
        await withMockedCommunications({ providerType }, async (comms) => {
          const request = { method };
          const errorMessage = 'failed to parse response body: Some message';

          // The first time a block-cacheable request is made, the
          // block-cache middleware will request the latest block number
          // through the block tracker to determine the cache key. Later,
          // the block-ref middleware will request the latest block number
          // again to resolve the value of "latest", but the block number is
          // cached once made, so we only need to mock the request once.
          comms.mockNextBlockTrackerRequest({ blockNumber: '0x100' });
          // The block-ref middleware will make the request as specified
          // except that the block param is replaced with the latest block
          // number.
          comms.mockRpcCall({
            request: buildRequestWithReplacedBlockParam(
              request,
              blockParamIndex,
              '0x100',
            ),
            error: errorMessage,
          });

          const promiseForResult = withNetworkClient(
            { providerType, infuraNetwork: comms.infuraNetwork },
            async ({ makeRpcCall }) => makeRpcCall(request),
          );

          await expect(promiseForResult).rejects.toThrow(
            buildFetchFailedErrorMessage(comms.rpcUrl, errorMessage),
          );
        });
      });
    } else {
      it('does not retry the request to the RPC endpoint, but throws immediately, if a "SyntaxError" error is thrown while making the request', async () => {
        const customRpcUrl = 'http://example.com';

        await withMockedCommunications(
          { providerType, customRpcUrl },
          async (comms) => {
            const request = { method };
            const errorMessage = 'SyntaxError: Some message';

            // The first time a block-cacheable request is made, the
            // block-cache middleware will request the latest block number
            // through the block tracker to determine the cache key. Later,
            // the block-ref middleware will request the latest block number
            // again to resolve the value of "latest", but the block number is
            // cached once made, so we only need to mock the request once.
            comms.mockNextBlockTrackerRequest({ blockNumber: '0x100' });
            // The block-ref middleware will make the request as specified
            // except that the block param is replaced with the latest block
            // number.
            comms.mockRpcCall({
              request: buildRequestWithReplacedBlockParam(
                request,
                blockParamIndex,
                '0x100',
              ),
              error: errorMessage,
            });

            const promiseForResult = withNetworkClient(
              { providerType, customRpcUrl },
              async ({ makeRpcCall }) => makeRpcCall(request),
            );

            await expect(promiseForResult).rejects.toThrow(
              buildFetchFailedErrorMessage(customRpcUrl, errorMessage),
            );
          },
        );
      });

      it('retries the request to the RPC endpoint up to 5 times if a "failed to parse response body" error is thrown while making the request, returning the successful result if there is one on the 5th try', async () => {
        await withMockedCommunications({ providerType }, async (comms) => {
          const request = { method };

          // The first time a block-cacheable request is made, the
          // block-cache middleware will request the latest block number
          // through the block tracker to determine the cache key. Later,
          // the block-ref middleware will request the latest block number
          // again to resolve the value of "latest", but the block number is
          // cached once made, so we only need to mock the request once.
          comms.mockNextBlockTrackerRequest({ blockNumber: '0x100' });
          // The block-ref middleware will make the request as specified
          // except that the block param is replaced with the latest block
          // number.
          //
          // Here we have the request fail for the first 4 tries, then
          // succeed on the 5th try.
          comms.mockRpcCall({
            request: buildRequestWithReplacedBlockParam(
              request,
              blockParamIndex,
              '0x100',
            ),
            error: 'failed to parse response body: Some message',
            times: 4,
          });
          comms.mockRpcCall({
            request: buildRequestWithReplacedBlockParam(
              request,
              blockParamIndex,
              '0x100',
            ),
            response: {
              result: 'the result',
              httpStatus: 200,
            },
          });

          const result = await withNetworkClient(
            { providerType },
            async ({ makeRpcCall, clock }) => {
              return await waitForPromiseToBeFulfilledAfterRunningAllTimers(
                makeRpcCall(request),
                clock,
              );
            },
          );

          expect(result).toStrictEqual('the result');
        });
      });

      it('produces an empty response if a "failed to parse response body" error is thrown while making the request to the RPC endpoint 5 times in a row', async () => {
        await withMockedCommunications({ providerType }, async (comms) => {
          const request = { method };
          const errorMessage = 'failed to parse response body: some message';

          // The first time a block-cacheable request is made, the
          // block-cache middleware will request the latest block number
          // through the block tracker to determine the cache key. Later,
          // the block-ref middleware will request the latest block number
          // again to resolve the value of "latest", but the block number is
          // cached once made, so we only need to mock the request once.
          comms.mockNextBlockTrackerRequest({ blockNumber: '0x100' });
          // The block-ref middleware will make the request as specified
          // except that the block param is replaced with the latest block
          // number.
          comms.mockRpcCall({
            request: buildRequestWithReplacedBlockParam(
              request,
              blockParamIndex,
              '0x100',
            ),
            error: errorMessage,
            times: 5,
          });
          const promiseForResult = withNetworkClient(
            { providerType },
            async ({ makeRpcCall, clock }) => {
              return await waitForPromiseToBeFulfilledAfterRunningAllTimers(
                makeRpcCall(request),
                clock,
              );
            },
          );

          await expect(promiseForResult).rejects.toThrow(
            buildJsonRpcEngineEmptyResponseErrorMessage(method),
          );
        });
      });
    }

    // Only the custom RPC middleware will detect a "Failed to fetch" error and
    // attempt to retry the request to the RPC endpoint; the Infura middleware
    // does not.
    if (providerType === 'infura') {
      it('does not retry the request to the RPC endpoint, but throws immediately, if a "Failed to fetch" error is thrown while making the request', async () => {
        await withMockedCommunications({ providerType }, async (comms) => {
          const request = { method };
          const errorMessage = 'Failed to fetch: Some message';

          // The first time a block-cacheable request is made, the
          // block-cache middleware will request the latest block number
          // through the block tracker to determine the cache key. Later,
          // the block-ref middleware will request the latest block number
          // again to resolve the value of "latest", but the block number is
          // cached once made, so we only need to mock the request once.
          comms.mockNextBlockTrackerRequest({ blockNumber: '0x100' });
          // The block-ref middleware will make the request as specified
          // except that the block param is replaced with the latest block
          // number.
          comms.mockRpcCall({
            request: buildRequestWithReplacedBlockParam(
              request,
              blockParamIndex,
              '0x100',
            ),
            error: errorMessage,
          });

          const promiseForResult = withNetworkClient(
            { providerType, infuraNetwork: comms.infuraNetwork },
            async ({ makeRpcCall }) => makeRpcCall(request),
          );

          await expect(promiseForResult).rejects.toThrow(
            buildFetchFailedErrorMessage(comms.rpcUrl, errorMessage),
          );
        });
      });
    } else {
      it('retries the request to the RPC endpoint up to 5 times if a "Failed to fetch" error is thrown while making the request, returning the successful result if there is one on the 5th try', async () => {
        await withMockedCommunications({ providerType }, async (comms) => {
          const request = { method };

          // The first time a block-cacheable request is made, the
          // block-cache middleware will request the latest block number
          // through the block tracker to determine the cache key. Later,
          // the block-ref middleware will request the latest block number
          // again to resolve the value of "latest", but the block number is
          // cached once made, so we only need to mock the request once.
          comms.mockNextBlockTrackerRequest({ blockNumber: '0x100' });
          // The block-ref middleware will make the request as specified
          // except that the block param is replaced with the latest block
          // number.
          //
          // Here we have the request fail for the first 4 tries, then
          // succeed on the 5th try.
          comms.mockRpcCall({
            request: buildRequestWithReplacedBlockParam(
              request,
              blockParamIndex,
              '0x100',
            ),
            error: 'Failed to fetch: Some message',
            times: 4,
          });
          comms.mockRpcCall({
            request: buildRequestWithReplacedBlockParam(
              request,
              blockParamIndex,
              '0x100',
            ),
            response: {
              result: 'the result',
              httpStatus: 200,
            },
          });

          const result = await withNetworkClient(
            { providerType },
            async ({ makeRpcCall, clock }) => {
              return await waitForPromiseToBeFulfilledAfterRunningAllTimers(
                makeRpcCall(request),
                clock,
              );
            },
          );

          expect(result).toStrictEqual('the result');
        });
      });

      it('produces an empty response if a "Failed to fetch" error is thrown while making the request to the RPC endpoint 5 times in a row', async () => {
        await withMockedCommunications({ providerType }, async (comms) => {
          const request = { method };
          const errorMessage = 'Failed to fetch: some message';

          // The first time a block-cacheable request is made, the
          // block-cache middleware will request the latest block number
          // through the block tracker to determine the cache key. Later,
          // the block-ref middleware will request the latest block number
          // again to resolve the value of "latest", but the block number is
          // cached once made, so we only need to mock the request once.
          comms.mockNextBlockTrackerRequest({ blockNumber: '0x100' });
          // The block-ref middleware will make the request as specified
          // except that the block param is replaced with the latest block
          // number.
          comms.mockRpcCall({
            request: buildRequestWithReplacedBlockParam(
              request,
              blockParamIndex,
              '0x100',
            ),
            error: errorMessage,
            times: 5,
          });
          const promiseForResult = withNetworkClient(
            { providerType },
            async ({ makeRpcCall, clock }) => {
              return await waitForPromiseToBeFulfilledAfterRunningAllTimers(
                makeRpcCall(request),
                clock,
              );
            },
          );

          await expect(promiseForResult).rejects.toThrow(
            buildJsonRpcEngineEmptyResponseErrorMessage(method),
          );
        });
      });
    }
  });

  describe.each([
    ['given a block tag of "earliest"', 'earliest', 'earliest'],
    ['given a block number', 'block number', '0x100'],
  ])('%s', (_desc, blockParamType, blockParam) => {
    it('does not hit the RPC endpoint more than once for identical requests', async () => {
      const requests = [
        {
          method,
          params: buildMockParams({ blockParamIndex, blockParam }),
        },
        {
          method,
          params: buildMockParams({ blockParamIndex, blockParam }),
        },
      ];
      const mockResults = ['first result', 'second result'];

      await withMockedCommunications({ providerType }, async (comms) => {
        // The first time a block-cacheable request is made, the block-cache
        // middleware will request the latest block number through the block
        // tracker to determine the cache key. This block number doesn't
        // matter.
        comms.mockNextBlockTrackerRequest();
        comms.mockRpcCall({
          request: requests[0],
          response: { result: mockResults[0] },
        });

        const results = await withNetworkClient(
          { providerType },
          ({ makeRpcCallsInSeries }) => makeRpcCallsInSeries(requests),
        );

        expect(results).toStrictEqual([mockResults[0], mockResults[0]]);
      });
    });

    for (const paramIndex of [...Array(numberOfParameters).keys()]) {
      if (paramIndex === blockParamIndex) {
        // testing changes in block param is covered under later tests
        continue;
      }
      it(`does not reuse the result of a previous request if parameter at index "${paramIndex}" differs`, async () => {
        const firstMockParams = [
          ...new Array(numberOfParameters).fill('some value'),
        ];
        firstMockParams[blockParamIndex] = blockParam;
        const secondMockParams = firstMockParams.slice();
        secondMockParams[paramIndex] = 'another value';
        const requests = [
          {
            method,
            params: firstMockParams,
          },
          { method, params: secondMockParams },
        ];
        const mockResults = ['first result', 'second result'];

        await withMockedCommunications({ providerType }, async (comms) => {
          // The first time a block-cacheable request is made, the block-cache
          // middleware will request the latest block number through the block
          // tracker to determine the cache key. Later, the block-ref
          // middleware will request the latest block number again to resolve
          // the value of "latest", but the block number is cached once made,
          // so we only need to mock the request once.
          comms.mockNextBlockTrackerRequest({ blockNumber: '0x100' });
          // The block-ref middleware will make the request as specified
          // except that the block param is replaced with the latest block
          // number.
          comms.mockRpcCall({
            request: requests[0],
            response: { result: mockResults[0] },
          });
          comms.mockRpcCall({
            request: requests[1],
            response: { result: mockResults[1] },
          });

          const results = await withNetworkClient(
            { providerType },
            ({ makeRpcCallsInSeries }) => makeRpcCallsInSeries(requests),
          );

          expect(results).toStrictEqual([mockResults[0], mockResults[1]]);
        });
      });
    }

    it('reuses the result of a previous request even if the latest block number was updated since', async () => {
      const requests = [
        {
          method,
          params: buildMockParams({ blockParamIndex, blockParam }),
        },
        {
          method,
          params: buildMockParams({ blockParamIndex, blockParam }),
        },
      ];
      const mockResults = ['first result', 'second result'];

      await withMockedCommunications({ providerType }, async (comms) => {
        // Note that we have to mock these requests in a specific order. The
        // first block tracker request occurs because of the first RPC
        // request. The second block tracker request, however, does not
        // occur because of the second RPC request, but rather because we
        // call `clock.runAll()` below.
        comms.mockNextBlockTrackerRequest({ blockNumber: '0x1' });
        comms.mockRpcCall({
          request: requests[0],
          response: { result: mockResults[0] },
        });
        comms.mockNextBlockTrackerRequest({ blockNumber: '0x2' });
        comms.mockRpcCall({
          request: requests[1],
          response: { result: mockResults[1] },
        });

        const results = await withNetworkClient(
          { providerType },
          async (client) => {
            const firstResult = await client.makeRpcCall(requests[0]);
            // Proceed to the next iteration of the block tracker so that a
            // new block is fetched and the current block is updated.
            client.clock.runAll();
            const secondResult = await client.makeRpcCall(requests[1]);
            return [firstResult, secondResult];
          },
        );

        expect(results).toStrictEqual([mockResults[0], mockResults[0]]);
      });
    });

    it.each([null, undefined, '\u003cnil\u003e'])(
      'does not reuse the result of a previous request if it was `%s`',
      async (emptyValue) => {
        const requests = [
          {
            method,
            params: buildMockParams({ blockParamIndex, blockParam }),
          },
          {
            method,
            params: buildMockParams({ blockParamIndex, blockParam }),
          },
        ];
        const mockResults = [emptyValue, 'some result'];

        await withMockedCommunications({ providerType }, async (comms) => {
          // The first time a block-cacheable request is made, the latest block
          // number is retrieved through the block tracker first. It doesn't
          // matter what this is — it's just used as a cache key.
          comms.mockNextBlockTrackerRequest();
          comms.mockRpcCall({
            request: requests[0],
            response: { result: mockResults[0] },
          });
          comms.mockRpcCall({
            request: requests[1],
            response: { result: mockResults[1] },
          });

          const results = await withNetworkClient(
            { providerType },
            ({ makeRpcCallsInSeries }) => makeRpcCallsInSeries(requests),
          );

          expect(results).toStrictEqual(mockResults);
        });
      },
    );

    if (blockParamType === 'earliest') {
      it('treats "0x00" as a synonym for "earliest"', async () => {
        const requests = [
          {
            method,
            params: buildMockParams({ blockParamIndex, blockParam }),
          },
          {
            method,
            params: buildMockParams({ blockParamIndex, blockParam: '0x00' }),
          },
        ];
        const mockResults = ['first result', 'second result'];

        await withMockedCommunications({ providerType }, async (comms) => {
          // The first time a block-cacheable request is made, the latest
          // block number is retrieved through the block tracker first. It
          // doesn't matter what this is — it's just used as a cache key.
          comms.mockNextBlockTrackerRequest();
          comms.mockRpcCall({
            request: requests[0],
            response: { result: mockResults[0] },
          });

          const results = await withNetworkClient(
            { providerType },
            ({ makeRpcCallsInSeries }) => makeRpcCallsInSeries(requests),
          );

          expect(results).toStrictEqual([mockResults[0], mockResults[0]]);
        });
      });
    }

    if (blockParamType === 'block number') {
      it('does not reuse the result of a previous request if it was made with different arguments than this one', async () => {
        await withMockedCommunications({ providerType }, async (comms) => {
          const requests = [
            {
              method,
              params: buildMockParams({ blockParamIndex, blockParam: '0x100' }),
            },
            {
              method,
              params: buildMockParams({ blockParamIndex, blockParam: '0x200' }),
            },
          ];

          // The first time a block-cacheable request is made, the latest block
          // number is retrieved through the block tracker first. It doesn't
          // matter what this is — it's just used as a cache key.
          comms.mockNextBlockTrackerRequest();
          comms.mockRpcCall({
            request: requests[0],
            response: { result: 'first result' },
          });
          comms.mockRpcCall({
            request: requests[1],
            response: { result: 'second result' },
          });

          const results = await withNetworkClient(
            { providerType },
            ({ makeRpcCallsInSeries }) => makeRpcCallsInSeries(requests),
          );

          expect(results).toStrictEqual(['first result', 'second result']);
        });
      });

      it('makes an additional request to the RPC endpoint if the given block number matches the latest block number', async () => {
        await withMockedCommunications({ providerType }, async (comms) => {
          const request = {
            method,
            params: buildMockParams({ blockParamIndex, blockParam: '0x100' }),
          };

          // The first time a block-cacheable request is made, the latest
          // block number is retrieved through the block tracker first. This
          // also happens within the retry-on-empty middleware (although the
          // latest block is cached by now).
          comms.mockNextBlockTrackerRequest({ blockNumber: '0x100' });
          comms.mockRpcCall({
            request,
            response: { result: 'the result' },
          });

          const result = await withNetworkClient(
            { providerType },
            ({ makeRpcCall }) => makeRpcCall(request),
          );

          expect(result).toStrictEqual('the result');
        });
      });

      it('makes an additional request to the RPC endpoint if the given block number is less than the latest block number', async () => {
        await withMockedCommunications({ providerType }, async (comms) => {
          const request = {
            method,
            params: buildMockParams({ blockParamIndex, blockParam: '0x50' }),
          };

          // The first time a block-cacheable request is made, the latest
          // block number is retrieved through the block tracker first. This
          // also happens within the retry-on-empty middleware (although the
          // latest block is cached by now).
          comms.mockNextBlockTrackerRequest({ blockNumber: '0x100' });
          comms.mockRpcCall({
            request,
            response: { result: 'the result' },
          });

          const result = await withNetworkClient(
            { providerType },
            ({ makeRpcCall }) => makeRpcCall(request),
          );

          expect(result).toStrictEqual('the result');
        });
      });
    }
  });

  describe('given a block tag of "pending"', () => {
    const params = buildMockParams({ blockParamIndex, blockParam: 'pending' });

    it('hits the RPC endpoint on all calls and does not cache anything', async () => {
      const requests = [
        { method, params },
        { method, params },
      ];
      const mockResults = ['first result', 'second result'];

      await withMockedCommunications({ providerType }, async (comms) => {
        // The first time a block-cacheable request is made, the latest
        // block number is retrieved through the block tracker first. It
        // doesn't matter what this is — it's just used as a cache key.
        comms.mockNextBlockTrackerRequest();
        comms.mockRpcCall({
          request: requests[0],
          response: { result: mockResults[0] },
        });
        comms.mockRpcCall({
          request: requests[1],
          response: { result: mockResults[1] },
        });

        const results = await withNetworkClient(
          { providerType },
          ({ makeRpcCallsInSeries }) => makeRpcCallsInSeries(requests),
        );

        expect(results).toStrictEqual(mockResults);
      });
    });
  });
}
