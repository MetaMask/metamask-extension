import { migrate, version } from './164';

const oldVersion = 163;

describe(`migration #${version}`, () => {
  afterEach(() => jest.resetAllMocks());

  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.meta).toStrictEqual({ version });
  });

  it('removes permissions for deleted networks from CAIP-25 permissions', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x1': { chainId: '0x1', name: 'Ethereum Mainnet' },
            '0x2105': { chainId: '0x2105', name: 'Base' },
          },
        },
        PermissionController: {
          subjects: {
            'https://example.com': {
              origin: 'https://example.com',
              permissions: {
                'endowment:caip25': {
                  caveats: [
                    {
                      type: 'authorizedScopes',
                      value: {
                        requiredScopes: {},
                        optionalScopes: {
                          'eip155:1': {
                            accounts: ['eip155:1:0x123'],
                          },
                          'eip155:8453': {
                            accounts: ['eip155:8453:0x123'],
                          },
                          'eip155:1337': {
                            accounts: ['eip155:1337:0x123'],
                          },
                          'wallet:eip155': {
                            accounts: ['wallet:eip155:0x123'],
                          },
                        },
                        isMultichainOrigin: false,
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

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual({
      NetworkController: {
        networkConfigurationsByChainId: {
          '0x1': { chainId: '0x1', name: 'Ethereum Mainnet' },
          '0x2105': { chainId: '0x2105', name: 'Base' },
        },
      },
      PermissionController: {
        subjects: {
          'https://example.com': {
            origin: 'https://example.com',
            permissions: {
              'endowment:caip25': {
                caveats: [
                  {
                    type: 'authorizedScopes',
                    value: {
                      requiredScopes: {},
                      optionalScopes: {
                        'eip155:1': {
                          accounts: ['eip155:1:0x123'],
                        },
                        'eip155:8453': {
                          accounts: ['eip155:8453:0x123'],
                        },
                        // 'eip155:1337' should be removed as it's not in networkConfigurationsByChainId
                        'wallet:eip155': {
                          accounts: ['wallet:eip155:0x123'],
                        },
                      },
                      isMultichainOrigin: false,
                      sessionProperties: {},
                    },
                  },
                ],
              },
            },
          },
        },
      },
    });
  });

  it('cleans up requiredScopes as well as optionalScopes', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x1': { chainId: '0x1', name: 'Ethereum Mainnet' },
          },
        },
        PermissionController: {
          subjects: {
            'https://example.com': {
              origin: 'https://example.com',
              permissions: {
                'endowment:caip25': {
                  caveats: [
                    {
                      type: 'authorizedScopes',
                      value: {
                        requiredScopes: {
                          'eip155:1': {
                            accounts: ['eip155:1:0x123'],
                          },
                          'eip155:999': {
                            accounts: ['eip155:999:0x123'],
                          },
                        },
                        optionalScopes: {
                          'eip155:1': {
                            accounts: ['eip155:1:0x123'],
                          },
                          'eip155:888': {
                            accounts: ['eip155:888:0x123'],
                          },
                        },
                        isMultichainOrigin: false,
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

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual({
      NetworkController: {
        networkConfigurationsByChainId: {
          '0x1': { chainId: '0x1', name: 'Ethereum Mainnet' },
        },
      },
      PermissionController: {
        subjects: {
          'https://example.com': {
            origin: 'https://example.com',
            permissions: {
              'endowment:caip25': {
                caveats: [
                  {
                    type: 'authorizedScopes',
                    value: {
                      requiredScopes: {
                        'eip155:1': {
                          accounts: ['eip155:1:0x123'],
                        },
                        // 'eip155:999' should be removed
                      },
                      optionalScopes: {
                        'eip155:1': {
                          accounts: ['eip155:1:0x123'],
                        },
                        // 'eip155:888' should be removed
                      },
                      isMultichainOrigin: false,
                      sessionProperties: {},
                    },
                  },
                ],
              },
            },
          },
        },
      },
    });
  });

  it('preserves wallet scopes and other non-chain-specific scopes', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x1': { chainId: '0x1', name: 'Ethereum Mainnet' },
          },
        },
        PermissionController: {
          subjects: {
            'https://example.com': {
              origin: 'https://example.com',
              permissions: {
                'endowment:caip25': {
                  caveats: [
                    {
                      type: 'authorizedScopes',
                      value: {
                        requiredScopes: {},
                        optionalScopes: {
                          'wallet:eip155': {
                            accounts: ['wallet:eip155:0x123'],
                          },
                          wallet: {
                            accounts: [],
                          },
                          'eip155:1': {
                            accounts: ['eip155:1:0x123'],
                          },
                          'eip155:999': {
                            accounts: ['eip155:999:0x123'],
                          },
                        },
                        isMultichainOrigin: false,
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

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual({
      NetworkController: {
        networkConfigurationsByChainId: {
          '0x1': { chainId: '0x1', name: 'Ethereum Mainnet' },
        },
      },
      PermissionController: {
        subjects: {
          'https://example.com': {
            origin: 'https://example.com',
            permissions: {
              'endowment:caip25': {
                caveats: [
                  {
                    type: 'authorizedScopes',
                    value: {
                      requiredScopes: {},
                      optionalScopes: {
                        'wallet:eip155': {
                          accounts: ['wallet:eip155:0x123'],
                        },
                        wallet: {
                          accounts: [],
                        },
                        'eip155:1': {
                          accounts: ['eip155:1:0x123'],
                        },
                        // 'eip155:999' should be removed
                      },
                      isMultichainOrigin: false,
                      sessionProperties: {},
                    },
                  },
                ],
              },
            },
          },
        },
      },
    });
  });

  it('handles multiple subjects with different permissions', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x1': { chainId: '0x1', name: 'Ethereum Mainnet' },
          },
        },
        PermissionController: {
          subjects: {
            'https://example.com': {
              origin: 'https://example.com',
              permissions: {
                'endowment:caip25': {
                  caveats: [
                    {
                      type: 'authorizedScopes',
                      value: {
                        requiredScopes: {},
                        optionalScopes: {
                          'eip155:1': {
                            accounts: ['eip155:1:0x123'],
                          },
                          'eip155:999': {
                            accounts: ['eip155:999:0x123'],
                          },
                        },
                        isMultichainOrigin: false,
                        sessionProperties: {},
                      },
                    },
                  ],
                },
              },
            },
            'https://other.com': {
              origin: 'https://other.com',
              permissions: {
                'some-other-permission': {},
              },
            },
            'npm:@metamask/example-snap': {
              origin: 'npm:@metamask/example-snap',
              permissions: {
                'endowment:caip25': {
                  caveats: [
                    {
                      type: 'authorizedScopes',
                      value: {
                        requiredScopes: {},
                        optionalScopes: {
                          'eip155:1': {
                            accounts: ['eip155:1:0x456'],
                          },
                          'eip155:777': {
                            accounts: ['eip155:777:0x456'],
                          },
                        },
                        isMultichainOrigin: false,
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

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual({
      NetworkController: {
        networkConfigurationsByChainId: {
          '0x1': { chainId: '0x1', name: 'Ethereum Mainnet' },
        },
      },
      PermissionController: {
        subjects: {
          'https://example.com': {
            origin: 'https://example.com',
            permissions: {
              'endowment:caip25': {
                caveats: [
                  {
                    type: 'authorizedScopes',
                    value: {
                      requiredScopes: {},
                      optionalScopes: {
                        'eip155:1': {
                          accounts: ['eip155:1:0x123'],
                        },
                        // 'eip155:999' should be removed
                      },
                      isMultichainOrigin: false,
                      sessionProperties: {},
                    },
                  },
                ],
              },
            },
          },
          'https://other.com': {
            origin: 'https://other.com',
            permissions: {
              'some-other-permission': {},
            },
          },
          'npm:@metamask/example-snap': {
            origin: 'npm:@metamask/example-snap',
            permissions: {
              'endowment:caip25': {
                caveats: [
                  {
                    type: 'authorizedScopes',
                    value: {
                      requiredScopes: {},
                      optionalScopes: {
                        'eip155:1': {
                          accounts: ['eip155:1:0x456'],
                        },
                        // 'eip155:777' should be removed
                      },
                      isMultichainOrigin: false,
                      sessionProperties: {},
                    },
                  },
                ],
              },
            },
          },
        },
      },
    });
  });

  it('returns unchanged state when PermissionController is missing', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {},
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('returns unchanged state when NetworkController is missing', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        PermissionController: {
          subjects: {},
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('returns unchanged state when networkConfigurationsByChainId is missing', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {},
        PermissionController: {
          subjects: {},
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('handles subjects without permissions gracefully', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x1': { chainId: '0x1', name: 'Ethereum Mainnet' },
          },
        },
        PermissionController: {
          subjects: {
            'https://example.com': {
              origin: 'https://example.com',
              // No permissions property
            },
            'https://other.com': {
              origin: 'https://other.com',
              permissions: null, // Invalid permissions
            },
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('handles malformed CAIP-25 permissions gracefully', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x1': { chainId: '0x1', name: 'Ethereum Mainnet' },
          },
        },
        PermissionController: {
          subjects: {
            'https://example.com': {
              origin: 'https://example.com',
              permissions: {
                'endowment:caip25': {
                  // Missing caveats
                },
              },
            },
            'https://other.com': {
              origin: 'https://other.com',
              permissions: {
                'endowment:caip25': {
                  caveats: [
                    {
                      type: 'authorizedScopes',
                      // Missing value
                    },
                  ],
                },
              },
            },
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });
});
