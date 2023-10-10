/**
 * @jest-environment node
 */
import ethSpec from 'execution-apis/openrpc.json';
import { withMockedCommunications, withClient } from './helpers';
import {
  testsForRpcMethodNotHandledByMiddleware,
  testsForRpcMethodAssumingNoBlockParam,
  testsForRpcMethodsThatCheckForBlockHashInResponse,
  testsForRpcMethodSupportingBlockParam,
} from './shared-tests';

// Ethereum JSON-RPC spec: <https://ethereum.github.io/execution-apis/api-documentation/>
// Infura documentation: <https://docs.infura.io/infura/networks/ethereum/json-rpc-methods>

['infura', 'custom'].forEach((providerType) => {
  describe(`included in eth json-rpc spec when using ${providerType} provider`, () => {
    describe('methods not handled by middleware', () => {
      const notHandledByMiddleware = ethSpec.methods.filter((m) =>
        [
          'eth_accounts',
          'eth_coinbase',
          'eth_feeHistory',
          'eth_getFilterChanges',
          'eth_getLogs',
          'eth_getWork',
          'eth_hashrate',
          'eth_mining',
          'eth_newBlockFilter',
          'eth_newFilter',
          'eth_newPendingTransactionFilter',
          'eth_sendRawTransaction',
          'eth_sendTransaction',
          'eth_sign',
          'eth_submitWork',
          'eth_syncing',
          'eth_uninstallFilter',
        ].includes(m.name),
      );
      notHandledByMiddleware.forEach((method) => {
        describe(`method name: ${method.name}`, () => {
          testsForRpcMethodNotHandledByMiddleware(method, { providerType });
        });
      });
    });

    describe('methods that have a param to specify Block', () => {
      const supportingBlockParam = ethSpec.methods.filter((m) =>
        [
          'eth_call',
          'eth_getBalance',
          'eth_getBlockByNumber',
          'eth_getCode',
          'eth_getStorageAt',
          'eth_getTransactionCount',
        ].includes(m.name),
      );
      supportingBlockParam.forEach((method) => {
        describe(`method name: ${method.name}`, () => {
          testsForRpcMethodSupportingBlockParam(method, { providerType });
        });
      });
    });

    describe('methods that assume there is no block param', () => {
      const assumingNoBlockParam = ethSpec.methods.filter((m) =>
        [
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
        ].includes(m.name),
      );
      assumingNoBlockParam.forEach((method) => {
        describe(`method name: ${method.name}`, () => {
          testsForRpcMethodAssumingNoBlockParam(method, { providerType });
        });
      });
    });

    describe('methods with blockhashes in their result', () => {
      const methodsWithBlockHashInResponse = ethSpec.methods.filter((m) =>
        ['eth_getTransactionByHash', 'eth_getTransactionReceipt'].includes(
          m.name,
        ),
      );

      methodsWithBlockHashInResponse.forEach((method) => {
        describe(`method name: ${method.name}`, () => {
          testsForRpcMethodsThatCheckForBlockHashInResponse(method);
        });
      });
    });

    describe('eth_chainId', () => {
      it('does not hit custom provider, instead returning the chain id that maps to the custom providers network, as a hex string', async () => {
        const chainId = await withClient(
          { network: 'goerli', type: providerType, chainId: '0x5' },
          ({ makeRpcCall }) => {
            return makeRpcCall({
              method: 'eth_chainId',
            });
          },
        );

        expect(chainId).toStrictEqual('0x5');
      });
    });
  });

  describe('not included in eth json-rpc spec', () => {
    describe('methods not handled by middleware', () => {
      const notHandledByMiddleware = [
        {
          name: 'eth_subscribe',
          params: [
            { name: 'eventTypes', schema: { type: 'array' } },
            { name: 'optionalParams', schema: { type: 'object' } },
          ],
          result: { name: 'SubsriptionResult', schema: { type: 'string' } },
        },
        {
          name: 'eth_unsubscribe',
          params: [{ name: 'subscriptionId', schema: { type: 'string' } }],
          result: { name: 'UnsubscribeSuccess', schema: { type: 'boolean' } },
        },
        {
          name: 'eth_listening',
          params: [],
          result: { name: 'EthIsListening', schema: { type: 'boolean' } },
        },
        {
          name: 'net_listening',
          params: [],
          result: { name: 'NetIsListening', schema: { type: 'boolean' } },
        },
        {
          name: 'net_peerCount',
          params: [],
          result: { name: 'NetIsListening', schema: { type: 'boolean' } },
        },
        {
          name: 'net_peerCount',
          params: [],
          result: {
            name: 'quantity',
            schema: { type: 'string' },
          },
        },
        {
          name: 'parity_nextNonce',
          params: [{ name: 'address', schema: { type: 'string' } }],
          result: { name: 'nextNonce', schema: { type: 'string' } },
        },
        {
          name: 'custom_rpc_method',
          params: [{ name: 'anything', schema: { type: 'string' } }],
          result: { name: 'anyResult', schema: { type: 'string' } },
        },
      ];
      notHandledByMiddleware.forEach((method) => {
        describe(`method name: ${method.name}`, () => {
          testsForRpcMethodNotHandledByMiddleware(method, { providerType });
        });
      });
    });

    describe('methods that assume there is no block param', () => {
      const assumingNoBlockParam = [
        {
          name: 'eth_protocolVersion',
          params: [],
          result: { name: 'ProtocolVersionResult', schema: { type: 'string' } },
        },
        {
          name: 'web3_clientVersion',
          params: [],
          result: { name: 'ClientVersionResult', schema: { type: 'string' } },
        },
      ];
      assumingNoBlockParam.forEach((method) => {
        describe(`method name: ${method.name}`, () => {
          testsForRpcMethodAssumingNoBlockParam(method, { providerType });
        });
      });
    });

    it(`net_version does not hit ${providerType} provider, instead returning the networkId that maps to the rpc network, as a decimal string`, async () => {
      const result = '5';

      await withMockedCommunications({ type: providerType }, async (comms) => {
        if (providerType === 'custom') {
          comms.mockRpcCall({
            request: { method: 'net_version' },
            response: { result },
          });
        }

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
        expect(networkId).toStrictEqual(result);
      });
    });
  });
});
