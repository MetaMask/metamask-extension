import { NetworkConfiguration } from '@metamask/network-controller';
import { migrate, version } from './134.1';

describe(`Migration ${version}`, () => {
  let originalSentry: typeof global.sentry;
  let sentryCaptureExceptionMock: jest.Mock;

  beforeAll(() => {
    originalSentry = global.sentry;
    sentryCaptureExceptionMock = jest.fn();
    global.sentry = {
      captureException: sentryCaptureExceptionMock,
    };
  });

  afterAll(() => {
    global.sentry = originalSentry;
  });

  afterEach(() => {
    sentryCaptureExceptionMock.mockClear();
  });

  it('updates the meta version to 134.1 regardless of state content', async () => {
    const dummyState = {
      meta: { version: 0 },
      data: {},
    };

    const migrated = await migrate(dummyState);
    expect(migrated.meta.version).toBe(134.1);
  });

  it('returns original state if AccountsController is missing', async () => {
    const originalState = {
      meta: { version: 0 },
      data: {
        NetworkController: {},
        TokensController: {},
      },
    };
    const result = await migrate(originalState);

    expect(result.data).toEqual(originalState.data);
    expect(result.meta.version).toBe(134.1);
  });

  it('returns original state if AccountsController is not an object', async () => {
    const originalState = {
      meta: { version: 0 },
      data: {
        AccountsController: 'invalid-type',
        NetworkController: {},
        TokensController: {},
      },
    };
    const result = await migrate(originalState);
    expect(sentryCaptureExceptionMock).toHaveBeenCalled();
    expect(result.data).toEqual(originalState.data);
  });

  it('returns original state if internalAccounts is invalid', async () => {
    const originalState = {
      meta: { version: 0 },
      data: {
        AccountsController: {},
        NetworkController: {},
        TokensController: {},
      },
    };
    const result = await migrate(originalState);
    expect(sentryCaptureExceptionMock).toHaveBeenCalled();
    expect(result.data).toEqual(originalState.data);
  });

  it('returns original state if selectedAccount is missing or empty', async () => {
    const originalState = {
      meta: { version: 0 },
      data: {
        AccountsController: {
          internalAccounts: {},
        },
        NetworkController: {},
        TokensController: {},
      },
    };

    const result = await migrate(originalState);
    expect(sentryCaptureExceptionMock).toHaveBeenCalled();
    expect(result.data).toEqual(originalState.data);
  });

  it('returns original state if NetworkController is missing', async () => {
    const originalState = {
      meta: { version: 0 },
      data: {
        AccountsController: {
          internalAccounts: { selectedAccount: '0x123' },
        },
        TokensController: {},
      },
    };

    const result = await migrate(originalState);
    expect(sentryCaptureExceptionMock).toHaveBeenCalled();
    expect(result.data).toEqual(originalState.data);
  });

  it('returns original state if selectedNetworkClientId is missing or empty', async () => {
    const originalState = {
      meta: { version: 0 },
      data: {
        AccountsController: {
          internalAccounts: { selectedAccount: '0x123' },
        },
        NetworkController: {},
        TokensController: {},
      },
    };

    const result = await migrate(originalState);
    expect(sentryCaptureExceptionMock).toHaveBeenCalled();
    expect(result.data).toEqual(originalState.data);
  });

  it('returns original state if networkConfigurationsByChainId is missing or invalid', async () => {
    const originalState = {
      meta: { version: 0 },
      data: {
        AccountsController: {
          internalAccounts: { selectedAccount: '0x123' },
        },
        NetworkController: {
          selectedNetworkClientId: 'mainnet',
        },
        TokensController: {},
      },
    };

    const result = await migrate(originalState);
    expect(sentryCaptureExceptionMock).toHaveBeenCalled();
    expect(result.data).toEqual(originalState.data);
  });

  it('returns original state if getChainIdForNetworkClientId returns undefined', async () => {
    const originalState = {
      meta: { version: 0 },
      data: {
        AccountsController: {
          internalAccounts: { selectedAccount: '0x123' },
        },
        NetworkController: {
          selectedNetworkClientId: 'non-existent-network-client-id',
          networkConfigurationsByChainId: {
            '0x1': {
              rpcEndpoints: [
                {
                  networkClientId: 'some-other-network-client-id',
                },
              ],
            },
          },
        },
        TokensController: {},
      },
    };

    const result = await migrate(originalState);
    expect(sentryCaptureExceptionMock).toHaveBeenCalled();
    expect(result.data).toEqual(originalState.data);
  });

  it('returns original state if TokensController is missing', async () => {
    const originalState = {
      meta: { version: 0 },
      data: {
        AccountsController: {
          internalAccounts: { selectedAccount: '0x123' },
        },
        NetworkController: {
          selectedNetworkClientId: 'mainnet',
          networkConfigurationsByChainId: {
            '0x1': {
              rpcEndpoints: [{ networkClientId: 'mainnet' }],
            },
          },
        },
      },
    };

    const result = await migrate(originalState);
    expect(sentryCaptureExceptionMock).toHaveBeenCalled();
    expect(result.data).toEqual(originalState.data);
  });

  it('returns original state if allTokens is missing or invalid', async () => {
    const originalState = {
      meta: { version: 0 },
      data: {
        AccountsController: {
          internalAccounts: { selectedAccount: '0x123' },
        },
        NetworkController: {
          selectedNetworkClientId: 'mainnet',
          networkConfigurationsByChainId: {
            '0x1': {
              rpcEndpoints: [{ networkClientId: 'mainnet' }],
            },
          },
        },
        TokensController: {},
      },
    };

    const result = await migrate(originalState);
    expect(sentryCaptureExceptionMock).toHaveBeenCalled();
    expect(result.data).toEqual(originalState.data);
  });

  it('returns original state if allTokens[currentChainId] is not an object', async () => {
    const originalState = {
      meta: { version: 0 },
      data: {
        AccountsController: {
          internalAccounts: { selectedAccount: '0x123' },
        },
        NetworkController: {
          selectedNetworkClientId: 'mainnet',
          networkConfigurationsByChainId: {
            '0x1': {
              rpcEndpoints: [{ networkClientId: 'mainnet' }],
            },
          },
        },
        TokensController: {
          allTokens: {
            '0x1': null,
          },
        },
      },
    };

    const result = await migrate(originalState);
    expect(result.data).toEqual(originalState.data);
  });

  it('returns original state if allTokens[currentChainId][selectedAccount] is not an array', async () => {
    const originalState = {
      meta: { version: 0 },
      data: {
        AccountsController: {
          internalAccounts: {
            selectedAccount: '0x123',
            accounts: {
              '0x123': {
                address: '0x123',
              },
            },
          },
        },
        NetworkController: {
          selectedNetworkClientId: 'mainnet',
          networkConfigurationsByChainId: {
            '0x1': {
              rpcEndpoints: [{ networkClientId: 'mainnet' }],
            },
          },
        },
        TokensController: {
          allTokens: {
            '0x1': {
              '0x123': 'not-an-array',
            },
          },
        },
      },
    };

    const result = await migrate(originalState);
    expect(sentryCaptureExceptionMock).not.toHaveBeenCalled();
    expect(result.data).toEqual(originalState.data);
  });

  it('updates TokensController.tokens when all data is valid', async () => {
    const originalTokens = [{ address: '0xtokenA' }, { address: '0xtokenB' }];
    const originalState = {
      meta: { version: 0 },
      data: {
        AccountsController: {
          internalAccounts: {
            selectedAccount: 'id1',
            accounts: { id1: { address: '0x123' } },
          },
        },
        NetworkController: {
          selectedNetworkClientId: 'mainnet',
          networkConfigurationsByChainId: {
            '0x1': {
              rpcEndpoints: [{ networkClientId: 'mainnet' }],
            },
          },
        },
        TokensController: {
          allTokens: {
            '0x1': {
              '0x123': originalTokens,
            },
          },
          tokens: [{ address: '0xOLD' }],
        },
      },
    };

    const result = await migrate(originalState);

    expect(sentryCaptureExceptionMock).not.toHaveBeenCalled();

    const tokensControllerState = result.data.TokensController as Record<
      string,
      NetworkConfiguration
    >;
    expect(tokensControllerState.tokens).toEqual(originalTokens);

    expect(result.meta.version).toBe(134.1);
  });

  it('returns original state and logs error if tokens is not empty but allTokensForChain is not an object', async () => {
    const originalState = {
      meta: { version: 0 },
      data: {
        AccountsController: {
          internalAccounts: {
            selectedAccount: 'id1',
            accounts: { id1: { address: '0x123' } },
          },
        },
        NetworkController: {
          selectedNetworkClientId: 'mainnet',
          networkConfigurationsByChainId: {
            '0x1': {
              rpcEndpoints: [{ networkClientId: 'mainnet' }],
            },
          },
        },
        TokensController: {
          tokens: [{ address: '0xtokenA' }], // Non-empty tokens array
          allTokens: {
            '0x1': null, // allTokensForChain is not an object
          },
        },
      },
    };

    const result = await migrate(originalState);

    expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining(
          `Migration ${version}: tokens is not an empty array, but allTokensForChain is not an object.`,
        ),
      }),
    );

    expect(result.data).toEqual(originalState.data);
  });

  it('returns original state and logs error if tokens is not empty but allTokensForChain is not an object', async () => {
    const originalState = {
      meta: { version: 0 },
      data: {
        AccountsController: {
          internalAccounts: {
            selectedAccount: 'id1',
            accounts: {
              id1: {
                address: '0x123',
              },
            },
          },
        },
        NetworkController: {
          selectedNetworkClientId: 'mainnet',
          networkConfigurationsByChainId: {
            '0x1': {
              rpcEndpoints: [{ networkClientId: 'mainnet' }],
            },
          },
        },
        TokensController: {
          tokens: [{ address: '0xtokenA' }], // Non-empty tokens array
          allTokens: {
            '0x1': null, // allTokensForChain is not an object
          },
        },
      },
    };

    const result = await migrate(originalState);

    expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining(
          `Migration ${version}: tokens is not an empty array, but allTokensForChain is not an object.`,
        ),
      }),
    );

    expect(result.data).toEqual(originalState.data);
  });
});
