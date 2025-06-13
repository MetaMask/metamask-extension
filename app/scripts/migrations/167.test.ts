import { migrate, version } from './167';
import { cloneDeep } from 'lodash';
import { Caip25CaveatType, Caip25EndowmentPermissionName } from '@metamask/chain-agnostic-permission';

const storage = {
  meta: { version: -1 },
  data: {},
};

describe('storage is migrated successfully', () => {
  it('should work', async () => {
    const migratedData = await migrate(storage);
    expect(migratedData.meta.version).toStrictEqual(version);
  });
});

describe('migration #167', () => {
  const oldVersion = 166;

  it('should remove permissions for chains that are not configured', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x1': {
              chainId: '0x1',
              name: 'Ethereum Mainnet',
            },
          },
        },
        PermissionController: {
          subjects: {
            'https://app.test.io': {
              origin: 'https://app.test.io',
              permissions: {
                [Caip25EndowmentPermissionName]: {
                  caveats: [
                    {
                      type: Caip25CaveatType,
                      value: {
                        isMultichainOrigin: false,
                        optionalScopes: {
                          'eip155:42161': {
                            accounts: [
                              'eip155:42161:0x005958702dbcf1c499ffd67dc60dbd4c6992201e',
                            ],
                          },
                          'eip155:1': {
                            accounts: [
                              'eip155:1:0x005958702dbcf1c499ffd67dc60dbd4c6992201e',
                            ],
                          },
                          'wallet:eip155': {
                            accounts: [],
                          },
                        },
                        requiredScopes: {},
                        sessionProperties: {},
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
    };

    const newStorage = await migrate(cloneDeep(oldStorage));

    const updatedPermission = (newStorage.data.PermissionController as any).subjects['https://app.test.io'].permissions[Caip25EndowmentPermissionName];
    const updatedCaveat = updatedPermission.caveats[0];

    expect(Object.keys(updatedCaveat.value.optionalScopes)).toHaveLength(2);
    expect(updatedCaveat.value.optionalScopes['eip155:1']).toBeDefined();
    expect(updatedCaveat.value.optionalScopes['wallet:eip155']).toBeDefined();
    expect(updatedCaveat.value.optionalScopes['eip155:42161']).toBeUndefined();
  });

  it('should remove the entire permission if no valid scopes remain', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x1': {
              chainId: '0x1',
              name: 'Ethereum Mainnet',
            },
          },
        },
        PermissionController: {
          subjects: {
            'https://app.test.io': {
              origin: 'https://app.test.io',
              permissions: {
                [Caip25EndowmentPermissionName]: {
                  caveats: [
                    {
                      type: Caip25CaveatType,
                      value: {
                        isMultichainOrigin: false,
                        optionalScopes: {
                          'eip155:42161': {
                            accounts: [
                              'eip155:42161:0x005958702dbcf1c499ffd67dc60dbd4c6992201e',
                            ],
                          },
                        },
                        requiredScopes: {},
                        sessionProperties: {},
                      },
                    },
                  ],

                },
              },
            },
          },
        },
      },
    };

    const newStorage = await migrate(cloneDeep(oldStorage));

    // The subject should be removed entirely since no scopes remain
    expect((newStorage.data.PermissionController as any).subjects['https://app.test.io']).toBeUndefined();
  });

  it('should preserve wallet scopes and non-chain-specific scopes', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x1': {
              chainId: '0x1',
              name: 'Ethereum Mainnet',
            },
          },
        },
        PermissionController: {
          subjects: {
            'https://app.test.io': {
              origin: 'https://app.test.io',
              permissions: {
                [Caip25EndowmentPermissionName]: {
                  caveats: [
                    {
                      type: Caip25CaveatType,
                      value: {
                        isMultichainOrigin: false,
                        optionalScopes: {
                          'wallet:eip155': {
                            accounts: [],
                          },
                          'custom:scope': {
                            accounts: ['custom:scope:0x123'],
                          },
                        },
                        requiredScopes: {},
                        sessionProperties: {},
                      },
                    },
                  ],

                },
              },
            },
          },
        },
      },
    };

    const newStorage = await migrate(cloneDeep(oldStorage));

    const updatedPermission = (newStorage.data.PermissionController as any).subjects['https://app.test.io'].permissions[Caip25EndowmentPermissionName];
    const updatedCaveat = updatedPermission.caveats[0];

    expect(Object.keys(updatedCaveat.value.optionalScopes)).toHaveLength(2);
    expect(updatedCaveat.value.optionalScopes['wallet:eip155']).toBeDefined();
    expect(updatedCaveat.value.optionalScopes['custom:scope']).toBeDefined();
  });

  it('should handle missing or invalid state gracefully', async () => {
    const testCases = [
      {
        name: 'missing NetworkController',
        state: {
          PermissionController: {
            subjects: {},
          },
        },
      },
      {
        name: 'missing PermissionController',
        state: {
          NetworkController: {
            networkConfigurationsByChainId: {},
          },
        },
      },
      {
        name: 'missing networkConfigurationsByChainId',
        state: {
          NetworkController: {},
          PermissionController: {
            subjects: {},
          },
        },
      },
      {
        name: 'missing subjects',
        state: {
          NetworkController: {
            networkConfigurationsByChainId: {},
          },
          PermissionController: {},
        },
      },
    ];

    for (const testCase of testCases) {
      const oldStorage = {
        meta: { version: oldVersion },
        data: testCase.state,
      };

      const newStorage = await migrate(cloneDeep(oldStorage));
      expect(newStorage.data).toEqual(testCase.state);
    }
  });
});
