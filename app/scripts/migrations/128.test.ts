import { migrate, version } from './128';

const PermissionNames = {
  eth_accounts: 'eth_accounts',
  permittedChains: 'endowment:permitted-chains',
};

const validNotifications = [
  'accountsChanged',
  'chainChanged',
  'eth_subscription',
];

const validRpcMethods = [
  'wallet_addEthereumChain',
  'wallet_switchEthereumChain',
  'wallet_getPermissions',
  'wallet_requestPermissions',
  'wallet_revokePermissions',
  'personal_sign',
  'eth_signTypedData_v4',
  'wallet_registerOnboarding',
  'wallet_watchAsset',
  'wallet_scanQRCode',
  'eth_requestAccounts',
  'eth_accounts',
  'eth_sendTransaction',
  'eth_decrypt',
  'eth_getEncryptionPublicKey',
  'web3_clientVersion',
  'eth_subscribe',
  'eth_unsubscribe',
  'eth_blobBaseFee',
  'eth_blockNumber',
  'eth_call',
  'eth_chainId',
  'eth_coinbase',
  'eth_estimateGas',
  'eth_feeHistory',
  'eth_gasPrice',
  'eth_getBalance',
  'eth_getBlockByHash',
  'eth_getBlockByNumber',
  'eth_getBlockReceipts',
  'eth_getBlockTransactionCountByHash',
  'eth_getBlockTransactionCountByNumber',
  'eth_getCode',
  'eth_getFilterChanges',
  'eth_getFilterLogs',
  'eth_getLogs',
  'eth_getProof',
  'eth_getStorageAt',
  'eth_getTransactionByBlockHashAndIndex',
  'eth_getTransactionByBlockNumberAndIndex',
  'eth_getTransactionByHash',
  'eth_getTransactionCount',
  'eth_getTransactionReceipt',
  'eth_getUncleCountByBlockHash',
  'eth_getUncleCountByBlockNumber',
  'eth_maxPriorityFeePerGas',
  'eth_newBlockFilter',
  'eth_newFilter',
  'eth_newPendingTransactionFilter',
  'eth_sendRawTransaction',
  'eth_syncing',
  'eth_uninstallFilter',
];

const oldVersion = 127;

