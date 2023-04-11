/* eslint-disable jest/require-top-level-describe, jest/no-export, jest/no-identical-title */

import { testsForRpcMethodsThatCheckForBlockHashInResponse } from './block-hash-in-response';
import { testsForRpcMethodSupportingBlockParam } from './block-param';
import { withMockedCommunications, withNetworkClient } from './helpers';
import { testsForRpcMethodAssumingNoBlockParam } from './no-block-param';
import { testsForRpcMethodNotHandledByMiddleware } from './not-handled-by-middleware';

/**
 * Constructs an error message that the Infura client would produce in the event
 * that it has attempted to retry the request to Infura and has failed.
 *
 * @param reason - The exact reason for failure.
 * @returns The error message.
 */
export function buildInfuraClientRetriesExhaustedErrorMessage(reason) {
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
export function buildJsonRpcEngineEmptyResponseErrorMessage(method) {
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
export function buildFetchFailedErrorMessage(url, reason) {
  return new RegExp(
    `^request to ${url}(/[^/ ]*)+ failed, reason: ${reason}`,
    'us',
  );
}

/**
 * Defines tests that are common to both the Infura and JSON-RPC network client.
 *
 * @param providerType - The type of provider being tested, which determines
 * which suite of middleware is being tested. If `infura`, then the middleware
 * exposed by `createInfuraClient` is tested; if `custom`, then the middleware
 * exposed by `createJsonRpcClient` will be tested.
 */
export function testsForProviderType(providerType) {
  // Ethereum JSON-RPC spec: <https://ethereum.github.io/execution-apis/api-documentation/>
  // Infura documentation: <https://docs.infura.io/infura/networks/ethereum/json-rpc-methods>

  describe('methods included in the Ethereum JSON-RPC spec', () => {
    describe('methods not handled by middleware', () => {
      const notHandledByMiddleware = [
        // This list is presented in the same order as in the network client
        // tests on the core side.

        { name: 'eth_newFilter', numberOfParameters: 1 },
        { name: 'eth_getFilterChanges', numberOfParameters: 1 },
        { name: 'eth_newBlockFilter', numberOfParameters: 0 },
        { name: 'eth_newPendingTransactionFilter', numberOfParameters: 0 },
        { name: 'eth_uninstallFilter', numberOfParameters: 1 },

        { name: 'eth_sendRawTransaction', numberOfParameters: 1 },
        { name: 'eth_sendTransaction', numberOfParameters: 1 },
        { name: 'eth_sign', numberOfParameters: 2 },

        { name: 'eth_createAccessList', numberOfParameters: 2 },
        { name: 'eth_getLogs', numberOfParameters: 1 },
        { name: 'eth_getProof', numberOfParameters: 3 },
        { name: 'eth_getWork', numberOfParameters: 0 },
        { name: 'eth_maxPriorityFeePerGas', numberOfParameters: 0 },
        { name: 'eth_submitHashRate', numberOfParameters: 2 },
        { name: 'eth_submitWork', numberOfParameters: 3 },
        { name: 'eth_syncing', numberOfParameters: 0 },
        { name: 'eth_feeHistory', numberOfParameters: 3 },
        { name: 'debug_getRawHeader', numberOfParameters: 1 },
        { name: 'debug_getRawBlock', numberOfParameters: 1 },
        { name: 'debug_getRawTransaction', numberOfParameters: 1 },
        { name: 'debug_getRawReceipts', numberOfParameters: 1 },
        { name: 'debug_getBadBlocks', numberOfParameters: 0 },

        { name: 'eth_accounts', numberOfParameters: 0 },
        { name: 'eth_coinbase', numberOfParameters: 0 },
        { name: 'eth_hashrate', numberOfParameters: 0 },
        { name: 'eth_mining', numberOfParameters: 0 },

        { name: 'eth_signTransaction', numberOfParameters: 1 },
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

    describe('methods that assume there is no block param', () => {
      const assumingNoBlockParam = [
        { name: 'eth_getFilterLogs', numberOfParameters: 1 },
        { name: 'eth_blockNumber', numberOfParameters: 0 },
        { name: 'eth_estimateGas', numberOfParameters: 2 },
        { name: 'eth_gasPrice', numberOfParameters: 0 },
        { name: 'eth_getBlockByHash', numberOfParameters: 2 },
        {
          name: 'eth_getBlockTransactionCountByHash',
          numberOfParameters: 1,
        },
        {
          name: 'eth_getTransactionByBlockHashAndIndex',
          numberOfParameters: 2,
        },
        { name: 'eth_getUncleByBlockHashAndIndex', numberOfParameters: 2 },
        { name: 'eth_getUncleCountByBlockHash', numberOfParameters: 1 },
      ];
      const blockParamIgnored = [
        { name: 'eth_getUncleCountByBlockNumber', numberOfParameters: 1 },
        { name: 'eth_getUncleByBlockNumberAndIndex', numberOfParameters: 2 },
        {
          name: 'eth_getTransactionByBlockNumberAndIndex',
          numberOfParameters: 2,
        },
        {
          name: 'eth_getBlockTransactionCountByNumber',
          numberOfParameters: 1,
        },
      ];
      assumingNoBlockParam
        .concat(blockParamIgnored)
        .forEach(({ name, numberOfParameters }) =>
          describe(`method name: ${name}`, () => {
            testsForRpcMethodAssumingNoBlockParam(name, {
              providerType,
              numberOfParameters,
            });
          }),
        );
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
        // This list is presented in the same order as in the network client
        // tests on the core side.

        { name: 'net_listening', numberOfParameters: 0 },
        // TODO: Methods to add back when we add testing for subscribe middleware
        // { name: 'eth_subscribe', numberOfParameters: 1 },
        // { name: 'eth_unsubscribe', numberOfParameters: 1 },
        { name: 'custom_rpc_method', numberOfParameters: 1 },
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
        { name: 'web3_clientVersion', numberOfParameters: 0 },
        { name: 'eth_protocolVersion', numberOfParameters: 0 },
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
