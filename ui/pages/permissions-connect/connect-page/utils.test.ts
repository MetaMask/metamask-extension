import { CaipAccountId } from '@metamask/utils';
import {
  CaveatTypes,
  EndowmentTypes,
} from '../../../../shared/constants/permissions';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import {
  getRequestedAccountsViaPermissionsRequest,
  getRequestedChainsViaPermissionsRequest,
  parseCaip25PermissionsResponse,
} from './utils';

describe('getRequestedAccountsViaPermissionsRequest', () => {
  it('should return an empty array when `getCaip25CaveatValue` returns `undefined`', () => {
    const permissions = {
      [EndowmentTypes.caip25]: {
        caveats: [],
      },
    };

    const result = getRequestedAccountsViaPermissionsRequest(permissions);
    expect(result).toEqual([]);
  });

  it('should return the correct accounts when getCaip25CaveatValue returns a proper value', () => {
    const permissions = {
      [EndowmentTypes.caip25]: {
        caveats: [
          {
            type: CaveatTypes.caip25,
            value: {
              requiredScopes: {},
              optionalScopes: {
                'wallet:eip155': {
                  accounts: [
                    'wallet:eip155:0x123',
                    'wallet:eip155:0x456',
                  ] as CaipAccountId[],
                },
                'eip155:1': {
                  accounts: [
                    'eip155:1:0x789',
                    'eip155:1:0xabc',
                  ] as CaipAccountId[],
                },
              },
              isMultichainOrigin: false,
            },
          },
        ],
      },
    };

    const result = getRequestedAccountsViaPermissionsRequest(permissions);
    expect(result).toEqual(['0x123', '0x456', '0x789', '0xabc']);
  });

  it('should return an empty array when target name of the CAIP-25 endowment permission is not included', () => {
    const result = getRequestedAccountsViaPermissionsRequest({});
    expect(result).toEqual([]);
  });

  it('should handle empty optionalScopes', () => {
    const permissions = {
      [EndowmentTypes.caip25]: {
        caveats: [
          {
            type: CaveatTypes.caip25,
            value: {
              requiredScopes: {},
              optionalScopes: {},
              isMultichainOrigin: false,
            },
          },
        ],
      },
    };

    const result = getRequestedAccountsViaPermissionsRequest(permissions);
    expect(result).toEqual([]);
  });
});

describe('getRequestedChainsViaPermissionsRequest', () => {
  it('should return an empty array when `getCaip25CaveatValue` returns undefined', () => {
    const permissions = {
      [EndowmentTypes.caip25]: {
        caveats: [],
      },
    };

    const result = getRequestedChainsViaPermissionsRequest(permissions);
    expect(result).toEqual([]);
  });

  it('should return the correct chains when `getCaip25CaveatValue` returns a proper value', () => {
    const permissions = {
      [EndowmentTypes.caip25]: {
        caveats: [
          {
            type: CaveatTypes.caip25,
            value: {
              requiredScopes: {},
              optionalScopes: {
                'wallet:eip155': {
                  accounts: [],
                },
                'eip155:1': {
                  accounts: [],
                },
                'eip155:137': {
                  accounts: [],
                },
              },
              isMultichainOrigin: false,
            },
          },
        ],
      },
    };

    const result = getRequestedChainsViaPermissionsRequest(permissions);

    expect(result).toEqual([CHAIN_IDS.MAINNET, CHAIN_IDS.POLYGON]);
  });

  it('should return an empty array when target name of the CAIP-25 endowment permission is not included', () => {
    const result = getRequestedChainsViaPermissionsRequest({});
    expect(result).toEqual([]);
  });

  it('should handle empty `optionalScopes`', () => {
    const permissions = {
      [EndowmentTypes.caip25]: {
        caveats: [
          {
            type: CaveatTypes.caip25,
            value: {
              requiredScopes: {},
              optionalScopes: {},
              isMultichainOrigin: false,
            },
          },
        ],
      },
    };

    const result = getRequestedChainsViaPermissionsRequest(permissions);
    expect(result).toEqual([]);
  });

  it('should ignore non-numeric chain references', () => {
    const permissions = {
      [EndowmentTypes.caip25]: {
        caveats: [
          {
            type: CaveatTypes.caip25,
            value: {
              requiredScopes: {},
              optionalScopes: {
                'eip155:1': {
                  accounts: [],
                },
                'eip155:invalid': {
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
    };

    const result = getRequestedChainsViaPermissionsRequest(permissions);
    expect(result).toEqual([CHAIN_IDS.MAINNET, CHAIN_IDS.ARBITRUM]);
  });
});

describe('parseCaip25PermissionsResponse', () => {
  it('should correctly parse CAIP-25 permissions response', () => {
    const addresses = ['0x4c286da233db3d63d44dc2ec8adc8b6dfb595cb4'];
    const hexChainIds = [CHAIN_IDS.ARBITRUM, CHAIN_IDS.LINEA_MAINNET];

    const result = parseCaip25PermissionsResponse(addresses, hexChainIds);

    expect(result).toEqual({
      permissions: {
        [EndowmentTypes.caip25]: {
          caveats: [
            {
              type: CaveatTypes.caip25,
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
