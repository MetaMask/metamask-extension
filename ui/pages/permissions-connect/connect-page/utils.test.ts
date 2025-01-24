import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from '@metamask/multichain';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { parseCaip25PermissionsResponse } from './utils';

describe('parseCaip25PermissionsResponse', () => {
  it('should correctly parse CAIP-25 permissions response', () => {
    const addresses = ['0x4c286da233db3d63d44dc2ec8adc8b6dfb595cb4'];
    const hexChainIds = [CHAIN_IDS.ARBITRUM, CHAIN_IDS.LINEA_MAINNET];

    const result = parseCaip25PermissionsResponse(addresses, hexChainIds);

    expect(result).toEqual({
      permissions: {
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
      },
    });
  });
});
