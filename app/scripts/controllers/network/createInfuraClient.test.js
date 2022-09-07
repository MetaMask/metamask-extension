/**
 * @jest-environment node
 */

import { withInfuraClient } from './provider-api-tests/helpers';
import {
  testsForRpcMethodAssumingNoBlockParam,
  testsForRpcMethodsThatCheckForBlockHashInResponse,
  testsForRpcMethodSupportingBlockParam,
} from './provider-api-tests/shared-tests';

describe('createInfuraClient', () => {
  describe('RPC methods supported by Infura', () => {
    // TODO: eth_accounts

    describe('eth_blockNumber', () => {
      testsForRpcMethodAssumingNoBlockParam('eth_blockNumber');
    });

    describe('eth_call', () => {
      testsForRpcMethodSupportingBlockParam('eth_call', {
        blockParamIndex: 1,
      });
    });

    describe('eth_chainId', () => {
      it('does not hit Infura, instead returning the chain id that maps to the Infura network, as a hex string', async () => {
        const chainId = await withInfuraClient(
          { network: 'ropsten' },
          ({ makeRpcCall }) => {
            return makeRpcCall({
              method: 'eth_chainId',
            });
          },
        );

        expect(chainId).toStrictEqual('0x3');
      });
    });

    // TODO: eth_coinbase

    describe('eth_estimateGas', () => {
      testsForRpcMethodAssumingNoBlockParam('eth_estimateGas');
    });

    // TODO: eth_feeHistory

    describe('eth_getBalance', () => {
      testsForRpcMethodSupportingBlockParam('eth_getBalance', {
        blockParamIndex: 1,
      });
    });

    describe('eth_gasPrice', () => {
      testsForRpcMethodAssumingNoBlockParam('eth_gasPrice');
    });

    describe('eth_getBlockByHash', () => {
      testsForRpcMethodAssumingNoBlockParam('eth_getBlockByHash');
    });

    describe('eth_getBlockByNumber', () => {
      testsForRpcMethodSupportingBlockParam('eth_getBlockByNumber', {
        blockParamIndex: 0,
      });
    });

    describe('eth_getBlockTransactionCountByHash', () => {
      testsForRpcMethodAssumingNoBlockParam(
        'eth_getBlockTransactionCountByHash',
      );
    });

    describe('eth_getBlockTransactionCountByNumber', () => {
      testsForRpcMethodAssumingNoBlockParam(
        'eth_getBlockTransactionCountByNumber',
      );
    });

    describe('eth_getCode', () => {
      testsForRpcMethodSupportingBlockParam('eth_getCode', {
        blockParamIndex: 1,
      });
    });

    // TODO: eth_getFilterChanges

    describe('eth_getFilterLogs', () => {
      testsForRpcMethodAssumingNoBlockParam('eth_getFilterLogs');
    });

    // TODO: eth_getLogs

    describe('eth_getStorageAt', () => {
      testsForRpcMethodSupportingBlockParam('eth_getStorageAt', {
        blockParamIndex: 2,
      });
    });

    describe('eth_getTransactionByBlockHashAndIndex', () => {
      testsForRpcMethodAssumingNoBlockParam(
        'eth_getTransactionByBlockHashAndIndex',
      );
    });

    describe('eth_getTransactionByBlockNumberAndIndex', () => {
      testsForRpcMethodAssumingNoBlockParam(
        'eth_getTransactionByBlockNumberAndIndex',
      );
    });

    describe('eth_getTransactionByHash', () => {
      testsForRpcMethodsThatCheckForBlockHashInResponse(
        'eth_getTransactionByHash',
      );
    });

    describe('eth_getTransactionCount', () => {
      testsForRpcMethodSupportingBlockParam('eth_getTransactionCount', {
        blockParamIndex: 1,
      });
    });

    describe('eth_getTransactionReceipt', () => {
      testsForRpcMethodsThatCheckForBlockHashInResponse(
        'eth_getTransactionReceipt',
      );
    });

    describe('eth_getUncleByBlockHashAndIndex', () => {
      testsForRpcMethodAssumingNoBlockParam('eth_getUncleByBlockHashAndIndex');
    });

    describe('eth_getUncleByBlockNumberAndIndex', () => {
      testsForRpcMethodAssumingNoBlockParam(
        'eth_getUncleByBlockNumberAndIndex',
      );
    });

    describe('eth_getUncleCountByBlockHash', () => {
      testsForRpcMethodAssumingNoBlockParam('eth_getUncleCountByBlockHash');
    });

    describe('eth_getUncleCountByBlockNumber', () => {
      testsForRpcMethodAssumingNoBlockParam('eth_getUncleCountByBlockNumber');
    });

    // TODO: eth_getWork

    // TODO: eth_hashrate

    // TODO: eth_mining

    // TODO: eth_newBlockFilter

    // TODO: eth_newFilter
    //
    // TODO: eth_newPendingTransactionFilter

    describe('eth_protocolVersion', () => {
      testsForRpcMethodAssumingNoBlockParam('eth_protocolVersion');
    });

    // TODO: eth_sendTransaction

    // TODO: eth_sendRawTransaction

    // TODO: eth_sign

    // TODO: eth_submitWork

    // TODO: eth_subscribe

    // TODO: eth_syncing

    // TODO: eth_uninstallFilter

    // TODO: eth_unsubscribe

    // TODO: net_listening

    // TODO: net_peerCount

    describe('net_version', () => {
      it('does not hit Infura, instead returning the chain id that maps to the Infura network, as a decimal string', async () => {
        const chainId = await withInfuraClient(
          { network: 'ropsten' },
          ({ makeRpcCall }) => {
            return makeRpcCall({
              method: 'net_version',
            });
          },
        );

        expect(chainId).toStrictEqual('3');
      });
    });

    // TODO: parity_nextNonce

    describe('web3_clientVersion', () => {
      testsForRpcMethodAssumingNoBlockParam('web3_clientVersion');
    });
  });

  // Official Ethereum JSON-RPC spec: <https://ethereum.github.io/execution-apis/api-documentation/>
  describe('RPC methods not supported by Infura but listed in the Ethereum JSON-RPC spec', () => {
    // TODO: debug_getRawHeader

    // TODO: debug_getRawBlock

    // TODO: debug_getRawTransaction

    // TODO: debug_getRawReceipts

    // TODO: debug_getBadBlocks

    // TODO: eth_createAccessList

    describe('eth_compileLLL', () => {
      testsForRpcMethodAssumingNoBlockParam('eth_compileLLL');
    });

    describe('eth_compileSerpent', () => {
      testsForRpcMethodAssumingNoBlockParam('eth_compileSerpent');
    });

    describe('eth_compileSolidity', () => {
      testsForRpcMethodAssumingNoBlockParam('eth_compileSolidity');
    });

    describe('eth_getCompilers', () => {
      testsForRpcMethodAssumingNoBlockParam('eth_getCompilers');
    });

    // TODO: eth_getProof

    // TODO: eth_maxPriorityFeePerGas

    // TODO: eth_submitHashrate

    describe('web3_sha3', () => {
      testsForRpcMethodAssumingNoBlockParam('web3_sha3');
    });
  });
});
