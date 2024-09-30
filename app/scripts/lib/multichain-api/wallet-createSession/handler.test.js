import { EthereumRpcError } from 'eth-rpc-errors';
import { CaveatTypes } from '../../../../../shared/constants/permissions';
import {
  validateAndFlattenScopes,
  processScopedProperties,
  bucketScopes,
  assertScopesSupported,
  KnownRpcMethods,
  KnownNotifications,
} from '../scope';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from '../caip25permissions';
import { shouldEmitDappViewedEvent } from '../../util';
import { PermissionNames } from '../../../controllers/permissions';
import { walletCreateSessionHandler } from './handler';
import { validateAndAddEip3085 } from './helpers';

jest.mock('../../util', () => ({
  ...jest.requireActual('../../util'),
  shouldEmitDappViewedEvent: jest.fn(),
}));

jest.mock('../scope', () => ({
  ...jest.requireActual('../scope/assert'),
  ...jest.requireActual('../scope/authorization'),
  ...jest.requireActual('../scope/filter'),
  ...jest.requireActual('../scope/scope'),
  ...jest.requireActual('../scope/supported'),
  ...jest.requireActual('../scope/transform'),
  ...jest.requireActual('../scope/validation'),
  validateAndFlattenScopes: jest.fn(),
  processScopedProperties: jest.fn(),
  bucketScopes: jest.fn(),
  assertScopesSupported: jest.fn(),
}));

jest.mock('./helpers', () => ({
  ...jest.requireActual('./helpers'),
  validateAndAddEip3085: jest.fn(),
}));

