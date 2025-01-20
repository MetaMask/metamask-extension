import { migrate, version } from './139';

const PermissionNames = {
  eth_accounts: 'eth_accounts',
  permittedChains: 'endowment:permitted-chains',
};

const sentryCaptureExceptionMock = jest.fn();

global.sentry = {
  captureException: sentryCaptureExceptionMock,
};

const oldVersion = 138;

describe('migration #139', () => {
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

    expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
      new Error(
        `Migration ${version}: typeof state.PermissionController is string`,
      ),
    );
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

    expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
      new Error(
        `Migration ${version}: typeof state.NetworkController is undefined`,
      ),
    );
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

    expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
      new Error(
        `Migration ${version}: typeof state.NetworkController is string`,
      ),
    );
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

    expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
      new Error(
        `Migration ${version}: typeof state.SelectedNetworkController is string`,
      ),
    );
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

    expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
      new Error(
        `Migration ${version}: typeof state.PermissionController.subjects is string`,
      ),
    );
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
          selectedNetworkClientId: {},
        },
        SelectedNetworkController: {},
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
      new Error(
        `Migration ${version}: typeof state.NetworkController.selectedNetworkClientId is object`,
      ),
    );
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('does nothing if NetworkController.networkConfigurationsByChainId is not an object', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        PermissionController: {
          subjects: {},
        },
        NetworkController: {
          selectedNetworkClientId: 'mainnet',
          networkConfigurationsByChainId: 'foo',
        },
        SelectedNetworkController: {},
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
      new Error(
        `Migration ${version}: typeof state.NetworkController.networkConfigurationsByChainId is string`,
      ),
    );
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
          networkConfigurationsByChainId: {},
        },
        SelectedNetworkController: {
          domains: 'foo',
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
      new Error(
        `Migration ${version}: typeof state.SelectedNetworkController.domains is string`,
      ),
    );
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('does nothing if NetworkController.networkConfigurationsByChainId[] is not an object', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        PermissionController: {
          subjects: {},
        },
        NetworkController: {
          selectedNetworkClientId: 'nonExistentNetworkClientId',
          networkConfigurationsByChainId: {
            '0x1': 'foo',
          },
        },
        SelectedNetworkController: {
          domains: {},
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
      new Error(
        `Migration ${version}: typeof state.NetworkController.networkConfigurationsByChainId["0x1"] is string`,
      ),
    );
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('does nothing if NetworkController.networkConfigurationsByChainId[].rpcEndpoints is not an array', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        PermissionController: {
          subjects: {},
        },
        NetworkController: {
          selectedNetworkClientId: 'nonExistentNetworkClientId',
          networkConfigurationsByChainId: {
            '0x1': {
              rpcEndpoints: 'foo',
            },
          },
        },
        SelectedNetworkController: {
          domains: {},
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
      new Error(
        `Migration ${version}: typeof state.NetworkController.networkConfigurationsByChainId["0x1"].rpcEndpoints is string`,
      ),
    );
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('does nothing if NetworkController.networkConfigurationsByChainId[].rpcEndpoints[] is not an object', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        PermissionController: {
          subjects: {},
        },
        NetworkController: {
          selectedNetworkClientId: 'nonExistentNetworkClientId',
          networkConfigurationsByChainId: {
            '0x1': {
              rpcEndpoints: ['foo'],
            },
          },
        },
        SelectedNetworkController: {
          domains: {},
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
      new Error(
        `Migration ${version}: typeof state.NetworkController.networkConfigurationsByChainId["0x1"].rpcEndpoints[] is string`,
      ),
    );
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('does nothing if the currently selected network client is neither built in nor exists in NetworkController.networkConfigurationsByChainId', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        PermissionController: {
          subjects: {},
        },
        NetworkController: {
          selectedNetworkClientId: 'nonExistentNetworkClientId',
          networkConfigurationsByChainId: {},
        },
        SelectedNetworkController: {
          domains: {},
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
      new Error(
        `Migration ${version}: No chainId found for selectedNetworkClientId "nonExistentNetworkClientId"`,
      ),
    );
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('does nothing if a subject is not an object', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          selectedNetworkClientId: 'mainnet',
          networkConfigurationsByChainId: {},
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

    expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
      new Error(
        `Migration ${version}: Invalid subject for origin "test.com" of type string`,
      ),
    );
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it("does nothing if a subject's permissions is not an object", async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          selectedNetworkClientId: 'mainnet',
          networkConfigurationsByChainId: {},
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

    expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
      new Error(
        `Migration ${version}: Invalid permissions for origin "test.com" of type string`,
      ),
    );
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('does nothing if neither eth_accounts nor permittedChains permissions have been granted', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          selectedNetworkClientId: 'mainnet',
          networkConfigurationsByChainId: {},
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
        networkConfigurationsByChainId: {},
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
        networkConfigurationsByChainId: {},
      },
      '1',
    ],
    [
      'custom',
      {
        selectedNetworkClientId: 'customId',
        networkConfigurationsByChainId: {
          '0xf': {
            rpcEndpoints: [
              {
                networkClientId: 'customId',
              },
            ],
          },
        },
      },
      '15',
    ],
  ])(
    'the currently selected network client is %s',
    (
      _type: string,
      NetworkController: {
        networkConfigurationsByChainId: Record<
          string,
          {
            rpcEndpoints: { networkClientId: string }[];
          }
        >;
      } & Record<string, unknown>,
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
      const baseEthAccountsPermissionMetadata = {
        id: '1',
        date: 2,
        invoker: 'test.com',
        parentCapability: PermissionNames.eth_accounts,
      };
      const currentScope = `eip155:${chainId}`;

      it('does nothing when eth_accounts and permittedChains permissions are missing metadata', async () => {
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
                      invoker: 'test.com',
                      parentCapability: PermissionNames.eth_accounts,
                      date: 2,
                      caveats: [
                        {
                          type: 'restrictReturnedAccounts',
                          value: ['0xdeadbeef', '0x999'],
                        },
                      ],
                    },
                    [PermissionNames.permittedChains]: {
                      invoker: 'test.com',
                      parentCapability: PermissionNames.permittedChains,
                      date: 2,
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
        expect(newStorage.data).toStrictEqual(oldStorage.data);
      });

      it('does nothing when there are malformed network configurations (even if there is a valid networkConfiguration that matches the selected network client)', async () => {
        const oldStorage = {
          meta: { version: oldVersion },
          data: {
            ...baseData(),
            NetworkController: {
              selectedNetworkClientId: 'mainnet',
              networkConfigurationsByChainId: {
                '0x1': {
                  rpcEndpoints: [
                    {
                      networkClientId: 'mainnet',
                    },
                  ],
                },
                '0xInvalid': 'invalid-network-configuration',
                '0xa': {
                  rpcEndpoints: [
                    {
                      networkClientId: 'bar',
                    },
                  ],
                },
              },
            },
            SelectedNetworkController: {
              domains: {
                'test.com': 'bar',
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
                      ...baseEthAccountsPermissionMetadata,
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
        expect(newStorage.data).toStrictEqual(oldStorage.data);
      });

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
                      ...baseEthAccountsPermissionMetadata,
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
                    ...baseEthAccountsPermissionMetadata,
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
                            },
                            'wallet:eip155': {
                              accounts: [
                                'wallet:eip155:0xdeadbeef',
                                'wallet:eip155:0x999',
                              ],
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

      it('replaces the eth_accounts permission with a CAIP-25 permission using the globally selected chain id value for the currently selected chain id when the origin does have its own network client that cannot be resolved', async () => {
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
                      ...baseEthAccountsPermissionMetadata,
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

        expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
          new Error(
            `Migration ${version}: No chainId found for networkClientIdForOrigin "doesNotExist"`,
          ),
        );

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
                    ...baseEthAccountsPermissionMetadata,
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
                            },
                            'wallet:eip155': {
                              accounts: [
                                'wallet:eip155:0xdeadbeef',
                                'wallet:eip155:0x999',
                              ],
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
                      ...baseEthAccountsPermissionMetadata,
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
                    ...baseEthAccountsPermissionMetadata,
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
                            },
                            'wallet:eip155': {
                              accounts: [
                                'wallet:eip155:0xdeadbeef',
                                'wallet:eip155:0x999',
                              ],
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

      it('replaces the eth_accounts permission with a CAIP-25 permission using the eth_accounts value without permitted chains when the origin is snapId', async () => {
        const oldStorage = {
          meta: { version: oldVersion },
          data: {
            ...baseData(),
            PermissionController: {
              subjects: {
                'npm:snap': {
                  permissions: {
                    unrelated: {
                      foo: 'bar',
                    },
                    [PermissionNames.eth_accounts]: {
                      ...baseEthAccountsPermissionMetadata,
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
              'npm:snap': {
                permissions: {
                  unrelated: {
                    foo: 'bar',
                  },
                  'endowment:caip25': {
                    ...baseEthAccountsPermissionMetadata,
                    parentCapability: 'endowment:caip25',
                    caveats: [
                      {
                        type: 'authorizedScopes',
                        value: {
                          requiredScopes: {},
                          optionalScopes: {
                            'wallet:eip155': {
                              accounts: [
                                'wallet:eip155:0xdeadbeef',
                                'wallet:eip155:0x999',
                              ],
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
              networkConfigurationsByChainId: {
                ...baseData().NetworkController.networkConfigurationsByChainId,
                '0xa': {
                  rpcEndpoints: [
                    {
                      networkClientId: 'customNetworkClientId',
                    },
                  ],
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
                      ...baseEthAccountsPermissionMetadata,
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
            networkConfigurationsByChainId: {
              ...baseData().NetworkController.networkConfigurationsByChainId,
              '0xa': {
                rpcEndpoints: [
                  {
                    networkClientId: 'customNetworkClientId',
                  },
                ],
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
                    ...baseEthAccountsPermissionMetadata,
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
                            },
                            'wallet:eip155': {
                              accounts: [
                                'wallet:eip155:0xdeadbeef',
                                'wallet:eip155:0x999',
                              ],
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
                      ...baseEthAccountsPermissionMetadata,
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
                      ...baseEthAccountsPermissionMetadata,
                      caveats: [
                        {
                          type: 'restrictReturnedAccounts',
                          value: ['0xdeadbeef', '0x999'],
                        },
                      ],
                    },
                    [PermissionNames.permittedChains]: {
                      ...baseEthAccountsPermissionMetadata,
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
                    ...baseEthAccountsPermissionMetadata,
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
                            },
                            'eip155:100': {
                              accounts: [
                                'eip155:100:0xdeadbeef',
                                'eip155:100:0x999',
                              ],
                            },
                            'wallet:eip155': {
                              accounts: [
                                'wallet:eip155:0xdeadbeef',
                                'wallet:eip155:0x999',
                              ],
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
                      ...baseEthAccountsPermissionMetadata,
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
                      ...baseEthAccountsPermissionMetadata,
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
                    ...baseEthAccountsPermissionMetadata,
                    parentCapability: 'endowment:caip25',
                    caveats: [
                      {
                        type: 'authorizedScopes',
                        value: {
                          requiredScopes: {},
                          optionalScopes: {
                            [currentScope]: {
                              accounts: [`${currentScope}:0xdeadbeef`],
                            },
                            'wallet:eip155': {
                              accounts: ['wallet:eip155:0xdeadbeef'],
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
                    ...baseEthAccountsPermissionMetadata,
                    parentCapability: 'endowment:caip25',
                    caveats: [
                      {
                        type: 'authorizedScopes',
                        value: {
                          requiredScopes: {},
                          optionalScopes: {
                            [currentScope]: {
                              accounts: [`${currentScope}:0xdeadbeef`],
                            },
                            'wallet:eip155': {
                              accounts: ['wallet:eip155:0xdeadbeef'],
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