describe('migration #128', () => {
  afterEach(() => jest.resetAllMocks());

  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({ version });
  });

  it('does nothing if PermissionController state is missing', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {},
        SelectedNetworkController: {},
      },
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('does nothing if PermissionController state is not an object', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        PermissionController: 'foo',
        NetworkController: {},
        SelectedNetworkController: {},
      },
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('does nothing if NetworkController state is missing', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        PermissionController: {},
        SelectedNetworkController: {},
      },
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('does nothing if NetworkController state is not an object', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        PermissionController: {},
        NetworkController: 'foo',
        SelectedNetworkController: {},
      },
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('does nothing if SelectedNetworkController state is missing', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        PermissionController: {},
        NetworkController: {},
      },
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('does nothing if SelectedNetworkController state is not an object', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        PermissionController: {},
        NetworkController: {},
        SelectedNetworkController: 'foo',
      },
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('does nothing if PermissionController.subjects is not an object', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        PermissionController: {
          subjects: 'foo',
        },
        NetworkController: {},
        SelectedNetworkController: {},
      },
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('does nothing if NetworkController.selectedNetworkClientId is not a non-empty string', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        PermissionController: {
          subjects: {},
        },
        NetworkController: {
          selectedNetworkClientId: '',
        },
        SelectedNetworkController: {},
      },
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('does nothing if NetworkController.networkConfigurations is not an object', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        PermissionController: {
          subjects: {},
        },
        NetworkController: {
          selectedNetworkClientId: 'mainnet',
          networkConfigurations: 'foo',
        },
        SelectedNetworkController: {},
      },
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('does nothing if SelectedNetworkController.domains is not an object', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        PermissionController: {
          subjects: {},
        },
        NetworkController: {
          selectedNetworkClientId: 'mainnet',
          networkConfigurations: {},
        },
        SelectedNetworkController: {
          domains: 'foo',
        },
      },
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('does nothing if the currently selected network client is neither built in nor exists in NetworkController.networkConfigurations', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        PermissionController: {
          subjects: {},
        },
        NetworkController: {
          selectedNetworkClientId: 'nonExistentNetworkClientId',
          networkConfigurations: {},
        },
        SelectedNetworkController: {
          domains: {},
        },
      },
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('does nothing if a subject is not an object', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          selectedNetworkClientId: 'mainnet',
          networkConfigurations: {},
        },
        SelectedNetworkController: {
          domains: {},
        },
        PermissionController: {
          subjects: {
            'test.com': 'foo',
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it("does nothing if a subject's permissions is not an object", async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          selectedNetworkClientId: 'mainnet',
          networkConfigurations: {},
        },
        SelectedNetworkController: {
          domains: {},
        },
        PermissionController: {
          subjects: {
            'test.com': {
              permissions: 'foo',
            },
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('does nothing if neither eth_accounts nor permittedChains permissions have been granted', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          selectedNetworkClientId: 'mainnet',
          networkConfigurations: {},
        },
        SelectedNetworkController: {
          domains: {},
        },
        PermissionController: {
          subjects: {
            'test.com': {
              permissions: {
                unrelated: {
                  foo: 'bar',
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
        selectedNetworkClientId: 'mainnet',
        networkConfigurations: {},
      },
      SelectedNetworkController: {
        domains: {},
      },
      PermissionController: {
        subjects: {
          'test.com': {
            permissions: {
              unrelated: {
                foo: 'bar',
              },
            },
          },
        },
      },
    });
  });

  // @ts-expect-error This function is missing from the Mocha type definitions
  describe.each([
    [
      'built-in',
      {
        selectedNetworkClientId: 'mainnet',
        networkConfigurations: {},
      },
      '1',
    ],
    [
      'custom',
      {
        selectedNetworkClientId: 'customId',
        networkConfigurations: {
          customId: {
            chainId: '0xf',
          },
        },
      },
      '15',
    ],
  ])(
    'the currently selected network client is %s',
    (
      _type: string,
      NetworkController: Record<string, unknown>,
      chainId: string,
    ) => {
      const baseData = () => ({
        PermissionController: {
          subjects: {},
        },
        NetworkController,
        SelectedNetworkController: {
          domains: {},
        },
      });
      const currentScope = `eip155:${chainId}`;

      it('replaces the eth_accounts permission with a CAIP-25 permission using the eth_accounts value for the currently selected chain id when the origin does not have its own network client', async () => {
        const oldStorage = {
          meta: { version: oldVersion },
          data: {
            ...baseData(),
            PermissionController: {
              subjects: {
                'test.com': {
                  permissions: {
                    unrelated: {
                      foo: 'bar',
                    },
                    [PermissionNames.eth_accounts]: {
                      caveats: [
                        {
                          type: 'restrictReturnedAccounts',
                          value: ['0xdeadbeef', '0x999'],
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
          ...baseData(),
          PermissionController: {
            subjects: {
              'test.com': {
                permissions: {
                  unrelated: {
                    foo: 'bar',
                  },
                  'endowment:caip25': {
                    parentCapability: 'endowment:caip25',
                    caveats: [
                      {
                        type: 'authorizedScopes',
                        value: {
                          requiredScopes: {},
                          optionalScopes: {
                            [currentScope]: {
                              accounts: [
                                `${currentScope}:0xdeadbeef`,
                                `${currentScope}:0x999`,
                              ],
                              methods: validRpcMethods,
                              notifications: validNotifications,
                            },
                          },
                          isMultichainOrigin: false,
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

      it('replaces the eth_accounts permission with a CAIP-25 permission using the eth_accounts value for the currently selected chain id when the origin does have its own network client that cannot be resolved', async () => {
        const oldStorage = {
          meta: { version: oldVersion },
          data: {
            ...baseData(),
            SelectedNetworkController: {
              domains: {
                'test.com': 'doesNotExist',
              },
            },
            PermissionController: {
              subjects: {
                'test.com': {
                  permissions: {
                    unrelated: {
                      foo: 'bar',
                    },
                    [PermissionNames.eth_accounts]: {
                      caveats: [
                        {
                          type: 'restrictReturnedAccounts',
                          value: ['0xdeadbeef', '0x999'],
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
          ...baseData(),
          SelectedNetworkController: {
            domains: {
              'test.com': 'doesNotExist',
            },
          },
          PermissionController: {
            subjects: {
              'test.com': {
                permissions: {
                  unrelated: {
                    foo: 'bar',
                  },
                  'endowment:caip25': {
                    parentCapability: 'endowment:caip25',
                    caveats: [
                      {
                        type: 'authorizedScopes',
                        value: {
                          requiredScopes: {},
                          optionalScopes: {
                            [currentScope]: {
                              accounts: [
                                `${currentScope}:0xdeadbeef`,
                                `${currentScope}:0x999`,
                              ],
                              methods: validRpcMethods,
                              notifications: validNotifications,
                            },
                          },
                          isMultichainOrigin: false,
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

      it('replaces the eth_accounts permission with a CAIP-25 permission using the eth_accounts value for the origin chain id when the origin does have its own network client and it exists in the built-in networks', async () => {
        const oldStorage = {
          meta: { version: oldVersion },
          data: {
            ...baseData(),
            SelectedNetworkController: {
              domains: {
                'test.com': 'sepolia',
              },
            },
            PermissionController: {
              subjects: {
                'test.com': {
                  permissions: {
                    unrelated: {
                      foo: 'bar',
                    },
                    [PermissionNames.eth_accounts]: {
                      caveats: [
                        {
                          type: 'restrictReturnedAccounts',
                          value: ['0xdeadbeef', '0x999'],
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
          ...baseData(),
          SelectedNetworkController: {
            domains: {
              'test.com': 'sepolia',
            },
          },
          PermissionController: {
            subjects: {
              'test.com': {
                permissions: {
                  unrelated: {
                    foo: 'bar',
                  },
                  'endowment:caip25': {
                    parentCapability: 'endowment:caip25',
                    caveats: [
                      {
                        type: 'authorizedScopes',
                        value: {
                          requiredScopes: {},
                          optionalScopes: {
                            'eip155:11155111': {
                              accounts: [
                                'eip155:11155111:0xdeadbeef',
                                'eip155:11155111:0x999',
                              ],
                              methods: validRpcMethods,
                              notifications: validNotifications,
                            },
                          },
                          isMultichainOrigin: false,
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

      it('replaces the eth_accounts permission with a CAIP-25 permission using the eth_accounts value for the origin chain id when the origin does have its own network client and it exists in the custom configurations', async () => {
        const oldStorage = {
          meta: { version: oldVersion },
          data: {
            ...baseData(),
            NetworkController: {
              ...baseData().NetworkController,
              networkConfigurations: {
                ...baseData().NetworkController.networkConfigurations,
                customNetworkClientId: {
                  chainId: '0xa',
                },
              },
            },
            SelectedNetworkController: {
              domains: {
                'test.com': 'customNetworkClientId',
              },
            },
            PermissionController: {
              subjects: {
                'test.com': {
                  permissions: {
                    unrelated: {
                      foo: 'bar',
                    },
                    [PermissionNames.eth_accounts]: {
                      caveats: [
                        {
                          type: 'restrictReturnedAccounts',
                          value: ['0xdeadbeef', '0x999'],
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
          ...baseData(),
          NetworkController: {
            ...baseData().NetworkController,
            networkConfigurations: {
              ...baseData().NetworkController.networkConfigurations,
              customNetworkClientId: {
                chainId: '0xa',
              },
            },
          },
          SelectedNetworkController: {
            domains: {
              'test.com': 'customNetworkClientId',
            },
          },
          PermissionController: {
            subjects: {
              'test.com': {
                permissions: {
                  unrelated: {
                    foo: 'bar',
                  },
                  'endowment:caip25': {
                    parentCapability: 'endowment:caip25',
                    caveats: [
                      {
                        type: 'authorizedScopes',
                        value: {
                          requiredScopes: {},
                          optionalScopes: {
                            'eip155:10': {
                              accounts: [
                                'eip155:10:0xdeadbeef',
                                'eip155:10:0x999',
                              ],
                              methods: validRpcMethods,
                              notifications: validNotifications,
                            },
                          },
                          isMultichainOrigin: false,
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

      it('does not create a CAIP-25 permission when eth_accounts permission is missing', async () => {
        const oldStorage = {
          meta: { version: oldVersion },
          data: {
            ...baseData(),
            PermissionController: {
              subjects: {
                'test.com': {
                  permissions: {
                    unrelated: {
                      foo: 'bar',
                    },
                    [PermissionNames.permittedChains]: {
                      caveats: [
                        {
                          type: 'restrictNetworkSwitching',
                          value: ['0xa', '0x64'],
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
          ...baseData(),
          PermissionController: {
            subjects: {
              'test.com': {
                permissions: {
                  unrelated: {
                    foo: 'bar',
                  },
                },
              },
            },
          },
        });
      });

      it('replaces both eth_accounts and permittedChains permission with a CAIP-25 permission using the values from both permissions', async () => {
        const oldStorage = {
          meta: { version: oldVersion },
          data: {
            ...baseData(),
            PermissionController: {
              subjects: {
                'test.com': {
                  permissions: {
                    unrelated: {
                      foo: 'bar',
                    },
                    [PermissionNames.eth_accounts]: {
                      caveats: [
                        {
                          type: 'restrictReturnedAccounts',
                          value: ['0xdeadbeef', '0x999'],
                        },
                      ],
                    },
                    [PermissionNames.permittedChains]: {
                      caveats: [
                        {
                          type: 'restrictNetworkSwitching',
                          value: ['0xa', '0x64'],
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
          ...baseData(),
          PermissionController: {
            subjects: {
              'test.com': {
                permissions: {
                  unrelated: {
                    foo: 'bar',
                  },
                  'endowment:caip25': {
                    parentCapability: 'endowment:caip25',
                    caveats: [
                      {
                        type: 'authorizedScopes',
                        value: {
                          requiredScopes: {},
                          optionalScopes: {
                            'eip155:10': {
                              accounts: [
                                'eip155:10:0xdeadbeef',
                                'eip155:10:0x999',
                              ],
                              methods: validRpcMethods,
                              notifications: validNotifications,
                            },
                            'eip155:100': {
                              accounts: [
                                'eip155:100:0xdeadbeef',
                                'eip155:100:0x999',
                              ],
                              methods: validRpcMethods,
                              notifications: validNotifications,
                            },
                          },
                          isMultichainOrigin: false,
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

      it('replaces permissions for each subject', async () => {
        const oldStorage = {
          meta: { version: oldVersion },
          data: {
            ...baseData(),
            PermissionController: {
              subjects: {
                'test.com': {
                  permissions: {
                    [PermissionNames.eth_accounts]: {
                      caveats: [
                        {
                          type: 'restrictReturnedAccounts',
                          value: ['0xdeadbeef'],
                        },
                      ],
                    },
                  },
                },
                'test2.com': {
                  permissions: {
                    [PermissionNames.eth_accounts]: {
                      caveats: [
                        {
                          type: 'restrictReturnedAccounts',
                          value: ['0xdeadbeef'],
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
          ...baseData(),
          PermissionController: {
            subjects: {
              'test.com': {
                permissions: {
                  'endowment:caip25': {
                    parentCapability: 'endowment:caip25',
                    caveats: [
                      {
                        type: 'authorizedScopes',
                        value: {
                          requiredScopes: {},
                          optionalScopes: {
                            [currentScope]: {
                              accounts: [`${currentScope}:0xdeadbeef`],
                              methods: validRpcMethods,
                              notifications: validNotifications,
                            },
                          },
                          isMultichainOrigin: false,
                        },
                      },
                    ],
                  },
                },
              },
              'test2.com': {
                permissions: {
                  'endowment:caip25': {
                    parentCapability: 'endowment:caip25',
                    caveats: [
                      {
                        type: 'authorizedScopes',
                        value: {
                          requiredScopes: {},
                          optionalScopes: {
                            [currentScope]: {
                              accounts: [`${currentScope}:0xdeadbeef`],
                              methods: validRpcMethods,
                              notifications: validNotifications,
                            },
                          },
                          isMultichainOrigin: false,
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
    },
  );
});
