import assert from 'assert';
import {
  MAINNET_CHAIN_ID,
  MAINNET_NETWORK_ID,
  ROPSTEN_CHAIN_ID,
  ROPSTEN_NETWORK_ID,
} from '../../constants/network';
import { getBlockExplorerUrlForTx } from '../transaction.utils';

const tests = [
  {
    expected: 'https://etherscan.io/tx/0xabcd',
    transaction: {
      metamaskNetworkId: MAINNET_NETWORK_ID,
      hash: '0xabcd',
    },
  },
  {
    expected: 'https://ropsten.etherscan.io/tx/0xdef0',
    transaction: {
      metamaskNetworkId: ROPSTEN_NETWORK_ID,
      hash: '0xdef0',
    },
    rpcPrefs: {},
  },
  {
    // test handling of `blockExplorerUrl` for a custom RPC
    expected: 'https://block.explorer/tx/0xabcd',
    transaction: {
      metamaskNetworkId: '31',
      hash: '0xabcd',
    },
    rpcPrefs: {
      blockExplorerUrl: 'https://block.explorer',
    },
  },
  {
    // test handling of trailing `/` in `blockExplorerUrl` for a custom RPC
    expected: 'https://another.block.explorer/tx/0xdef0',
    transaction: {
      networkId: '33',
      hash: '0xdef0',
    },
    rpcPrefs: {
      blockExplorerUrl: 'https://another.block.explorer/',
    },
  },
  {
    expected: 'https://etherscan.io/tx/0xabcd',
    transaction: {
      chainId: MAINNET_CHAIN_ID,
      hash: '0xabcd',
    },
  },
  {
    expected: 'https://ropsten.etherscan.io/tx/0xdef0',
    transaction: {
      chainId: ROPSTEN_CHAIN_ID,
      hash: '0xdef0',
    },
    rpcPrefs: {},
  },
  {
    // test handling of `blockExplorerUrl` for a custom RPC
    expected: 'https://block.explorer/tx/0xabcd',
    transaction: {
      chainId: '0x1f',
      hash: '0xabcd',
    },
    rpcPrefs: {
      blockExplorerUrl: 'https://block.explorer',
    },
  },
  {
    // test handling of trailing `/` in `blockExplorerUrl` for a custom RPC
    expected: 'https://another.block.explorer/tx/0xdef0',
    transaction: {
      chainId: '0x21',
      hash: '0xdef0',
    },
    rpcPrefs: {
      blockExplorerUrl: 'https://another.block.explorer/',
    },
  },
];

describe('getBlockExplorerUrlForTx', function () {
  tests.forEach((test) => {
    it(`should return '${test.expected}' for transaction with hash: '${test.transaction.hash}'`, function () {
      assert.strictEqual(
        getBlockExplorerUrlForTx(test.transaction, test.rpcPrefs),
        test.expected,
      );
    });
  });
});
