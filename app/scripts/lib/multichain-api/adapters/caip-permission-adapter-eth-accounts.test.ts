import { Caip25CaveatValue } from '../caip25permissions';
import {
  getEthAccounts,
  setEthAccounts,
} from './caip-permission-adapter-eth-accounts';

describe('CAIP-25 eth_accounts adapters', () => {
  describe('getEthAccounts', () => {
    it('returns the unique set of EIP155 accounts from the CAIP-25 caveat value', () => {
      const ethAccounts = getEthAccounts({
        requiredScopes: {
          'eip155:1': {
            methods: [],
            notifications: [],
            accounts: ['eip155:1:0x1', 'eip155:1:0x2'],
          },
          'eip155:5': {
            methods: [],
            notifications: [],
            accounts: ['eip155:5:0x2', 'eip155:1:0x3'],
          },
          'bip122:000000000019d6689c085ae165831e93': {
            methods: [],
            notifications: [],
            accounts: [
              'bip122:000000000019d6689c085ae165831e93:128Lkh3S7CkDTBZ8W7BbpsN3YYizJMp8p6',
            ],
          },
        },
        optionalScopes: {
          'eip155:1': {
            methods: [],
            notifications: [],
            accounts: ['eip155:1:0x1', 'eip155:1:0x4'],
          },
          'eip155:10': {
            methods: [],
            notifications: [],
          },
          'eip155:100': {
            methods: [],
            notifications: [],
            accounts: ['eip155:100:0x100'],
          },
          'wallet:eip155': {
            methods: [],
            notifications: [],
            accounts: ['wallet:eip155:0x5'],
          },
        },
        isMultichainOrigin: false,
      });

      expect(ethAccounts).toStrictEqual([
        '0x1',
        '0x2',
        '0x4',
        '0x3',
        '0x100',
        '0x5',
      ]);
    });
  });

  describe('setEthAccounts', () => {
    it('returns a CAIP-25 caveat value with all EIP-155 scopeObject.accounts set to CAIP-10 account addresses formed from the accounts param', () => {
      const input: Caip25CaveatValue = {
        requiredScopes: {
          'eip155:1': {
            methods: [],
            notifications: [],
            accounts: ['eip155:1:0x1', 'eip155:1:0x2'],
          },
          'eip155:5': {
            methods: [],
            notifications: [],
            accounts: ['eip155:5:0x2', 'eip155:1:0x3'],
          },
          'bip122:000000000019d6689c085ae165831e93': {
            methods: [],
            notifications: [],
            accounts: [
              'bip122:000000000019d6689c085ae165831e93:128Lkh3S7CkDTBZ8W7BbpsN3YYizJMp8p6',
            ],
          },
        },
        optionalScopes: {
          'eip155:1': {
            methods: [],
            notifications: [],
            accounts: ['eip155:1:0x1', 'eip155:1:0x4'],
          },
          'eip155:10': {
            methods: [],
            notifications: [],
          },
          'eip155:100': {
            methods: [],
            notifications: [],
            accounts: ['eip155:100:0x100'],
          },
          'wallet:eip155': {
            methods: [],
            notifications: [],
          },
        },
        isMultichainOrigin: false,
      };

      const result = setEthAccounts(input, ['0x1', '0x2', '0x3']);
      expect(result).toStrictEqual({
        requiredScopes: {
          'eip155:1': {
            methods: [],
            notifications: [],
            accounts: ['eip155:1:0x1', 'eip155:1:0x2', 'eip155:1:0x3'],
          },
          'eip155:5': {
            methods: [],
            notifications: [],
            accounts: ['eip155:5:0x1', 'eip155:5:0x2', 'eip155:5:0x3'],
          },
          'bip122:000000000019d6689c085ae165831e93': {
            methods: [],
            notifications: [],
            accounts: [
              'bip122:000000000019d6689c085ae165831e93:128Lkh3S7CkDTBZ8W7BbpsN3YYizJMp8p6',
            ],
          },
        },
        optionalScopes: {
          'eip155:1': {
            methods: [],
            notifications: [],
            accounts: ['eip155:1:0x1', 'eip155:1:0x2', 'eip155:1:0x3'],
          },
          'eip155:10': {
            methods: [],
            notifications: [],
            accounts: ['eip155:10:0x1', 'eip155:10:0x2', 'eip155:10:0x3'],
          },
          'eip155:100': {
            methods: [],
            notifications: [],
            accounts: ['eip155:100:0x1', 'eip155:100:0x2', 'eip155:100:0x3'],
          },
          'wallet:eip155': {
            methods: [],
            notifications: [],
            accounts: [
              'wallet:eip155:0x1',
              'wallet:eip155:0x2',
              'wallet:eip155:0x3',
            ],
          },
        },
        isMultichainOrigin: false,
      });
    });

    it('does not modify the input CAIP-25 caveat value object in place', () => {
      const input: Caip25CaveatValue = {
        requiredScopes: {
          'eip155:1': {
            methods: [],
            notifications: [],
            accounts: [],
          },
        },
        optionalScopes: {},
        isMultichainOrigin: false,
      };

      const result = setEthAccounts(input, ['0x1', '0x2', '0x3']);
      expect(input).toStrictEqual({
        requiredScopes: {
          'eip155:1': {
            methods: [],
            notifications: [],
            accounts: [],
          },
        },
        optionalScopes: {},
        isMultichainOrigin: false,
      });
      expect(input).not.toStrictEqual(result);
    });
  });
});
