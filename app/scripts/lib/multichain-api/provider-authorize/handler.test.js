import { EthereumRpcError } from 'eth-rpc-errors';
import {
  RestrictedMethods,
} from '../../../../../shared/constants/permissions';
import {
  validateAndFlattenScopes,
  processScopedProperties,
  bucketScopes,
  assertScopesSupported,
} from '../scope';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from '../caip25permissions';
import { providerAuthorizeHandler } from './handler';
import { assignAccountsToScopes, validateAndUpsertEip3085 } from './helpers';

jest.mock('../scope', () => ({
  ...jest.requireActual('../scope'),
  validateAndFlattenScopes: jest.fn(),
  processScopedProperties: jest.fn(),
  bucketScopes: jest.fn(),
  assertScopesSupported: jest.fn(),
}));

jest.mock('./helpers', () => ({
  ...jest.requireActual('./helpers'),
  assignAccountsToScopes: jest.fn(),
  validateAndUpsertEip3085: jest.fn(),
}));

const baseRequest = {
  origin: 'http://test.com',
  params: {
    requiredScopes: {
      eip155: {
        scopes: ['eip155:1', 'eip155:137'],
        methods: [
          'eth_sendTransaction',
          'eth_signTransaction',
          'eth_sign',
          'get_balance',
          'personal_sign',
        ],
        notifications: ['accountsChanged', 'chainChanged'],
      },
    },
    sessionProperties: {
      expiry: 'date',
      foo: 'bar',
    },
  },
};

const createMockedHandler = () => {
  const next = jest.fn();
  const end = jest.fn();
  const requestPermissionApprovalForOrigin = jest.fn().mockResolvedValue({
    approvedAccounts: ['0x1', '0x2', '0x3', '0x4'],
  });
  const grantPermissions = jest.fn().mockResolvedValue(undefined);
  const findNetworkClientIdByChainId = jest.fn().mockReturnValue('mainnet');
  const upsertNetworkConfiguration = jest.fn().mockResolvedValue();
  const removeNetworkConfiguration = jest.fn();
  const multichainMiddlewareManager = {
    addMiddleware: jest.fn(),
    removeMiddleware: jest.fn(),
    removeAllMiddleware: jest.fn(),
    removeAllMiddlewareForDomain: jest.fn(),
  };
  const multichainSubscriptionManager = {
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    unsubscribeAll: jest.fn(),
    unsubscribeDomain: jest.fn(),
    unsubscribeScope: jest.fn(),
  };
  const response = {};
  const handler = (request) =>
    providerAuthorizeHandler(request, response, next, end, {
      findNetworkClientIdByChainId,
      requestPermissionApprovalForOrigin,
      grantPermissions,
      upsertNetworkConfiguration,
      removeNetworkConfiguration,
      multichainMiddlewareManager,
      multichainSubscriptionManager,
    });

  return {
    response,
    next,
    end,
    findNetworkClientIdByChainId,
    requestPermissionApprovalForOrigin,
    grantPermissions,
    upsertNetworkConfiguration,
    removeNetworkConfiguration,
    multichainMiddlewareManager,
    multichainSubscriptionManager,
    handler,
  };
};

