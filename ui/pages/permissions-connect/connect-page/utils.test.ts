import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from '@metamask/chain-agnostic-permission';
import { Hex } from '@metamask/utils';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { getCaip25PermissionsResponse } from './utils';

const baseCaip25CaveatValue = {
  requiredScopes: {},
  optionalScopes: {
    'wallet:eip155': {
      accounts: [],
    },
  },
  isMultichainOrigin: false,
  sessionProperties: {},
};

describe('getCaip25PermissionsResponse', () => {
  describe('No accountAddresses or chainIds requested', () => {
    it(`should construct a valid ${Caip25EndowmentPermissionName} empty permission`, () => {
      const result = getCaip25PermissionsResponse(
        baseCaip25CaveatValue,
        [],
        [],
      );

      expect(result).toEqual({
        [Caip25EndowmentPermissionName]: {
          caveats: [
            {
              type: Caip25CaveatType,
              value: {
                requiredScopes: {},
                optionalScopes: {
                  'wallet:eip155': {
                    accounts: [],
                  },
                },
                isMultichainOrigin: false,
                sessionProperties: {},
              },
            },
          ],
        },
      });
    });
  });

  describe('Request approval for chainIds', () => {
    it(`should construct a valid ${Caip25EndowmentPermissionName} permission from the passed chainIds`, () => {
      const hexChainIds: Hex[] = [CHAIN_IDS.ARBITRUM];
      const result = getCaip25PermissionsResponse(
        baseCaip25CaveatValue,
        [],
        hexChainIds,
      );

      expect(result).toEqual({
        [Caip25EndowmentPermissionName]: {
          caveats: [
            {
              type: Caip25CaveatType,
              value: {
                requiredScopes: {},
                optionalScopes: {
                  'wallet:eip155': {
                    accounts: [],
                  },
                  'eip155:42161': {
                    accounts: [],
                  },
                },
                isMultichainOrigin: false,
                sessionProperties: {},
              },
            },
          ],
        },
      });
    });
  });

  describe('Request approval for accountAddresses', () => {
    it(`should construct a valid ${Caip25EndowmentPermissionName} permission from the passed accountAddresses`, () => {
      const addresses: Hex[] = ['0x4c286da233db3d63d44dc2ec8adc8b6dfb595cb4'];

      const result = getCaip25PermissionsResponse(
        baseCaip25CaveatValue,
        addresses,
        [],
      );

      expect(result).toEqual({
        [Caip25EndowmentPermissionName]: {
          caveats: [
            {
              type: Caip25CaveatType,
              value: {
                requiredScopes: {},
                optionalScopes: {
                  'wallet:eip155': {
                    accounts: [
                      'wallet:eip155:0x4c286da233db3d63d44dc2ec8adc8b6dfb595cb4',
                    ],
                  },
                },
                isMultichainOrigin: false,
                sessionProperties: {},
              },
            },
          ],
        },
      });
    });
  });

  describe('Request approval for accountAddresses and chainIds', () => {
    it(`should construct a valid ${Caip25EndowmentPermissionName} permission from the passed accountAddresses and chainIds`, () => {
      const addresses: Hex[] = ['0x4c286da233db3d63d44dc2ec8adc8b6dfb595cb4'];
      const hexChainIds: Hex[] = [CHAIN_IDS.ARBITRUM, CHAIN_IDS.LINEA_MAINNET];

      const result = getCaip25PermissionsResponse(
        baseCaip25CaveatValue,
        addresses,
        hexChainIds,
      );

      expect(result).toEqual({
        [Caip25EndowmentPermissionName]: {
          caveats: [
            {
              type: Caip25CaveatType,
              value: {
                requiredScopes: {},
                optionalScopes: {
                  'wallet:eip155': {
                    accounts: [
                      'wallet:eip155:0x4c286da233db3d63d44dc2ec8adc8b6dfb595cb4',
                    ],
                  },
                  'eip155:42161': {
                    accounts: [
                      'eip155:42161:0x4c286da233db3d63d44dc2ec8adc8b6dfb595cb4',
                    ],
                  },
                  'eip155:59144': {
                    accounts: [
                      'eip155:59144:0x4c286da233db3d63d44dc2ec8adc8b6dfb595cb4',
                    ],
                  },
                },
                isMultichainOrigin: false,
                sessionProperties: {},
              },
            },
          ],
        },
      });
    });
  });

  describe('Request approval including non-evm scopes', () => {
    it('only modifies evm related scopes', () => {
      const addresses: Hex[] = ['0x4c286da233db3d63d44dc2ec8adc8b6dfb595cb4'];
      const hexChainIds: Hex[] = ['0x1'];

      const result = getCaip25PermissionsResponse(
        {
          ...baseCaip25CaveatValue,
          requiredScopes: {
            'bip122:000000000019d6689c085ae165831e93': {
              accounts: [],
            },
          },
        },
        addresses,
        hexChainIds,
      );

      expect(result).toEqual({
        [Caip25EndowmentPermissionName]: {
          caveats: [
            {
              type: Caip25CaveatType,
              value: {
                requiredScopes: {
                  'bip122:000000000019d6689c085ae165831e93': {
                    accounts: [],
                  },
                },
                optionalScopes: {
                  'wallet:eip155': {
                    accounts: [
                      'wallet:eip155:0x4c286da233db3d63d44dc2ec8adc8b6dfb595cb4',
                    ],
                  },
                  'eip155:1': {
                    accounts: [
                      'eip155:1:0x4c286da233db3d63d44dc2ec8adc8b6dfb595cb4',
                    ],
                  },
                },
                isMultichainOrigin: false,
                sessionProperties: {},
              },
            },
          ],
        },
      });
    });
  });
});
