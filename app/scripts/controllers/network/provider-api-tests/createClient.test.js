/**
 * @jest-environment node
 */
import { withMockedCommunications, withClient } from './helpers';
import {
  testsForRpcMethodNotHandledByMiddleware,
  testsForRpcMethodAssumingNoBlockParam,
  testsForRpcMethodsThatCheckForBlockHashInResponse,
  testsForRpcMethodSupportingBlockParam,
} from './shared-tests';

['infura', 'custom'].forEach((providerType) => {
  describe(`${providerType} provider`, () => {
    // Ethereum JSON-RPC spec: <https://ethereum.github.io/execution-apis/api-documentation/>
    // Infura documentation: <https://docs.infura.io/infura/networks/ethereum/json-rpc-methods>

    const notHandledByMiddleware = [
      { name: 'custom_rpc_method', numberOfParameters: 1 },
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
      { name: 'eth_subscribe', numberOfParameters: 1 },
      { name: 'eth_unsubscribe', numberOfParameters: 1 },
      { name: 'net_listening', numberOfParameters: 0 },
      { name: 'net_peerCount', numberOfParameters: 0 },
      { name: 'parity_nextNonce', numberOfParameters: 1 },
    ];

    notHandledByMiddleware.forEach(({ name, numberOfParameters }) => {
      describe(`method name: ${name}`, () => {
        testsForRpcMethodNotHandledByMiddleware(name, {
          numberOfParameters,
          providerType,
        });
      });
    });

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
          blockParamIndex,
          providerType,
        });
      });
    });

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
      'eth_protocolVersion',
      'web3_clientVersion',
    ];

    assumingNoBlockParam.forEach((name) =>
      describe(`method name: ${name}`, () => {
        testsForRpcMethodAssumingNoBlockParam(name, { providerType });
      }),
    );

    describe('eth_chainId', () => {
      it('does not hit custom provider, instead returning the chain id that maps to the custom providers network, as a hex string', async () => {
        const chainId = await withClient(
          { network: 'goerli', type: providerType },
          ({ makeRpcCall }) => {
            return makeRpcCall({
              method: 'eth_chainId',
            });
          },
        );

        expect(chainId).toStrictEqual('0x5');
      });
    });

    describe('eth_getTransactionByHash', () => {
      const method = 'eth_getTransactionByHash';

      testsForRpcMethodsThatCheckForBlockHashInResponse(method);

      it("refreshes the block tracker's current block if it is less than the block number that comes back in the response", async () => {
        await withMockedCommunications(
          { type: providerType },
          async (comms) => {
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
              { type: providerType },
              async ({ makeRpcCall, blockTracker }) => {
                await makeRpcCall(request);
                expect(blockTracker.getCurrentBlock()).toStrictEqual('0x300');
              },
            );
          },
        );
      });
    });

    describe('eth_getTransactionReceipt', () => {
      const method = 'eth_getTransactionReceipt';

      testsForRpcMethodsThatCheckForBlockHashInResponse(method);

      it("refreshes the block tracker's current block if it is less than the block number that comes back in the response", async () => {
        await withMockedCommunications(
          { type: providerType },
          async (comms) => {
            const request = { method };

            comms.mockNextBlockTrackerRequest({ blockNumber: '0x100' });
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
              { type: providerType },
              async ({ makeRpcCall, blockTracker }) => {
                await makeRpcCall(request);
                expect(blockTracker.getCurrentBlock()).toStrictEqual('0x300');
              },
            );
          },
        );
      });
    });

    describe('net_version and eth_chainId', () => {
      it(`does not hit ${providerType} provider, instead returning the networkId that maps to the rpc network, as a decimal string`, async () => {
        const networkId = await withClient(
          {
            network: 'goerli',
            type: providerType,
          },
          ({ makeRpcCall }) => {
            return makeRpcCall({
              method: 'net_version',
            });
          },
        );
        const result = providerType === 'infura' ? '5' : '0x5'; // bad
        expect(networkId).toStrictEqual(result);
      });

      it(`does not hit ${providerType} provider, instead returning the chainId that maps to the rpc network, as a hex string`, async () => {
        const networkId = await withClient(
          {
            network: 'goerli',
            type: providerType,
          },
          ({ makeRpcCall }) => {
            return makeRpcCall({
              method: 'eth_chainId',
            });
          },
        );
        expect(networkId).toStrictEqual('0x5');
      });
    });
  });
});
