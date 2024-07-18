import { EthereumRpcError } from 'eth-rpc-errors';
import {
  CaveatTypes,
  RestrictedMethods,
} from '../../../../../shared/constants/permissions';
import {
  processScopes,
  processScopedProperties,
  assertScopesSupported,
  filterScopesSupported,
} from '../scope';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from '../caip25permissions';
import { providerAuthorizeHandler } from './handler';
import { assignAccountsToScopes, validateAndUpsertEip3085 } from './helpers';

jest.mock('../scope', () => ({
  ...jest.requireActual('../scope'),
  processScopes: jest.fn(),
  processScopedProperties: jest.fn(),
  assertScopesSupported: jest.fn(),
  filterScopesSupported: jest.fn(),
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
  const requestPermissions = jest.fn().mockResolvedValue([
    {
      eth_accounts: {
        caveats: [
          {
            type: CaveatTypes.restrictReturnedAccounts,
            value: ['0x1', '0x2', '0x3', '0x4'],
          },
        ],
      },
    },
  ]);
  const grantPermissions = jest.fn().mockResolvedValue(undefined);
  const findNetworkClientIdByChainId = jest.fn().mockReturnValue('mainnet');
  const upsertNetworkConfiguration = jest.fn().mockResolvedValue();
  const removeNetworkConfiguration = jest.fn();
  const response = {};
  const handler = (request) =>
    providerAuthorizeHandler(request, response, next, end, {
      findNetworkClientIdByChainId,
      requestPermissions,
      grantPermissions,
      upsertNetworkConfiguration,
      removeNetworkConfiguration,
    });

  return {
    response,
    next,
    end,
    findNetworkClientIdByChainId,
    requestPermissions,
    grantPermissions,
    upsertNetworkConfiguration,
    removeNetworkConfiguration,
    handler,
  };
};

describe('provider_authorize', () => {
  beforeEach(() => {
    processScopes.mockReturnValue({
      flattenedRequiredScopes: {},
      flattenedOptionalScopes: {},
    });
    filterScopesSupported.mockImplementation((value) => value);
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

    expect(processScopes).toHaveBeenCalledWith(
      baseRequest.params.requiredScopes,
      { foo: 'bar' },
    );
  });

  it('throws an error when processing scopes fails', async () => {
    const { handler, end } = createMockedHandler();
    processScopes.mockImplementation(() => {
      throw new Error('failed to process scopes');
    });
    await handler(baseRequest);
    expect(end).toHaveBeenCalledWith(new Error('failed to process scopes'));
  });

  it('processes the scopedProperties', async () => {
    const { handler } = createMockedHandler();
    processScopes.mockReturnValue({
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

  it('asserts all validated required scopes can be supported', async () => {
    const { handler } = createMockedHandler();
    processScopes.mockReturnValue({
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
    await handler(baseRequest);

    expect(assertScopesSupported).toHaveBeenNthCalledWith(
      1,
      {
        'eip155:1': {
          methods: ['eth_chainId'],
          notifications: ['accountsChanged', 'chainChanged'],
          accounts: ['eip155:1:0x1', 'eip155:1:0x2'],
        },
      },
      expect.objectContaining({
        existsNetworkClientForChainId: expect.any(Function),
      }),
    );

    const existsNetworkClientForChainIdBody =
      assertScopesSupported.mock.calls[0][1].existsNetworkClientForChainId.toString();
    expect(existsNetworkClientForChainIdBody).toContain(
      'validScopedProperties',
    );
    expect(existsNetworkClientForChainIdBody).toContain(
      'findNetworkClientIdByChainId',
    );
  });

  it('filters the valid optional scopes for those that can be supported', async () => {
    const { handler } = createMockedHandler();
    processScopes.mockReturnValue({
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
    await handler(baseRequest);

    expect(filterScopesSupported).toHaveBeenNthCalledWith(
      1,
      {
        'eip155:64': {
          methods: ['eth_chainId'],
          notifications: ['accountsChanged', 'chainChanged'],
          accounts: ['eip155:64:0x4'],
        },
      },
      expect.objectContaining({
        existsNetworkClientForChainId: expect.any(Function),
      }),
    );

    const existsNetworkClientForChainIdBody =
      filterScopesSupported.mock.calls[0][1].existsNetworkClientForChainId.toString();
    expect(existsNetworkClientForChainIdBody).toContain(
      'validScopedProperties',
    );
    expect(existsNetworkClientForChainIdBody).toContain(
      'findNetworkClientIdByChainId',
    );
  });

  it('requests permissions with no args even if there is accounts in the scope', async () => {
    const { handler, requestPermissions } = createMockedHandler();
    processScopes.mockReturnValue({
      flattenedRequiredScopes: {
        'eip155:1': {
          methods: ['eth_chainId'],
          notifications: ['accountsChanged', 'chainChanged'],
          accounts: ['eip155:1:0x1', 'eip155:1:0x2'],
        },
        'eip155:5': {
          methods: ['eth_chainId'],
          notifications: ['accountsChanged', 'chainChanged'],
          accounts: ['eip155:5:0x2', 'eip155:5:0x3'],
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
    await handler(baseRequest);

    expect(requestPermissions).toHaveBeenCalledWith(
      { origin: 'http://test.com' },
      {
        [RestrictedMethods.eth_accounts]: {},
      },
    );
  });

  it('assigns the permitted accounts to the scopeObjects', async () => {
    const { handler } = createMockedHandler();
    processScopes.mockReturnValue({
      flattenedRequiredScopes: {
        'eip155:1': {
          methods: ['eth_chainId'],
          notifications: ['accountsChanged', 'chainChanged'],
          accounts: ['eip155:1:0x1', 'eip155:1:0x2'],
        },
        'eip155:5': {
          methods: ['eth_chainId'],
          notifications: ['accountsChanged', 'chainChanged'],
          accounts: ['eip155:5:0x2', 'eip155:5:0x3'],
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
    await handler(baseRequest);

    expect(assignAccountsToScopes).toHaveBeenCalledWith(
      {
        'eip155:1': {
          methods: ['eth_chainId'],
          notifications: ['accountsChanged', 'chainChanged'],
          accounts: ['eip155:1:0x1', 'eip155:1:0x2'],
        },
        'eip155:5': {
          methods: ['eth_chainId'],
          notifications: ['accountsChanged', 'chainChanged'],
          accounts: ['eip155:5:0x2', 'eip155:5:0x3'],
        },
      },
      ['0x1', '0x2', '0x3', '0x4'],
    );
    expect(assignAccountsToScopes).toHaveBeenCalledWith(
      {
        'eip155:64': {
          methods: ['eth_chainId'],
          notifications: ['accountsChanged', 'chainChanged'],
          accounts: ['eip155:64:0x4'],
        },
      },
      ['0x1', '0x2', '0x3', '0x4'],
    );
  });

  it('throws an error when requesting account permission fails', async () => {
    const { handler, requestPermissions, end } = createMockedHandler();
    requestPermissions.mockImplementation(() => {
      throw new Error('failed to request account permissions');
    });
    processScopes.mockReturnValue({
      flattenedRequiredScopes: {
        'eip155:1': {
          methods: [],
          notifications: [],
          accounts: ['eip155:1:0x1'],
        },
      },
      flattenedOptionalScopes: {},
    });
    await handler(baseRequest);
    expect(end).toHaveBeenCalledWith(
      new Error('failed to request account permissions'),
    );
  });

  it('validates and upserts EIP 3085 scoped properties when matching sessionScope is defined', async () => {
    const {
      handler,
      findNetworkClientIdByChainId,
      upsertNetworkConfiguration,
    } = createMockedHandler();
    processScopes.mockReturnValue({
      flattenedRequiredScopes: {
        'eip155:1': {
          methods: [],
          notifications: [],
          accounts: ['eip155:1:0x1'],
        },
      },
      flattenedOptionalScopes: {},
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
    processScopes.mockReturnValue({
      flattenedRequiredScopes: {
        'eip155:1': {
          methods: [],
          notifications: [],
          accounts: ['eip155:1:0x1'],
        },
      },
      flattenedOptionalScopes: {},
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

  it('asserts the session scopes are supported', async () => {
    const { handler } = createMockedHandler();
    processScopes.mockReturnValue({
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

    await handler(baseRequest);

    expect(assertScopesSupported).toHaveBeenNthCalledWith(
      2,
      {
        'eip155:1': {
          methods: ['eth_chainId'],
          notifications: ['accountsChanged', 'chainChanged'],
          accounts: ['eip155:1:0x1', 'eip155:1:0x2'],
        },
        'eip155:64': {
          methods: ['eth_chainId'],
          notifications: ['accountsChanged', 'chainChanged'],
          accounts: ['eip155:64:0x4'],
        },
      },
      expect.objectContaining({
        existsNetworkClientForChainId: expect.any(Function),
      }),
    );

    const existsNetworkClientForChainIdBody =
      assertScopesSupported.mock.calls[1][1].existsNetworkClientForChainId.toString();
    expect(existsNetworkClientForChainIdBody).not.toContain(
      'validScopedProperties',
    );
    expect(existsNetworkClientForChainIdBody).toContain(
      'findNetworkClientIdByChainId',
    );
  });

  it('throws if the session scopes are not supported', async () => {
    const { handler, end } = createMockedHandler();
    processScopes.mockReturnValue({
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
    let callCount = 0;
    assertScopesSupported.mockImplementation(() => {
      if (callCount === 1) {
        throw new Error('scopes not supported');
      }
      callCount += 1;
    });

    await handler(baseRequest);

    expect(end).toHaveBeenCalledWith(new Error('scopes not supported'));
  });

  it('grants the CAIP-25 permission for the processed scopes', async () => {
    const { handler, grantPermissions } = createMockedHandler();
    processScopes.mockReturnValue({
      flattenedRequiredScopes: {
        'eip155:1': {
          methods: ['eth_chainId'],
          notifications: ['accountsChanged', 'chainChanged'],
          accounts: ['eip155:1:0x1', 'eip155:1:0x2'],
        },
      },
      flattenedOptionalScopes: {
        'eip155:64': {
          methods: ['net_version'],
          notifications: ['accountsChanged', 'chainChanged'],
          accounts: ['eip155:64:0x4'],
        },
      },
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
                    notifications: ['accountsChanged', 'chainChanged'],
                    accounts: ['eip155:1:0x1', 'eip155:1:0x2'],
                  },
                },
                optionalScopes: {
                  'eip155:64': {
                    methods: ['net_version'],
                    notifications: ['accountsChanged', 'chainChanged'],
                    accounts: ['eip155:64:0x4'],
                  },
                },
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
    processScopes.mockReturnValue({
      flattenedRequiredScopes: {
        'eip155:1': {
          methods: ['eth_chainId'],
          notifications: ['accountsChanged', 'chainChanged'],
        },
        'eip155:2': {
          methods: ['eth_chainId'],
          notifications: [],
        },
      },
      flattenedOptionalScopes: {
        'eip155:1': {
          methods: ['eth_sendTransaction'],
          notifications: ['chainChanged'],
        },
        'eip155:64': {
          methods: ['net_version'],
          notifications: ['chainChanged'],
        },
      },
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
    const { handler, removeNetworkConfiguration } = createMockedHandler();
    processScopes.mockReturnValue({
      flattenedRequiredScopes: {
        'eip155:1': {
          methods: [],
          notifications: [],
          accounts: ['eip155:1:0x1'],
        },
      },
      flattenedOptionalScopes: {},
    });
    processScopedProperties.mockReturnValue({
      'eip155:1': {
        eip3085: {
          foo: 'bar',
        },
      },
    });
    validateAndUpsertEip3085.mockReturnValue('networkClientId1');
    let callCount = 0;
    assertScopesSupported.mockImplementation(() => {
      if (callCount === 1) {
        throw new Error('scopes not supported');
      }
      callCount += 1;
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
