/**
 * @jest-environment node
 */

import { withInfuraClient } from './provider-api-tests/helpers';
import {
  testsForRpcMethodThatDoesNotSupportParams,
  testsForRpcMethodsThatCheckForBlockHashInResponse,
  testsForRpcMethodThatSupportsMultipleParams,
} from './provider-api-tests/shared-tests';

describe('createInfuraClient', () => {
  // The first time an RPC method is requested, the latest block number is
  // pulled from the block tracker, the RPC method is delegated to Infura, and
  // the result is cached under that block number, as long as the result is
  // "non-empty". The next time the same request takes place, Infura is not hit,
  // and the result is pulled from the cache.
  //
  // For most RPC methods here, a "non-empty" result is a result that is not
  // null, undefined, or a non-standard "nil" value that geth produces.
  //
  // Some RPC methods are cacheable. Consult the definitive list of cacheable
  // RPC methods in `cacheTypeForPayload` within `eth-json-rpc-middleware`.

  describe('when the RPC method is eth_chainId', () => {
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

  describe('when the RPC method is net_version', () => {
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

  // == RPC methods that do not support params
  //
  // For `eth_getTransactionByHash` and `eth_getTransactionReceipt`, a
  // "non-empty" result is not only one that is not null, undefined, or a
  // geth-specific "nil", but additionally a result that has a `blockHash` that
  // is not 0x0.

  describe('eth_blockNumber', () => {
    testsForRpcMethodThatDoesNotSupportParams('eth_blockNumber');
  });

  describe('eth_compileLLL', () => {
    testsForRpcMethodThatDoesNotSupportParams('eth_compileLLL');
  });

  describe('eth_compileSerpent', () => {
    testsForRpcMethodThatDoesNotSupportParams('eth_compileSerpent');
  });

  describe('eth_compileSolidity', () => {
    testsForRpcMethodThatDoesNotSupportParams('eth_compileSolidity');
  });

  describe('eth_estimateGas', () => {
    testsForRpcMethodThatDoesNotSupportParams('eth_estimateGas');
  });

  describe('eth_gasPrice', () => {
    testsForRpcMethodThatDoesNotSupportParams('eth_gasPrice');
  });

  describe('eth_getBlockByHash', () => {
    testsForRpcMethodThatDoesNotSupportParams('eth_getBlockByHash');
  });

  describe('eth_getBlockTransactionCountByHash', () => {
    testsForRpcMethodThatDoesNotSupportParams(
      'eth_getBlockTransactionCountByHash',
    );
  });

  describe('eth_getBlockTransactionCountByNumber', () => {
    testsForRpcMethodThatDoesNotSupportParams(
      'eth_getBlockTransactionCountByNumber',
    );
  });

  describe('eth_getCompilers', () => {
    testsForRpcMethodThatDoesNotSupportParams('eth_getCompilers');
  });

  describe('eth_getFilterLogs', () => {
    testsForRpcMethodThatDoesNotSupportParams('eth_getFilterLogs');
  });

  describe('eth_getTransactionByBlockHashAndIndex', () => {
    testsForRpcMethodThatDoesNotSupportParams(
      'eth_getTransactionByBlockHashAndIndex',
    );
  });

  describe('eth_getTransactionByBlockNumberAndIndex', () => {
    testsForRpcMethodThatDoesNotSupportParams(
      'eth_getTransactionByBlockNumberAndIndex',
    );
  });

  describe('eth_getTransactionByHash', () => {
    testsForRpcMethodsThatCheckForBlockHashInResponse(
      'eth_getTransactionByHash',
    );
  });

  describe('eth_getTransactionReceipt', () => {
    testsForRpcMethodsThatCheckForBlockHashInResponse(
      'eth_getTransactionReceipt',
    );
  });

  describe('eth_getUncleByBlockHashAndIndex', () => {
    testsForRpcMethodThatDoesNotSupportParams(
      'eth_getUncleByBlockHashAndIndex',
    );
  });

  describe('eth_getUncleByBlockNumberAndIndex', () => {
    testsForRpcMethodThatDoesNotSupportParams(
      'eth_getUncleByBlockNumberAndIndex',
    );
  });

  describe('eth_getUncleCountByBlockHash', () => {
    testsForRpcMethodThatDoesNotSupportParams('eth_getUncleCountByBlockHash');
  });

  describe('eth_getUncleCountByBlockNumber', () => {
    testsForRpcMethodThatDoesNotSupportParams('eth_getUncleCountByBlockNumber');
  });

  describe('eth_protocolVersion', () => {
    testsForRpcMethodThatDoesNotSupportParams('eth_protocolVersion');
  });

  describe('shh_version', () => {
    testsForRpcMethodThatDoesNotSupportParams('shh_version');
  });

  describe('test_blockCache', () => {
    testsForRpcMethodThatDoesNotSupportParams('test_blockCache');
  });

  describe('test_forkCache', () => {
    testsForRpcMethodThatDoesNotSupportParams('test_forkCache');
  });

  describe('test_permaCache', () => {
    testsForRpcMethodThatDoesNotSupportParams('test_permaCache');
  });

  describe('web3_clientVersion', () => {
    testsForRpcMethodThatDoesNotSupportParams('web3_clientVersion');
  });

  describe('web3_sha3', () => {
    testsForRpcMethodThatDoesNotSupportParams('web3_sha3');
  });

  // == RPC methods that support multiple params (including a "block" param)
  //
  // RPC methods in this category take a non-empty `params` array, and more
  // importantly, one of these items can specify which block the method applies
  // to. This block param may either be a tag ("earliest", "latest", or
  // "pending"), or a specific block number; or this param may not be
  // provided altogether, in which case it defaults to "latest". Also,
  // "earliest" is just a synonym for "0x00".
  //
  // The fact that these methods support arguments affects the caching strategy,
  // because if two requests are made with the same method but with different
  // arguments, then they will be cached separately. Also, the block param
  // changes the caching strategy slightly: if "pending" is specified, then the
  // request is never cached.

  describe('eth_getBlockByNumber', () => {
    testsForRpcMethodThatSupportsMultipleParams('eth_getBlockByNumber', {
      numberOfParams: 0,
    });
  });

  describe('eth_getBalance', () => {
    testsForRpcMethodThatSupportsMultipleParams('eth_getBalance', {
      numberOfParams: 1,
    });
  });

  describe('eth_getCode', () => {
    testsForRpcMethodThatSupportsMultipleParams('eth_getCode', {
      numberOfParams: 1,
    });
  });

  describe('eth_getTransactionCount', () => {
    testsForRpcMethodThatSupportsMultipleParams('eth_getTransactionCount', {
      numberOfParams: 1,
    });
  });

  describe('eth_call', () => {
    testsForRpcMethodThatSupportsMultipleParams('eth_call', {
      numberOfParams: 1,
    });
  });

  describe('eth_getStorageAt', () => {
    testsForRpcMethodThatSupportsMultipleParams('eth_getStorageAt', {
      numberOfParams: 2,
    });
  });
});
