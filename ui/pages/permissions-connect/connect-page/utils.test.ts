import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from '@metamask/multichain';
import { Hex } from '@metamask/utils';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { getCaip25PermissionsResponse } from './utils';

describe('getCaip25PermissionsResponse', () => {
  describe('No accountAddresses or chainIds requested', () => {
    it(`should construct a valid ${Caip25EndowmentPermissionName} empty permission`, () => {
      const result = getCaip25PermissionsResponse([], []);

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
      const result = getCaip25PermissionsResponse([], hexChainIds);

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

      const result = getCaip25PermissionsResponse(addresses, []);

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

      const result = getCaip25PermissionsResponse(addresses, hexChainIds);

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
              },
            },
          ],
        },
      });
    });
  });
});
