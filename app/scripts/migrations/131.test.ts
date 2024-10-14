import { migrate, version } from './131';

const PermissionNames = {
  eth_accounts: 'eth_accounts',
  permittedChains: 'endowment:permitted-chains',
};

const sentryCaptureExceptionMock = jest.fn();

global.sentry = {
  captureException: sentryCaptureExceptionMock,
};

const oldVersion = 130;

describe('migration #131', () => {
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

    expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
      new Error(
        `Migration ${version}: typeof state.PermissionController is undefined`,
      ),
    );
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

  it('does nothing if SelectedNetworkController state is missing', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        PermissionController: {},
        NetworkController: {},
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
      new Error(
        `Migration ${version}: typeof state.SelectedNetworkController is undefined`,
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

    expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
      new Error(
        `Migration ${version}: typeof state.NetworkController.networkConfigurations is string`,
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
          networkConfigurations: {},
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

    expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
      new Error(
        `Migration ${version}: Invalid chainId for selectedNetworkClientId "nonExistentNetworkClientId" of type undefined`,
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
      NetworkController: {
        networkConfigurations: Record<string, unknown>;
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
                              methods: [],
                              notifications: [],
                            },
                            'wallet:eip155': {
                              accounts: [
                                'wallet:eip155:0xdeadbeef',
                                'wallet:eip155:0x999',
                              ],
                              methods: [],
                              notifications: [],
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
                              methods: [],
                              notifications: [],
                            },
                            'wallet:eip155': {
                              accounts: [
                                'wallet:eip155:0xdeadbeef',
                                'wallet:eip155:0x999',
                              ],
                              methods: [],
                              notifications: [],
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
                              methods: [],
                              notifications: [],
                            },
                            'wallet:eip155': {
                              accounts: [
                                'wallet:eip155:0xdeadbeef',
                                'wallet:eip155:0x999',
                              ],
                              methods: [],
                              notifications: [],
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
                              methods: [],
                              notifications: [],
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
                              methods: [],
                              notifications: [],
                            },
                            'wallet:eip155': {
                              accounts: [
                                'wallet:eip155:0xdeadbeef',
                                'wallet:eip155:0x999',
                              ],
                              methods: [],
                              notifications: [],
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
                              methods: [],
                              notifications: [],
                            },
                            'eip155:100': {
                              accounts: [
                                'eip155:100:0xdeadbeef',
                                'eip155:100:0x999',
                              ],
                              methods: [],
                              notifications: [],
                            },
                            'wallet:eip155': {
                              accounts: [
                                'wallet:eip155:0xdeadbeef',
                                'wallet:eip155:0x999',
                              ],
                              methods: [],
                              notifications: [],
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
                              methods: [],
                              notifications: [],
                            },
                            'wallet:eip155': {
                              accounts: [
                                'wallet:eip155:0xdeadbeef',
                              ],
                              methods: [],
                              notifications: [],
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
                              methods: [],
                              notifications: [],
                            },
                            'wallet:eip155': {
                              accounts: [
                                'wallet:eip155:0xdeadbeef',
                              ],
                              methods: [],
                              notifications: [],
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
