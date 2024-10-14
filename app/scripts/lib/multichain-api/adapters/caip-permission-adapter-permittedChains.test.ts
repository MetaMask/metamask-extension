import { Caip25CaveatValue } from '../caip25permissions';
import { KnownNotifications, KnownRpcMethods } from '../scope';
import {
  addPermittedEthChainId,
  getPermittedEthChainIds,
  setPermittedEthChainIds,
} from './caip-permission-adapter-permittedChains';

describe('CAIP-25 permittedChains adapters', () => {
  describe('getPermittedEthChainIds', () => {
    it('returns the unique set of EIP155 chainIds in hexadecimal format from the CAIP-25 caveat value', () => {
      const ethChainIds = getPermittedEthChainIds({
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
        },
        isMultichainOrigin: false,
      });

      expect(ethChainIds).toStrictEqual(['0x1', '0x5', '0xa', '0x64']);
    });
  });

  describe('addPermittedEthChainId', () => {
    it('adds an optional scope for the chainId if it does not already exist in required or optional scopes', () => {
      const result = addPermittedEthChainId(
        {
          requiredScopes: {
            'eip155:1': {
              methods: [],
              notifications: [],
              accounts: ['eip155:1:0x1', 'eip155:1:0x2'],
            },
          },
          optionalScopes: {
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
        },
        '0x65',
      );

      expect(result).toStrictEqual({
        requiredScopes: {
          'eip155:1': {
            methods: [],
            notifications: [],
            accounts: ['eip155:1:0x1', 'eip155:1:0x2'],
          },
        },
        optionalScopes: {
          'eip155:100': {
            methods: [],
            notifications: [],
            accounts: ['eip155:100:0x100'],
          },
          'eip155:101': {
            methods: KnownRpcMethods.eip155,
            notifications: KnownNotifications.eip155,
            accounts: [],
          },
          'wallet:eip155': {
            methods: [],
            notifications: [],
          },
        },
        isMultichainOrigin: false,
      });
    });

    it('adds an optional scope for "wallet:eip155" if it does not already exist in the optional scopes', () => {
      const result = addPermittedEthChainId(
        {
          requiredScopes: {
            'eip155:1': {
              methods: [],
              notifications: [],
              accounts: ['eip155:1:0x1', 'eip155:1:0x2'],
            },
          },
          optionalScopes: {
            'eip155:100': {
              methods: [],
              notifications: [],
              accounts: ['eip155:100:0x100'],
            },
          },
          isMultichainOrigin: false,
        },
        '0x65',
      );

      expect(result).toStrictEqual({
        requiredScopes: {
          'eip155:1': {
            methods: [],
            notifications: [],
            accounts: ['eip155:1:0x1', 'eip155:1:0x2'],
          },
        },
        optionalScopes: {
          'eip155:100': {
            methods: [],
            notifications: [],
            accounts: ['eip155:100:0x100'],
          },
          'eip155:101': {
            methods: KnownRpcMethods.eip155,
            notifications: KnownNotifications.eip155,
            accounts: [],
          },
          'wallet:eip155': {
            methods: [],
            notifications: [],
          },
        },
        isMultichainOrigin: false,
      });
    });

    it('does not modify the input CAIP-25 caveat value object', () => {
      const input: Caip25CaveatValue = {
        requiredScopes: {
          'eip155:1': {
            methods: [],
            notifications: [],
            accounts: ['eip155:1:0x1', 'eip155:1:0x2'],
          },
        },
        optionalScopes: {},
        isMultichainOrigin: false,
      };

      const result = addPermittedEthChainId(input, '0x65');

      expect(input).toStrictEqual({
        requiredScopes: {
          'eip155:1': {
            methods: [],
            notifications: [],
            accounts: ['eip155:1:0x1', 'eip155:1:0x2'],
          },
        },
        optionalScopes: {},
        isMultichainOrigin: false,
      });
      expect(input).not.toStrictEqual(result);
    });

    it('does not add an optional scope for the chainId if already exists in the required scopes', () => {
      const input: Caip25CaveatValue = {
        requiredScopes: {
          'eip155:1': {
            methods: [],
            notifications: [],
            accounts: ['eip155:1:0x1', 'eip155:1:0x2'],
          },
        },
        optionalScopes: {
          'eip155:100': {
            methods: [],
            notifications: [],
            accounts: ['eip155:100:0x100'],
          },
        },
        isMultichainOrigin: false,
      };
      const result = addPermittedEthChainId(input, '0x1');

      expect(result).toStrictEqual(input);
    });

    it('does not add an optional scope for the chainId if already exists in the optional scopes', () => {
      const input: Caip25CaveatValue = {
        requiredScopes: {
          'eip155:1': {
            methods: [],
            notifications: [],
            accounts: ['eip155:1:0x1', 'eip155:1:0x2'],
          },
        },
        optionalScopes: {
          'eip155:100': {
            methods: [],
            notifications: [],
            accounts: ['eip155:100:0x100'],
          },
        },
        isMultichainOrigin: false,
      };
      const result = addPermittedEthChainId(input, '0x64'); // 0x64 === 100

      expect(result).toStrictEqual(input);
    });
  });

  describe('setPermittedEthChainIds', () => {
    it('returns a CAIP-25 caveat value with EIP-155 scopes missing from the chainIds array removed', () => {
      const result = setPermittedEthChainIds(
        {
          requiredScopes: {
            'eip155:1': {
              methods: [],
              notifications: [],
              accounts: ['eip155:1:0x1', 'eip155:1:0x2'],
            },
            'bip122:000000000019d6689c085ae165831e93': {
              methods: [],
              notifications: [],
            },
          },
          optionalScopes: {
            'eip155:1': {
              methods: ['eth_chainId'],
              notifications: [],
            },
            'eip155:100': {
              methods: [],
              notifications: [],
              accounts: ['eip155:100:0x100'],
            },
          },
          isMultichainOrigin: false,
        },
        ['0x1'],
      );

      expect(result).toStrictEqual({
        requiredScopes: {
          'eip155:1': {
            methods: [],
            notifications: [],
            accounts: ['eip155:1:0x1', 'eip155:1:0x2'],
          },
          'bip122:000000000019d6689c085ae165831e93': {
            methods: [],
            notifications: [],
          },
        },
        optionalScopes: {
          'eip155:1': {
            methods: ['eth_chainId'],
            notifications: [],
          },
        },
        isMultichainOrigin: false,
      });
    });

    it('returns a CAIP-25 caveat value with optional scopes added for missing chainIds', () => {
      const result = setPermittedEthChainIds(
        {
          requiredScopes: {
            'eip155:1': {
              methods: [],
              notifications: [],
              accounts: ['eip155:1:0x1', 'eip155:1:0x2'],
            },
          },
          optionalScopes: {
            'eip155:1': {
              methods: ['eth_chainId'],
              notifications: [],
            },
            'eip155:100': {
              methods: [],
              notifications: [],
              accounts: ['eip155:100:0x100'],
            },
          },
          isMultichainOrigin: false,
        },
        ['0x1', '0x64', '0x65'],
      );

      expect(result).toStrictEqual({
        requiredScopes: {
          'eip155:1': {
            methods: [],
            notifications: [],
            accounts: ['eip155:1:0x1', 'eip155:1:0x2'],
          },
        },
        optionalScopes: {
          'eip155:1': {
            methods: ['eth_chainId'],
            notifications: [],
          },
          'eip155:100': {
            methods: [],
            notifications: [],
            accounts: ['eip155:100:0x100'],
          },
          'eip155:101': {
            methods: KnownRpcMethods.eip155,
            notifications: KnownNotifications.eip155,
            accounts: [],
          },
          'wallet:eip155': {
            methods: [],
            notifications: [],
          },
        },
        isMultichainOrigin: false,
      });
    });

    it('does not modify the input CAIP-25 caveat value object', () => {
      const input: Caip25CaveatValue = {
        requiredScopes: {
          'eip155:1': {
            methods: [],
            notifications: [],
            accounts: ['eip155:1:0x1', 'eip155:1:0x2'],
          },
        },
        optionalScopes: {},
        isMultichainOrigin: false,
      };

      const result = setPermittedEthChainIds(input, ['0x1', '0x2', '0x3']);

      expect(input).toStrictEqual({
        requiredScopes: {
          'eip155:1': {
            methods: [],
            notifications: [],
            accounts: ['eip155:1:0x1', 'eip155:1:0x2'],
          },
        },
        optionalScopes: {},
        isMultichainOrigin: false,
      });
      expect(input).not.toStrictEqual(result);
    });
  });
});