const baseRequest = {
  origin: 'http://test.com',
  params: {
    requiredScopes: {
      eip155: {
        references: ['1', '137'],
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
    approvedChainIds: ['0x1', '0x5'],
  });
  const grantPermissions = jest.fn().mockResolvedValue(undefined);
  const findNetworkClientIdByChainId = jest.fn().mockReturnValue('mainnet');
  const addNetwork = jest.fn().mockResolvedValue();
  const removeNetwork = jest.fn();
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
  const sendMetrics = jest.fn();
  const metamaskState = {
    permissionHistory: {},
    metaMetricsId: 'metaMetricsId',
    accounts: {
      '0x1': {},
      '0x2': {},
      '0x3': {},
    },
  };
  const listAccounts = jest.fn().mockReturnValue([]);
  const response = {};
  const handler = (request) =>
    walletCreateSessionHandler(request, response, next, end, {
      findNetworkClientIdByChainId,
      requestPermissionApprovalForOrigin,
      grantPermissions,
      addNetwork,
      removeNetwork,
      multichainMiddlewareManager,
      multichainSubscriptionManager,
      metamaskState,
      sendMetrics,
      listAccounts,
    });

  return {
    response,
    next,
    end,
    findNetworkClientIdByChainId,
    requestPermissionApprovalForOrigin,
    grantPermissions,
    addNetwork,
    removeNetwork,
    multichainMiddlewareManager,
    multichainSubscriptionManager,
    metamaskState,
    sendMetrics,
    listAccounts,
    handler,
  };
};

describe('wallet_createSession', () => {
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
  });

  afterEach(() => {
    jest.resetAllMocks();
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
      new EthereumRpcError(5302, 'Invalid sessionProperties requested'),
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
        'eip155:100': {
          methods: ['eth_chainId'],
          notifications: ['accountsChanged', 'chainChanged'],
          accounts: ['eip155:100:0x4'],
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
        'eip155:100': {
          methods: ['eth_chainId'],
          notifications: ['accountsChanged', 'chainChanged'],
          accounts: ['eip155:100:0x4'],
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
        'eip155:100': {
          methods: ['eth_chainId'],
          notifications: ['accountsChanged', 'chainChanged'],
          accounts: ['eip155:100:0x4'],
        },
      },
    });
    await handler(baseRequest);

    expect(bucketScopes).toHaveBeenNthCalledWith(
      2,
      {
        'eip155:100': {
          methods: ['eth_chainId'],
          notifications: ['accountsChanged', 'chainChanged'],
          accounts: ['eip155:100:0x4'],
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

  it('gets a list of evm accounts in the wallet', async () => {
    const { handler, listAccounts } = createMockedHandler();
    await handler(baseRequest);

    expect(listAccounts).toHaveBeenCalled();
  });

  it('requests approval for account and permitted chains permission based on the supported eth accounts and eth chains from the supported scopes in the request', async () => {
    const { handler, listAccounts, requestPermissionApprovalForOrigin } =
      createMockedHandler();
    listAccounts.mockReturnValue([
      { address: '0x1' },
      { address: '0x3' },
      { address: '0x4' },
    ]);
    bucketScopes
      .mockReturnValueOnce({
        supportedScopes: {
          'eip155:1337': {
            methods: [],
            notifications: [],
            accounts: ['eip155:1:0x1', 'eip155:1:0x2'],
          },
        },
        supportableScopes: {},
        unsupportableScopes: {},
      })
      .mockReturnValueOnce({
        supportedScopes: {
          'eip155:100': {
            methods: [],
            notifications: [],
            accounts: ['eip155:2:0x1', 'eip155:2:0x3', 'eip155:2:0xdeadbeef'],
          },
        },
        supportableScopes: {},
        unsupportableScopes: {},
      });
    await handler(baseRequest);

    expect(requestPermissionApprovalForOrigin).toHaveBeenCalledWith({
      [PermissionNames.eth_accounts]: {
        caveats: [
          {
            type: CaveatTypes.restrictReturnedAccounts,
            value: ['0x1', '0x3'],
          },
        ],
      },
      [PermissionNames.permittedChains]: {
        caveats: [
          {
            type: CaveatTypes.restrictNetworkSwitching,
            value: ['0x539', '0x64'],
          },
        ],
      },
    });
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
    const { handler, findNetworkClientIdByChainId, addNetwork } =
      createMockedHandler();
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

    expect(validateAndAddEip3085).toHaveBeenCalledWith({
      eip3085Params: { foo: 'bar' },
      addNetwork,
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

    expect(validateAndAddEip3085).not.toHaveBeenCalled();
  });

  it('grants the CAIP-25 permission for the supported scopes and accounts that were approved', async () => {
    const { handler, grantPermissions, requestPermissionApprovalForOrigin } =
      createMockedHandler();
    bucketScopes
      .mockReturnValueOnce({
        supportedScopes: {
          'eip155:5': {
            methods: ['eth_chainId'],
            notifications: ['accountsChanged'],
            accounts: [],
          },
        },
        supportableScopes: {},
        unsupportableScopes: {},
      })
      .mockReturnValueOnce({
        supportedScopes: {
          'eip155:100': {
            methods: ['eth_sendTransaction'],
            notifications: ['chainChanged'],
            accounts: ['eip155:1:0x3'],
          },
        },
        supportableScopes: {},
        unsupportableScopes: {},
      });
    requestPermissionApprovalForOrigin.mockResolvedValue({
      approvedAccounts: ['0x1', '0x2'],
      approvedChainIds: ['0x5', '0x64', '0x539'], // 5, 100, 1337
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
                  'eip155:5': {
                    methods: ['eth_chainId'],
                    notifications: ['accountsChanged'],
                    accounts: ['eip155:5:0x1', 'eip155:5:0x2'],
                  },
                },
                optionalScopes: {
                  'eip155:100': {
                    methods: ['eth_sendTransaction'],
                    notifications: ['chainChanged'],
                    accounts: ['eip155:100:0x1', 'eip155:100:0x2'],
                  },
                  'eip155:1337': {
                    methods: KnownRpcMethods.eip155,
                    notifications: KnownNotifications.eip155,
                    accounts: ['eip155:1337:0x1', 'eip155:1337:0x2'],
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

  it('emits the dapp viewed metrics event', async () => {
    shouldEmitDappViewedEvent.mockReturnValue(true);
    const { handler, sendMetrics } = createMockedHandler();
    bucketScopes.mockReturnValue({
      supportedScopes: {},
      supportableScopes: {},
      unsupportableScopes: {},
    });
    await handler(baseRequest);

    expect(sendMetrics).toHaveBeenCalledWith({
      category: 'inpage_provider',
      event: 'Dapp Viewed',
      properties: {
        is_first_visit: true,
        number_of_accounts: 3,
        number_of_accounts_connected: 4,
      },
      referrer: {
        url: 'http://test.com',
      },
    });
  });

  it('returns the session ID, properties, and merged scopes', async () => {
    const { handler, requestPermissionApprovalForOrigin, response } =
      createMockedHandler();
    bucketScopes
      .mockReturnValueOnce({
        supportedScopes: {
          'eip155:5': {
            methods: ['eth_chainId'],
            notifications: ['accountsChanged'],
            accounts: ['eip155:5:0x1'],
          },
        },
        supportableScopes: {},
        unsupportableScopes: {},
      })
      .mockReturnValueOnce({
        supportedScopes: {
          'eip155:5': {
            methods: ['net_version'],
            notifications: ['chainChanged', 'accountsChanged'],
            accounts: [],
          },
          'eip155:100': {
            methods: ['eth_sendTransaction'],
            notifications: ['chainChanged'],
            accounts: ['eip155:1:0x3'],
          },
        },
        supportableScopes: {},
        unsupportableScopes: {},
      });
    requestPermissionApprovalForOrigin.mockResolvedValue({
      approvedAccounts: ['0x1', '0x2'],
      approvedChainIds: ['0x5', '0x64'], // 5, 100
    });
    await handler(baseRequest);

    expect(response.result).toStrictEqual({
      sessionProperties: {
        expiry: 'date',
        foo: 'bar',
      },
      sessionScopes: {
        'eip155:5': {
          methods: ['eth_chainId', 'net_version'],
          notifications: ['accountsChanged', 'chainChanged'],
          accounts: ['eip155:5:0x1', 'eip155:5:0x2'],
        },
        'eip155:100': {
          methods: ['eth_sendTransaction'],
          notifications: ['chainChanged'],
          accounts: ['eip155:100:0x1', 'eip155:100:0x2'],
        },
      },
    });
  });

  it('reverts any upserted network clients if the request fails', async () => {
    const { handler, removeNetwork, grantPermissions } = createMockedHandler();
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
    validateAndAddEip3085.mockReturnValue('0xdeadbeef');
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

    expect(removeNetwork).toHaveBeenCalledWith('0xdeadbeef');
  });
});