describe('provider_authorize', () => {
  beforeEach(() => {
    validateAndFlattenScopes.mockReturnValue({
      flattenedRequiredScopes: {},
      flattenedOptionalScopes: {},
    });
    bucketScopes.mockReturnValue({
      supportedScopes: {},
      supportableScopes: {},
      unsupportableScopes: {},
    });
    assignAccountsToScopes.mockImplementation((value) => value);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('throws an error when unexpected properties are defined in the root level params object', async () => {
    const { handler, end } = createMockedHandler();
    await handler({
      ...baseRequest,
      params: {
        ...baseRequest.params,
        unexpected: 'property',
      },
    });
    expect(end).toHaveBeenCalledWith(
      new EthereumRpcError(
        5301,
        'Session Properties can only be optional and global',
      ),
    );
  });

  it('throws an error when session properties is defined but empty', async () => {
    const { handler, end } = createMockedHandler();
    await handler({
      ...baseRequest,
      params: {
        ...baseRequest.params,
        sessionProperties: {},
      },
    });
    expect(end).toHaveBeenCalledWith(
      new EthereumRpcError(5300, 'Invalid Session Properties requested'),
    );
  });

  it('processes the scopes', async () => {
    const { handler } = createMockedHandler();
    await handler({
      ...baseRequest,
      params: {
        ...baseRequest.params,
        optionalScopes: {
          foo: 'bar',
        },
      },
    });

    expect(validateAndFlattenScopes).toHaveBeenCalledWith(
      baseRequest.params.requiredScopes,
      { foo: 'bar' },
    );
  });

  it('throws an error when processing scopes fails', async () => {
    const { handler, end } = createMockedHandler();
    validateAndFlattenScopes.mockImplementation(() => {
      throw new Error('failed to process scopes');
    });
    await handler(baseRequest);
    expect(end).toHaveBeenCalledWith(new Error('failed to process scopes'));
  });

  it('processes the scopedProperties', async () => {
    const { handler } = createMockedHandler();
    validateAndFlattenScopes.mockReturnValue({
      flattenedRequiredScopes: {
        'eip155:1': {
          methods: ['eth_chainId'],
          notifications: ['accountsChanged', 'chainChanged'],
          accounts: ['eip155:1:0x1', 'eip155:1:0x2'],
        },
      },
      flattenedOptionalScopes: {
        'eip155:64': {
          methods: ['eth_chainId'],
          notifications: ['accountsChanged', 'chainChanged'],
          accounts: ['eip155:64:0x4'],
        },
      },
    });
    await handler({
      ...baseRequest,
      params: {
        ...baseRequest.params,
        scopedProperties: {
          foo: 'bar',
        },
      },
    });

    expect(processScopedProperties).toHaveBeenCalledWith(
      {
        'eip155:1': {
          methods: ['eth_chainId'],
          notifications: ['accountsChanged', 'chainChanged'],
          accounts: ['eip155:1:0x1', 'eip155:1:0x2'],
        },
      },
      {
        'eip155:64': {
          methods: ['eth_chainId'],
          notifications: ['accountsChanged', 'chainChanged'],
          accounts: ['eip155:64:0x4'],
        },
      },
      { foo: 'bar' },
    );
  });

  it('throws an error when processing scopedProperties fails', async () => {
    const { handler, end } = createMockedHandler();
    processScopedProperties.mockImplementation(() => {
      throw new Error('failed to process scoped properties');
    });
    await handler(baseRequest);
    expect(end).toHaveBeenCalledWith(
      new Error('failed to process scoped properties'),
    );
  });

  it('buckets the required scopes', async () => {
    const { handler } = createMockedHandler();
    validateAndFlattenScopes.mockReturnValue({
      flattenedRequiredScopes: {
        'eip155:1': {
          methods: ['eth_chainId'],
          notifications: ['accountsChanged', 'chainChanged'],
          accounts: ['eip155:1:0x1', 'eip155:1:0x2'],
        },
      },
      flattenedOptionalScopes: {},
    });
    await handler(baseRequest);

    expect(bucketScopes).toHaveBeenNthCalledWith(
      1,
      {
        'eip155:1': {
          methods: ['eth_chainId'],
          notifications: ['accountsChanged', 'chainChanged'],
          accounts: ['eip155:1:0x1', 'eip155:1:0x2'],
        },
      },
      expect.objectContaining({
        isChainIdSupported: expect.any(Function),
        isChainIdSupportable: expect.any(Function),
      }),
    );

    const isChainIdSupportedBody =
      bucketScopes.mock.calls[0][1].isChainIdSupported.toString();
    expect(isChainIdSupportedBody).toContain('findNetworkClientIdByChainId');
    const isChainIdSupportableBody =
      bucketScopes.mock.calls[0][1].isChainIdSupportable.toString();
    expect(isChainIdSupportableBody).toContain('validScopedProperties');
  });

  it('asserts any unsupported required scopes', async () => {
    const { handler } = createMockedHandler();
    bucketScopes.mockReturnValueOnce({
      unsupportableScopes: {
        'foo:bar': {
          methods: [],
          notifications: [],
        },
      },
    });
    await handler(baseRequest);

    expect(assertScopesSupported).toHaveBeenNthCalledWith(
      1,
      {
        'foo:bar': {
          methods: [],
          notifications: [],
        },
      },
      expect.objectContaining({
        isChainIdSupported: expect.any(Function),
      }),
    );

    const isChainIdSupportedBody =
      assertScopesSupported.mock.calls[0][1].isChainIdSupported.toString();
    expect(isChainIdSupportedBody).toContain('findNetworkClientIdByChainId');
  });

  it('buckets the optional scopes', async () => {
    const { handler } = createMockedHandler();
    validateAndFlattenScopes.mockReturnValue({
      flattenedRequiredScopes: {},
      flattenedOptionalScopes: {
        'eip155:64': {
          methods: ['eth_chainId'],
          notifications: ['accountsChanged', 'chainChanged'],
          accounts: ['eip155:64:0x4'],
        },
      },
    });
    await handler(baseRequest);

    expect(bucketScopes).toHaveBeenNthCalledWith(
      2,
      {
        'eip155:64': {
          methods: ['eth_chainId'],
          notifications: ['accountsChanged', 'chainChanged'],
          accounts: ['eip155:64:0x4'],
        },
      },
      expect.objectContaining({
        isChainIdSupported: expect.any(Function),
        isChainIdSupportable: expect.any(Function),
      }),
    );

    const isChainIdSupportedBody =
      bucketScopes.mock.calls[1][1].isChainIdSupported.toString();
    expect(isChainIdSupportedBody).toContain('findNetworkClientIdByChainId');
    const isChainIdSupportableBody =
      bucketScopes.mock.calls[1][1].isChainIdSupportable.toString();
    expect(isChainIdSupportableBody).toContain('validScopedProperties');
  });

  it('requests approval for account permission with no args even if there is accounts in the scope', async () => {
    const { handler, requestPermissionApprovalForOrigin } =
      createMockedHandler();
    bucketScopes
      .mockReturnValueOnce({
        supportedScopes: {
          'eip155:1': {
            methods: [],
            notifications: [],
            accounts: ['eip155:1:0x1', 'eip155:1:0x2'],
          },
        },
        supportableScopes: {
          'eip155:5': {
            methods: [],
            notifications: [],
            accounts: ['eip155:5:0x2', 'eip155:5:0x3'],
          },
        },
        unsupportableScopes: {
          'eip155:64': {
            methods: [],
            notifications: [],
            accounts: ['eip155:64:0x4'],
          },
        },
      })
      .mockReturnValueOnce({
        supportedScopes: {
          'eip155:2': {
            methods: [],
            notifications: [],
            accounts: ['eip155:2:0x1', 'eip155:1:0x2'],
          },
        },
        supportableScopes: {
          'eip155:6': {
            methods: [],
            notifications: [],
            accounts: ['eip155:6:0x2', 'eip155:6:0x3'],
          },
        },
        unsupportableScopes: {
          'eip155:65': {
            methods: [],
            notifications: [],
            accounts: ['eip155:65:0x4'],
          },
        },
      });
    await handler(baseRequest);

    expect(requestPermissionApprovalForOrigin).toHaveBeenCalledWith({
      [RestrictedMethods.eth_accounts]: {},
    });
  });

  it('assigns the permitted accounts to the scopeObjects', async () => {
    const { handler } = createMockedHandler();
    bucketScopes
      .mockReturnValueOnce({
        supportedScopes: {
          'eip155:1': {
            methods: [],
            notifications: [],
          },
        },
        supportableScopes: {
          'eip155:5': {
            methods: [],
            notifications: [],
          },
        },
        unsupportableScopes: {
          'eip155:64': {
            methods: [],
            notifications: [],
          },
        },
      })
      .mockReturnValueOnce({
        supportedScopes: {
          'eip155:2': {
            methods: [],
            notifications: [],
          },
        },
        supportableScopes: {
          'eip155:6': {
            methods: [],
            notifications: [],
          },
        },
        unsupportableScopes: {
          'eip155:65': {
            methods: [],
            notifications: [],
          },
        },
      });
    await handler(baseRequest);

    expect(assignAccountsToScopes).toHaveBeenCalledWith(
      {
        'eip155:1': {
          methods: [],
          notifications: [],
        },
      },
      ['0x1', '0x2', '0x3', '0x4'],
    );
    expect(assignAccountsToScopes).toHaveBeenCalledWith(
      {
        'eip155:5': {
          methods: [],
          notifications: [],
        },
      },
      ['0x1', '0x2', '0x3', '0x4'],
    );
    expect(assignAccountsToScopes).toHaveBeenCalledWith(
      {
        'eip155:2': {
          methods: [],
          notifications: [],
        },
      },
      ['0x1', '0x2', '0x3', '0x4'],
    );
    expect(assignAccountsToScopes).toHaveBeenCalledWith(
      {
        'eip155:6': {
          methods: [],
          notifications: [],
        },
      },
      ['0x1', '0x2', '0x3', '0x4'],
    );
  });

  it('throws an error when requesting account permission approval fails', async () => {
    const { handler, requestPermissionApprovalForOrigin, end } =
      createMockedHandler();
    requestPermissionApprovalForOrigin.mockImplementation(() => {
      throw new Error('failed to request account permission approval');
    });
    await handler(baseRequest);
    expect(end).toHaveBeenCalledWith(
      new Error('failed to request account permission approval'),
    );
  });

  it('validates and upserts EIP 3085 scoped properties when matching sessionScope is defined', async () => {
    const {
      handler,
      findNetworkClientIdByChainId,
      upsertNetworkConfiguration,
    } = createMockedHandler();
    bucketScopes
      .mockReturnValueOnce({
        supportedScopes: {
          'eip155:1': {
            methods: [],
            notifications: [],
            accounts: ['eip155:1:0x1'],
          },
        },
        supportableScopes: {},
        unsupportableScopes: {},
      })
      .mockReturnValueOnce({
        supportedScopes: {},
        supportableScopes: {},
        unsupportableScopes: {},
      });
    await handler({
      ...baseRequest,
      params: {
        ...baseRequest.params,
        scopedProperties: {
          'eip155:1': {
            eip3085: {
              foo: 'bar',
            },
          },
        },
      },
    });

    expect(validateAndUpsertEip3085).toHaveBeenCalledWith({
      eip3085Params: { foo: 'bar' },
      origin: 'http://test.com',
      upsertNetworkConfiguration,
      findNetworkClientIdByChainId,
    });
  });

  it('does not validate and upsert EIP 3085 scoped properties when there is no matching sessionScope', async () => {
    const { handler } = createMockedHandler();
    bucketScopes
      .mockReturnValueOnce({
        supportedScopes: {
          'eip155:1': {
            methods: [],
            notifications: [],
            accounts: ['eip155:1:0x1'],
          },
        },
        supportableScopes: {},
        unsupportableScopes: {},
      })
      .mockReturnValueOnce({
        supportedScopes: {},
        supportableScopes: {},
        unsupportableScopes: {},
      });
    await handler({
      ...baseRequest,
      params: {
        ...baseRequest.params,
        scopedProperties: {
          'eip155:99999': {
            eip3085: {
              foo: 'bar',
            },
          },
        },
      },
    });

    expect(validateAndUpsertEip3085).not.toHaveBeenCalled();
  });

  it('grants the CAIP-25 permission for the supported and supportable scopes', async () => {
    const { handler, grantPermissions } = createMockedHandler();
    bucketScopes
      .mockReturnValueOnce({
        supportedScopes: {
          'eip155:1': {
            methods: ['eth_chainId'],
            notifications: ['accountsChanged'],
            accounts: ['eip155:1:0x1', 'eip155:1:0x2'],
          },
        },
        supportableScopes: {
          'eip155:2': {
            methods: ['eth_chainId'],
            notifications: [],
          },
        },
        unsupportableScopes: {},
      })
      .mockReturnValueOnce({
        supportedScopes: {
          'eip155:1': {
            methods: ['eth_sendTransaction'],
            notifications: ['chainChanged'],
            accounts: ['eip155:1:0x1', 'eip155:1:0x3'],
          },
        },
        supportableScopes: {
          'eip155:64': {
            methods: ['net_version'],
            notifications: ['chainChanged'],
          },
        },
        unsupportableScopes: {},
      });
    await handler(baseRequest);

    expect(grantPermissions).toHaveBeenCalledWith({
      subject: { origin: 'http://test.com' },
      approvedPermissions: {
        [Caip25EndowmentPermissionName]: {
          caveats: [
            {
              type: Caip25CaveatType,
              value: {
                requiredScopes: {
                  'eip155:1': {
                    methods: ['eth_chainId'],
                    notifications: ['accountsChanged'],
                    accounts: ['eip155:1:0x1', 'eip155:1:0x2'],
                  },
                  'eip155:2': {
                    methods: ['eth_chainId'],
                    notifications: [],
                  },
                },
                optionalScopes: {
                  'eip155:1': {
                    methods: ['eth_sendTransaction'],
                    notifications: ['chainChanged'],
                    accounts: ['eip155:1:0x1', 'eip155:1:0x3'],
                  },
                  'eip155:64': {
                    methods: ['net_version'],
                    notifications: ['chainChanged'],
                  },
                },
                isMultichainOrigin: true,
              },
            },
          ],
        },
      },
    });
  });

  it('throws an error when granting the CAIP-25 permission fails', async () => {
    const { handler, grantPermissions, end } = createMockedHandler();
    grantPermissions.mockImplementation(() => {
      throw new Error('failed to grant CAIP-25 permissions');
    });
    await handler(baseRequest);
    expect(end).toHaveBeenCalledWith(
      new Error('failed to grant CAIP-25 permissions'),
    );
  });

  it('returns the session ID, properties, and merged scopes', async () => {
    const { handler, response } = createMockedHandler();
    bucketScopes
      .mockReturnValueOnce({
        supportedScopes: {
          'eip155:1': {
            methods: ['eth_chainId'],
            notifications: ['accountsChanged'],
            accounts: ['eip155:1:0x1', 'eip155:1:0x2'],
          },
        },
        supportableScopes: {
          'eip155:2': {
            methods: ['eth_chainId'],
            notifications: [],
          },
        },
        unsupportableScopes: {},
      })
      .mockReturnValueOnce({
        supportedScopes: {
          'eip155:1': {
            methods: ['eth_sendTransaction'],
            notifications: ['chainChanged'],
            accounts: ['eip155:1:0x1', 'eip155:1:0x3'],
          },
        },
        supportableScopes: {
          'eip155:64': {
            methods: ['net_version'],
            notifications: ['chainChanged'],
          },
        },
        unsupportableScopes: {},
      });
    await handler(baseRequest);

    expect(response.result).toStrictEqual({
      sessionId: '0xdeadbeef',
      sessionProperties: {
        expiry: 'date',
        foo: 'bar',
      },
      sessionScopes: {
        'eip155:1': {
          methods: ['eth_chainId', 'eth_sendTransaction'],
          notifications: ['accountsChanged', 'chainChanged'],
          accounts: ['eip155:1:0x1', 'eip155:1:0x2', 'eip155:1:0x3'],
        },
        'eip155:2': {
          methods: ['eth_chainId'],
          notifications: [],
        },
        'eip155:64': {
          methods: ['net_version'],
          notifications: ['chainChanged'],
        },
      },
    });
  });

  it('reverts any upserted network clients if the request fails', async () => {
    const { handler, removeNetworkConfiguration, grantPermissions } =
      createMockedHandler();
    bucketScopes
      .mockReturnValueOnce({
        supportedScopes: {
          'eip155:1': {
            methods: [],
            notifications: [],
          },
        },
        supportableScopes: {},
        unsupportableScopes: {},
      })
      .mockReturnValueOnce({
        supportedScopes: {},
        supportableScopes: {},
        unsupportableScopes: {},
      });
    processScopedProperties.mockReturnValue({
      'eip155:1': {
        eip3085: {
          foo: 'bar',
        },
      },
    });
    validateAndUpsertEip3085.mockReturnValue('networkClientId1');
    grantPermissions.mockImplementation(() => {
      throw new Error('failed to grant permission');
    });

    await handler({
      ...baseRequest,
      params: {
        ...baseRequest.params,
        scopedProperties: {
          'eip155:1': {
            eip3085: {
              foo: 'bar',
            },
          },
        },
      },
    });

    expect(removeNetworkConfiguration).toHaveBeenCalledWith('networkClientId1');
  });
});
