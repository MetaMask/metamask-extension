/* eslint-disable jest/require-top-level-describe, jest/no-export, jest/no-identical-title */

import { fill } from 'lodash';
import {
  withMockedCommunications,
  withClient,
  buildMockParamsWithoutBlockParamAt,
  buildMockParamsWithBlockParamAt,
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
function buildInfuraClientErrorWithReason(reason) {
  return new RegExp(
    `^InfuraProvider - cannot complete request. All retries exhausted\\..+${reason}`,
    'us',
  );
}

/**
 * Constructs an error message that the custom JSON-RPC client would produce in
 * the event that it has attempted to retry the request to the RPC endpoint and
 * has ultimately failed.
 *
 * @param rpcUrl - The URL of the RPC endpoint.
 * @param reason - The exact reason for failure.
 * @returns The error message.
 */
function buildJsonRpcClientErrorWithReason(rpcUrl, reason) {
  return new RegExp(`request to ${rpcUrl}/ failed, reason: ${reason}`, 'us');
}

/**
 * Constructs an error message that the custom JSON-RPC client would produce in
 * the event that it has timed out while attempting to forward the request on to
 * the RPC endpoint.
 *
 * @param method - The RPC method.
 * @returns The error message.
 */
function buildJsonRpcClientTimeoutError(method) {
  return new RegExp(
    `JsonRpcEngine: Response has no error or result for request:\\n[\\s\\S][\\s\\S]+${method}`,
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
        { name: 'eth_call', blockParamIndex: 1 },
        { name: 'eth_getBalance', blockParamIndex: 1 },
        { name: 'eth_getBlockByNumber', blockParamIndex: 0 },
        { name: 'eth_getCode', blockParamIndex: 1 },
        { name: 'eth_getStorageAt', blockParamIndex: 2 },
        { name: 'eth_getTransactionCount', blockParamIndex: 1 },
      ];
      supportingBlockParam.forEach(({ name, blockParamIndex }) => {
        describe(`method name: ${name}`, () => {
          testsForRpcMethodSupportingBlockParam(name, {
            providerType,
            blockParamIndex,
          });
        });
      });
    });

    describe('methods that assume there is no block param', () => {
      const assumingNoBlockParam = [
        'eth_blockNumber',
        'eth_estimateGas',
        'eth_getBlockByHash',

        // NOTE: eth_getBlockTransactionCountByNumber and
        // eth_getTransactionByBlockNumberAndIndex does take a block param at
        // the 0th index, but this is not handled by our cache middleware
        // currently
        'eth_getBlockTransactionCountByNumber',
        'eth_getTransactionByBlockNumberAndIndex',

        'eth_getBlockTransactionCountByHash',
        'eth_getFilterLogs',
        'eth_getTransactionByBlockHashAndIndex',
        'eth_getUncleByBlockHashAndIndex',
        'eth_getUncleByBlockNumberAndIndex',
        'eth_getUncleCountByBlockHash',
        'eth_getUncleCountByBlockNumber',
      ];
      assumingNoBlockParam.forEach((name) =>
        describe(`method name: ${name}`, () => {
          testsForRpcMethodAssumingNoBlockParam(name, { providerType });
        }),
      );
    });

    describe('methods with block hashes in their result', () => {
      const methodsWithBlockHashInResponse = [
        'eth_getTransactionByHash',
        'eth_getTransactionReceipt',
      ];
      methodsWithBlockHashInResponse.forEach((method) => {
        describe(`method name: ${method}`, () => {
          testsForRpcMethodsThatCheckForBlockHashInResponse(method, {
            providerType,
          });
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
        'eth_protocolVersion',
        'web3_clientVersion',
      ];
      assumingNoBlockParam.forEach((name) =>
        describe(`method name: ${name}`, () => {
          testsForRpcMethodAssumingNoBlockParam(name, { providerType });
        }),
      );
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
      const actualResult = await withClient(
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
 * @param additionalArgs.providerType - The type of provider being tested;
 * either `infura` or `custom` (default: "infura").
 */
export function testsForRpcMethodAssumingNoBlockParam(
  method,
  { providerType },
) {
  if (providerType !== 'infura' && providerType !== 'custom') {
    throw new Error(
      `providerType must be either "infura" or "custom", was "${providerType}" instead`,
    );
  }

  it(`does not hit the RPC endpoint more than once for identical requests`, async () => {
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

      const results = await withClient(
        { providerType },
        ({ makeRpcCallsInSeries }) => makeRpcCallsInSeries(requests),
      );

      expect(results).toStrictEqual([mockResults[0], mockResults[0]]);
    });
  });

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

      const results = await withClient({ providerType }, async (client) => {
        const firstResult = await client.makeRpcCall(requests[0]);
        // Proceed to the next iteration of the block tracker so that a new
        // block is fetched and the current block is updated.
        client.clock.runAll();
        const secondResult = await client.makeRpcCall(requests[1]);
        return [firstResult, secondResult];
      });

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

        const results = await withClient(
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

      const results = await withClient({ providerType }, async (client) => {
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
      });

      expect(results).toStrictEqual([
        mockResults[0],
        mockResults[0],
        mockResults[0],
      ]);
    });
  });

  it(`throws a custom error if the request to the RPC endpoint returns a 405 response`, async () => {
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
      const promiseForResult = withClient(
        { providerType },
        async ({ makeRpcCall }) => makeRpcCall(request),
      );

      await expect(promiseForResult).rejects.toThrow(
        'The method does not exist / is not available',
      );
    });
  });

  it('throws a custom error if the request to the RPC endpoint returns a 429 response', async () => {
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
      const promiseForResult = withClient(
        { providerType },
        async ({ makeRpcCall }) => makeRpcCall(request),
      );

      const errorMessage =
        providerType === 'infura'
          ? 'Request is being rate limited'
          : "Non-200 status code: '429'";
      await expect(promiseForResult).rejects.toThrow(errorMessage);
    });
  });

  it('throws a custom error if the request to the RPC endpoint returns a response that is not 405, 429, 503, or 504', async () => {
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
      const promiseForResult = withClient(
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
        const result = await withClient(
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
        const promiseForResult = withClient(
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
            ? buildInfuraClientErrorWithReason('Gateway timeout')
            : buildJsonRpcClientTimeoutError(method);
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

      const result = await withClient(
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

  it('causes a request to fail with a custom error if an "ETIMEDOUT" error is thrown while making the request to the RPC endpoint 5 times in a row', async () => {
    const customRpcUrl = 'http://example.com';

    await withMockedCommunications(
      { providerType, customRpcUrl },
      async (comms) => {
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
        const promiseForResult = withClient(
          { providerType, customRpcUrl },
          async ({ makeRpcCall, clock }) => {
            return await waitForPromiseToBeFulfilledAfterRunningAllTimers(
              makeRpcCall(request),
              clock,
            );
          },
        );

        let expectedErrorMessage;
        if (providerType === 'infura') {
          expectedErrorMessage = buildInfuraClientErrorWithReason(errorMessage);
        } else {
          expectedErrorMessage = buildJsonRpcClientTimeoutError(method);
        }

        await expect(promiseForResult).rejects.toThrow(expectedErrorMessage);
      },
    );
  });

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

        const result = await withClient(
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
            times: 5,
          });
          const promiseForResult = withClient(
            { providerType, customRpcUrl },
            async ({ makeRpcCall, clock }) => {
              return await waitForPromiseToBeFulfilledAfterRunningAllTimers(
                makeRpcCall(request),
                clock,
              );
            },
          );

          await expect(promiseForResult).rejects.toThrow(
            buildInfuraClientErrorWithReason(errorMessage),
          );
        },
      );
    });

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

        const result = await withClient(
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
            times: 5,
          });
          const promiseForResult = withClient(
            { providerType, customRpcUrl },
            async ({ makeRpcCall, clock }) => {
              return await waitForPromiseToBeFulfilledAfterRunningAllTimers(
                makeRpcCall(request),
                clock,
              );
            },
          );

          await expect(promiseForResult).rejects.toThrow(
            buildInfuraClientErrorWithReason(errorMessage),
          );
        },
      );
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
 * @param additionalArgs.providerType - The type of provider being tested;
 * either `infura` or `custom` (default: "infura").
 */
