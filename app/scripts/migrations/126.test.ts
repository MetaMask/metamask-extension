import { migrate, version } from './126';

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

const oldVersion = 125;

describe('migration #126', () => {
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

  // it('does nothing if SelectedNetworkController state is not an object', async () => {
  //   const oldStorage = {
  //     meta: { version: oldVersion },
  //     data: {
  //       PermissionController: {},
  //       NetworkController: {},
  //       SelectedNetworkController: 'foo',
  //     },
  //   };

  //   const newStorage = await migrate(oldStorage);
  //   expect(newStorage.data).toStrictEqual(oldStorage.data);
  // });

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

  // it('does nothing if SelectedNetworkController.domains is not an object', async () => {
  //   const oldStorage = {
  //     meta: { version: oldVersion },
  //     data: {
  //       PermissionController: {
  //         subjects: {},
  //       },
  //       NetworkController: {
  //         selectedNetworkClientId: 'mainnet',
  //         networkConfigurations: {},
  //       },
  //       SelectedNetworkController: {
  //         domains: 'foo'
  //       },
  //     },
  //   };

  //   const newStorage = await migrate(oldStorage);
  //   expect(newStorage.data).toStrictEqual(oldStorage.data);
  // })

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

  describe('the currently selected network client is built in', () => {
    const baseData = () => ({
      PermissionController: {
        subjects: {},
      },
      NetworkController: {
        selectedNetworkClientId: 'mainnet',
        networkConfigurations: {},
      },
      SelectedNetworkController: {
        domains: {},
      },
    });

    it('replaces the eth_accounts permission with a CAIP-25 permission using the eth_accounts value for the currently selected chain id', async () => {
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
                  eth_accounts: {
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
                  caveats: [
                    {
                      type: 'authorizedScopes',
                      value: {
                        requiredScopes: {},
                        optionalScopes: {
                          'eip155:1': {
                            accounts: ['eip155:1:0xdeadbeef', 'eip155:1:0x999'],
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

    it('replaces the permittedChains permission with a CAIP-25 permission using the values for the permitted chains', async () => {
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
                  permittedChains: {
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
                  caveats: [
                    {
                      type: 'authorizedScopes',
                      value: {
                        requiredScopes: {},
                        optionalScopes: {
                          'eip155:10': {
                            accounts: [],
                            methods: validRpcMethods,
                            notifications: validNotifications,
                          },
                          'eip155:100': {
                            accounts: [],
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
                  eth_accounts: {
                    caveats: [
                      {
                        type: 'restrictReturnedAccounts',
                        value: ['0xdeadbeef', '0x999'],
                      },
                    ],
                  },
                  permittedChains: {
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
                  eth_accounts: {
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
                  eth_accounts: {
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
                  caveats: [
                    {
                      type: 'authorizedScopes',
                      value: {
                        requiredScopes: {},
                        optionalScopes: {
                          'eip155:1': {
                            accounts: ['eip155:1:0xdeadbeef'],
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
                  caveats: [
                    {
                      type: 'authorizedScopes',
                      value: {
                        requiredScopes: {},
                        optionalScopes: {
                          'eip155:1': {
                            accounts: ['eip155:1:0xdeadbeef'],
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
  });

  describe('the currently selected network client is custom', () => {
    const baseData = () => ({
      PermissionController: {
        subjects: {},
      },
      NetworkController: {
        selectedNetworkClientId: 'customId',
        networkConfigurations: {
          customId: {
            chainId: '0xf',
          },
        },
      },
      SelectedNetworkController: {
        domains: {},
      },
    });

    it('replaces the eth_accounts permission with a CAIP-25 permission using the eth_accounts value for the currently selected chain id', async () => {
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
                  eth_accounts: {
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
                  caveats: [
                    {
                      type: 'authorizedScopes',
                      value: {
                        requiredScopes: {},
                        optionalScopes: {
                          'eip155:15': {
                            accounts: [
                              'eip155:15:0xdeadbeef',
                              'eip155:15:0x999',
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

    it('replaces the permittedChains permission with a CAIP-25 permission using the values for the permitted chains', async () => {
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
                  permittedChains: {
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
                  caveats: [
                    {
                      type: 'authorizedScopes',
                      value: {
                        requiredScopes: {},
                        optionalScopes: {
                          'eip155:10': {
                            accounts: [],
                            methods: validRpcMethods,
                            notifications: validNotifications,
                          },
                          'eip155:100': {
                            accounts: [],
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
                  eth_accounts: {
                    caveats: [
                      {
                        type: 'restrictReturnedAccounts',
                        value: ['0xdeadbeef', '0x999'],
                      },
                    ],
                  },
                  permittedChains: {
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
                  eth_accounts: {
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
                  eth_accounts: {
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
                  caveats: [
                    {
                      type: 'authorizedScopes',
                      value: {
                        requiredScopes: {},
                        optionalScopes: {
                          'eip155:15': {
                            accounts: ['eip155:15:0xdeadbeef'],
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
                  caveats: [
                    {
                      type: 'authorizedScopes',
                      value: {
                        requiredScopes: {},
                        optionalScopes: {
                          'eip155:15': {
                            accounts: ['eip155:15:0xdeadbeef'],
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
  });
});
