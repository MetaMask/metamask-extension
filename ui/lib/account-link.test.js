import {
  MAINNET_CHAIN_ID,
  ROPSTEN_CHAIN_ID,
} from '../../shared/constants/network';
import getAccountLink from './account-link';

describe('Account link', () => {
  describe('getAccountLink', () => {
    it('should return the correct block explorer url for an account', () => {
      const tests = [
        {
          expected: 'https://etherscan.io/address/0xabcd',
          chainId: MAINNET_CHAIN_ID,
          address: '0xabcd',
        },
        {
          expected: 'https://ropsten.etherscan.io/address/0xdef0',
          chainId: ROPSTEN_CHAIN_ID,
          address: '0xdef0',
          rpcPrefs: {},
        },
        {
          // test handling of `blockExplorerUrl` for a custom RPC
          expected: 'https://block.explorer/address/0xabcd',
          chainId: '0x21',
          address: '0xabcd',
          rpcPrefs: {
            blockExplorerUrl: 'https://block.explorer',
          },
        },
        {
          // test handling of trailing `/` in `blockExplorerUrl` for a custom RPC
          expected: 'https://another.block.explorer/address/0xdef0',
          chainId: '0x1f',
          address: '0xdef0',
          rpcPrefs: {
            blockExplorerUrl: 'https://another.block.explorer/',
          },
        },
      ];

      tests.forEach(({ expected, address, chainId, rpcPrefs }) => {
        expect(getAccountLink(address, chainId, rpcPrefs)).toStrictEqual(
          expected,
        );
      });
    });
  });
});