export function testsForRpcMethodsThatCheckForBlockHashInResponse(
  method,
  { providerType },
) {
  if (providerType !== 'infura' && providerType !== 'custom') {
    throw new Error(
      `providerType must be either "infura" or "custom", was "${providerType}" instead`,
    );
  }

  it(`does not hit the RPC endpoint more than once for identical requests and it has a valid blockHash`, async () => {
    const requests = [{ method }, { method }];
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

      const results = await withClient(
        { providerType },
        ({ makeRpcCallsInSeries }) => makeRpcCallsInSeries(requests),
      );

      expect(results).toStrictEqual([mockResults[0], mockResults[0]]);
    });
  });

  it(`hits the RPC endpoint and does not reuse the result of a previous request if the latest block number was updated since`, async () => {
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

      const results = await withClient({ providerType }, async (client) => {
        const firstResult = await client.makeRpcCall(requests[0]);
        // Proceed to the next iteration of the block tracker so that a new
        // block is fetched and the current block is updated.
        client.clock.runAll();
        const secondResult = await client.makeRpcCall(requests[1]);
        return [firstResult, secondResult];
      });

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

        const results = await withClient(
          { providerType },
          ({ makeRpcCallsInSeries }) => makeRpcCallsInSeries(requests),
        );

        // TODO: Does this work?
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

      const results = await withClient(
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

      const results = await withClient(
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

      const results = await withClient(
        { providerType },
        ({ makeRpcCallsInSeries }) => makeRpcCallsInSeries(requests),
      );

      expect(results).toStrictEqual(mockResults);
    });
  });

  it("refreshes the block tracker's current block if it is less than the block number that comes back in the response", async () => {
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

      await withClient(
        { providerType },
        async ({ makeRpcCall, blockTracker }) => {
          await makeRpcCall(request);
          expect(blockTracker.getCurrentBlock()).toStrictEqual('0x300');
        },
      );
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
 * @param additionalArgs.providerType - The type of provider being tested;
 * either `infura` or `custom` (default: "infura").
 */
/* eslint-disable-next-line jest/no-export */
export function testsForRpcMethodSupportingBlockParam(
  method,
  { blockParamIndex, providerType = 'infura' },
) {
  describe.each([
    ['given no block tag', 'none'],
    ['given a block tag of "latest"', 'latest', 'latest'],
  ])('%s', (_desc, blockParamType, blockParam) => {
    const params =
      blockParamType === 'none'
        ? buildMockParamsWithoutBlockParamAt(blockParamIndex)
        : buildMockParamsWithBlockParamAt(blockParamIndex, blockParam);

    it('does not hit the RPC endpoint more than once for identical requests', async () => {
      const requests = [
        { method, params },
        { method, params },
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

        const results = await withClient(
          { providerType },
          ({ makeRpcCallsInSeries }) => makeRpcCallsInSeries(requests),
        );

        expect(results).toStrictEqual([mockResults[0], mockResults[0]]);
      });
    });

    if (providerType === 'infura') {
      it('hits Infura and does not reuse the result of a previous request if the latest block number was updated since', async () => {
        const requests = [
          { method, params },
          { method, params },
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

          const results = await withClient({ providerType }, async (client) => {
            const firstResult = await client.makeRpcCall(requests[0]);
            // Proceed to the next iteration of the block tracker so that a
            // new block is fetched and the current block is updated.
            client.clock.runAll();
            const secondResult = await client.makeRpcCall(requests[1]);
            return [firstResult, secondResult];
          });

          expect(results).toStrictEqual(mockResults);
        });
      });
    }

    it.each([null, undefined, '\u003cnil\u003e'])(
      'does not reuse the result of a previous request if it was `%s`',
      async (emptyValue) => {
        const requests = [
          { method, params },
          { method, params },
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

          const results = await withClient(
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

        const results = await withClient({ providerType }, async (client) => {
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
        });

        expect(results).toStrictEqual([
          mockResults[0],
          mockResults[0],
          mockResults[0],
        ]);
      });
    });

    if (blockParamType === 'none') {
      it('throws a custom error if the request to the RPC endpoint returns a 405 response', async () => {
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
          const promiseForResult = withClient(
            { providerType },
            async ({ makeRpcCall }) => makeRpcCall(request),
          );

          await expect(promiseForResult).rejects.toThrow(
            'The method does not exist / is not available',
          );
        });
      });

      it('throws a custom error if the request to the RPC endpoint returns a 429 response', async () => {
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
          const promiseForResult = withClient(
            { providerType },
            async ({ makeRpcCall }) => makeRpcCall(request),
          );

          const msg =
            providerType === 'infura'
              ? 'Request is being rate limited'
              : "Non-200 status code: '429'";

          await expect(promiseForResult).rejects.toThrow(msg);
        });
      });

      it('throws a custom error if the request to the RPC endpoint returns a response that is not 405, 429, 503, or 504', async () => {
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
          const promiseForResult = withClient(
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
            const result = await withClient(
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
            const promiseForResult = withClient(
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
                ? buildInfuraClientErrorWithReason('Gateway timeout')
                : buildJsonRpcClientTimeoutError(method);
            await expect(promiseForResult).rejects.toThrow(err);
          });
        });
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

          const result = await withClient(
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

          const promiseForResult = withClient(
            { providerType },
            async ({ makeRpcCall, clock }) => {
              return await waitForPromiseToBeFulfilledAfterRunningAllTimers(
                makeRpcCall(request),
                clock,
              );
            },
          );

          const expectedErrorMessage =
            providerType === 'infura'
              ? buildInfuraClientErrorWithReason(errorMessage)
              : buildJsonRpcClientTimeoutError(method);
          await expect(promiseForResult).rejects.toThrow(expectedErrorMessage);
        });
      });

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

            const result = await withClient(
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
          const customRpcUrl = 'http://example.com';

          await withMockedCommunications(
            { providerType, customRpcUrl },
            async (comms) => {
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

              const promiseForResult = withClient(
                { providerType, customRpcUrl },
                async ({ makeRpcCall, clock }) => {
                  return await waitForPromiseToBeFulfilledAfterRunningAllTimers(
                    makeRpcCall(request),
                    clock,
                  );
                },
              );

              await expect(promiseForResult).rejects.toThrow(
                buildInfuraClientErrorWithReason(errorMessage),
              );
            },
          );
        });

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
            const result = await withClient(
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
                times: 5,
              });

              const promiseForResult = withClient(
                { providerType, customRpcUrl },
                async ({ makeRpcCall, clock }) => {
                  return await waitForPromiseToBeFulfilledAfterRunningAllTimers(
                    makeRpcCall(request),
                    clock,
                  );
                },
              );

              await expect(promiseForResult).rejects.toThrow(
                buildInfuraClientErrorWithReason(errorMessage),
              );
            },
          );
        });
      }
    }
  });

  describe.each([
    ['given a block tag of "earliest"', 'earliest', 'earliest'],
    ['given a block number', 'block number', '0x100'],
  ])('%s', (_desc, blockParamType, blockParam) => {
    const params = buildMockParamsWithBlockParamAt(blockParamIndex, blockParam);

    it(`does not hit the RPC endpoint more than once for identical requests`, async () => {
      const requests = [
        { method, params },
        { method, params },
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

        const results = await withClient(
          { providerType },
          ({ makeRpcCallsInSeries }) => makeRpcCallsInSeries(requests),
        );

        expect(results).toStrictEqual([mockResults[0], mockResults[0]]);
      });
    });

    it('reuses the result of a previous request even if the latest block number was updated since', async () => {
      const requests = [
        { method, params },
        { method, params },
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

        const results = await withClient({ providerType }, async (client) => {
          const firstResult = await client.makeRpcCall(requests[0]);
          // Proceed to the next iteration of the block tracker so that a
          // new block is fetched and the current block is updated.
          client.clock.runAll();
          const secondResult = await client.makeRpcCall(requests[1]);
          return [firstResult, secondResult];
        });

        expect(results).toStrictEqual([mockResults[0], mockResults[0]]);
      });
    });

    it.each([null, undefined, '\u003cnil\u003e'])(
      'does not reuse the result of a previous request if it was `%s`',
      async (emptyValue) => {
        const requests = [
          { method, params },
          { method, params },
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

          const results = await withClient(
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
            params: buildMockParamsWithBlockParamAt(
              blockParamIndex,
              blockParam,
            ),
          },
          {
            method,
            params: buildMockParamsWithBlockParamAt(blockParamIndex, '0x00'),
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

          const results = await withClient(
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
              params: buildMockParamsWithBlockParamAt(blockParamIndex, '0x100'),
            },
            {
              method,
              params: buildMockParamsWithBlockParamAt(blockParamIndex, '0x200'),
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

          const results = await withClient(
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
            params: buildMockParamsWithBlockParamAt(blockParamIndex, '0x100'),
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

          const result = await withClient({ providerType }, ({ makeRpcCall }) =>
            makeRpcCall(request),
          );

          expect(result).toStrictEqual('the result');
        });
      });

      it('makes an additional request to the RPC endpoint if the given block number is less than the latest block number', async () => {
        await withMockedCommunications({ providerType }, async (comms) => {
          const request = {
            method,
            params: buildMockParamsWithBlockParamAt(blockParamIndex, '0x50'),
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

          const result = await withClient({ providerType }, ({ makeRpcCall }) =>
            makeRpcCall(request),
          );

          expect(result).toStrictEqual('the result');
        });
      });
    }
  });

  describe('given a block tag of "pending"', () => {
    const params = buildMockParamsWithBlockParamAt(blockParamIndex, 'pending');

    it(`hits the RPC endpoint on all calls and does not cache anything`, async () => {
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

        const results = await withClient(
          { providerType },
          ({ makeRpcCallsInSeries }) => makeRpcCallsInSeries(requests),
        );

        expect(results).toStrictEqual(mockResults);
      });
    });
  });
}
