import { JsonRpcError } from '@metamask/rpc-errors';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
  Caip25Authorization,
  NormalizedScopesObject,
} from '@metamask/multichain';
import * as Multichain from '@metamask/multichain';
import { Json, JsonRpcRequest, JsonRpcSuccess } from '@metamask/utils';
import * as Util from '../../../util';
import { walletCreateSession } from './handler';

jest.mock('../../../util', () => ({
  ...jest.requireActual('../../../util'),
  shouldEmitDappViewedEvent: jest.fn(),
}));
const MockUtil = jest.mocked(Util);

jest.mock('@metamask/multichain', () => ({
  ...jest.requireActual('@metamask/multichain'),
  validateAndNormalizeScopes: jest.fn(),
  bucketScopes: jest.fn(),
  getSessionScopes: jest.fn(),
  getSupportedScopeObjects: jest.fn(),
}));
const MockMultichain = jest.mocked(Multichain);

const baseRequest = {
  jsonrpc: '2.0' as const,
  id: 0,
  method: 'wallet_createSession',
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
  const requestPermissionsForOrigin = jest.fn().mockResolvedValue([
    {
      [Caip25EndowmentPermissionName]: {
        caveats: [
          {
            type: Caip25CaveatType,
            value: {
              requiredScopes: {},
              optionalScopes: {
                'wallet:eip155': {
                  accounts: [
                    'wallet:eip155:0x1',
                    'wallet:eip155:0x2',
                    'wallet:eip155:0x3',
                    'wallet:eip155:0x4',
                  ],
                },
              },
              isMultichainOrigin: true,
            },
          },
        ],
      },
    },
  ]);
  const findNetworkClientIdByChainId = jest.fn().mockReturnValue('mainnet');
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
  const response = {
    jsonrpc: '2.0' as const,
    id: 0,
  } as unknown as JsonRpcSuccess<{
    sessionScopes: NormalizedScopesObject;
    sessionProperties?: Record<string, Json>;
  }>;
  const handler = (
    request: JsonRpcRequest<Caip25Authorization> & { origin: string },
  ) =>
    walletCreateSession.implementation(request, response, next, end, {
      findNetworkClientIdByChainId,
      requestPermissionsForOrigin,
      metamaskState,
      sendMetrics,
      listAccounts,
    });

  return {
    response,
    next,
    end,
    findNetworkClientIdByChainId,
    requestPermissionsForOrigin,
    metamaskState,
    sendMetrics,
    listAccounts,
    handler,
  };
};

describe('wallet_createSession', () => {
  beforeEach(() => {
    MockMultichain.validateAndNormalizeScopes.mockReturnValue({
      normalizedRequiredScopes: {},
      normalizedOptionalScopes: {},
    });
    MockMultichain.bucketScopes.mockReturnValue({
      supportedScopes: {},
      supportableScopes: {},
      unsupportableScopes: {},
    });
    MockMultichain.getSessionScopes.mockReturnValue({});
    MockMultichain.getSupportedScopeObjects.mockImplementation(
      (scopesObject) => scopesObject,
    );
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
      new JsonRpcError(5302, 'Invalid sessionProperties requested'),
    );
  });

  it('processes the scopes', async () => {
    const { handler } = createMockedHandler();
    await handler({
      ...baseRequest,
      params: {
        ...baseRequest.params,
        optionalScopes: {
          foo: {
            methods: [],
            notifications: [],
          },
        },
      },
    });

    expect(MockMultichain.validateAndNormalizeScopes).toHaveBeenCalledWith(
      baseRequest.params.requiredScopes,
      {
        foo: {
          methods: [],
          notifications: [],
        },
      },
    );
  });

  it('throws an error when processing scopes fails', async () => {
    const { handler, end } = createMockedHandler();
    MockMultichain.validateAndNormalizeScopes.mockImplementation(() => {
      throw new Error('failed to process scopes');
    });
    await handler(baseRequest);
    expect(end).toHaveBeenCalledWith(new Error('failed to process scopes'));
  });

  it('filters the required scopesObjects', async () => {
    const { handler } = createMockedHandler();
    MockMultichain.validateAndNormalizeScopes.mockReturnValue({
      normalizedRequiredScopes: {
        'eip155:1': {
          methods: ['eth_chainId'],
          notifications: ['accountsChanged', 'chainChanged'],
          accounts: ['eip155:1:0x1', 'eip155:1:0x2'],
        },
      },
      normalizedOptionalScopes: {},
    });
    await handler(baseRequest);

    expect(MockMultichain.getSupportedScopeObjects).toHaveBeenNthCalledWith(1, {
      'eip155:1': {
        methods: ['eth_chainId'],
        notifications: ['accountsChanged', 'chainChanged'],
        accounts: ['eip155:1:0x1', 'eip155:1:0x2'],
      },
    });
  });

  it('filters the optional scopesObjects', async () => {
    const { handler } = createMockedHandler();
    MockMultichain.validateAndNormalizeScopes.mockReturnValue({
      normalizedRequiredScopes: {},
      normalizedOptionalScopes: {
        'eip155:1': {
          methods: ['eth_chainId'],
          notifications: ['accountsChanged', 'chainChanged'],
          accounts: ['eip155:1:0x1', 'eip155:1:0x2'],
        },
      },
    });
    await handler(baseRequest);

    expect(MockMultichain.getSupportedScopeObjects).toHaveBeenNthCalledWith(2, {
      'eip155:1': {
        methods: ['eth_chainId'],
        notifications: ['accountsChanged', 'chainChanged'],
        accounts: ['eip155:1:0x1', 'eip155:1:0x2'],
      },
    });
  });

  it('buckets the required scopes', async () => {
    const { handler } = createMockedHandler();
    MockMultichain.validateAndNormalizeScopes.mockReturnValue({
      normalizedRequiredScopes: {
        'eip155:1': {
          methods: ['eth_chainId'],
          notifications: ['accountsChanged', 'chainChanged'],
          accounts: ['eip155:1:0x1', 'eip155:1:0x2'],
        },
      },
      normalizedOptionalScopes: {},
    });
    await handler(baseRequest);

    expect(MockMultichain.bucketScopes).toHaveBeenNthCalledWith(
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
      MockMultichain.bucketScopes.mock.calls[0][1].isChainIdSupported.toString();
    expect(isChainIdSupportedBody).toContain('findNetworkClientIdByChainId');
  });

  it('buckets the optional scopes', async () => {
    const { handler } = createMockedHandler();
    MockMultichain.validateAndNormalizeScopes.mockReturnValue({
      normalizedRequiredScopes: {},
      normalizedOptionalScopes: {
        'eip155:100': {
          methods: ['eth_chainId'],
          notifications: ['accountsChanged', 'chainChanged'],
          accounts: ['eip155:100:0x4'],
        },
      },
    });
    await handler(baseRequest);

    expect(MockMultichain.bucketScopes).toHaveBeenNthCalledWith(
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
      MockMultichain.bucketScopes.mock.calls[1][1].isChainIdSupported.toString();
    expect(isChainIdSupportedBody).toContain('findNetworkClientIdByChainId');
  });

  it('gets a list of evm accounts in the wallet', async () => {
    const { handler, listAccounts } = createMockedHandler();
    await handler(baseRequest);

    expect(listAccounts).toHaveBeenCalled();
  });

  it('requests approval for account and permitted chains permission based on the supported eth accounts and eth chains from the supported scopes in the request', async () => {
    const { handler, listAccounts, requestPermissionsForOrigin } =
      createMockedHandler();
    listAccounts.mockReturnValue([
      { address: '0x1' },
      { address: '0x3' },
      { address: '0x4' },
    ]);
    MockMultichain.bucketScopes
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

    expect(requestPermissionsForOrigin).toHaveBeenCalledWith({
      [Caip25EndowmentPermissionName]: {
        caveats: [
          {
            type: Caip25CaveatType,
            value: {
              requiredScopes: {
                'eip155:1337': {
                  accounts: ['eip155:1337:0x1', 'eip155:1337:0x3'],
                },
              },
              optionalScopes: {
                'eip155:100': {
                  accounts: ['eip155:100:0x1', 'eip155:100:0x3'],
                },
              },
              isMultichainOrigin: true,
            },
          },
        ],
      },
    });
  });

  it('throws an error when requesting account permission approval fails', async () => {
    const { handler, requestPermissionsForOrigin, end } = createMockedHandler();
    requestPermissionsForOrigin.mockImplementation(() => {
      throw new Error('failed to request account permission approval');
    });
    await handler(baseRequest);
    expect(end).toHaveBeenCalledWith(
      new Error('failed to request account permission approval'),
    );
  });

  it('emits the dapp viewed metrics event', async () => {
    MockUtil.shouldEmitDappViewedEvent.mockReturnValue(true);
    const { handler, sendMetrics } = createMockedHandler();

    MockMultichain.bucketScopes.mockReturnValue({
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

  it('returns the session ID, properties, and session scopes', async () => {
    const { handler, response } = createMockedHandler();
    MockMultichain.getSessionScopes.mockReturnValue({
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
      'wallet:eip155': {
        methods: [],
        notifications: [],
        accounts: ['wallet:eip155:0x1', 'wallet:eip155:0x2'],
      },
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
        'wallet:eip155': {
          methods: [],
          notifications: [],
          accounts: ['wallet:eip155:0x1', 'wallet:eip155:0x2'],
        },
      },
    });
  });
});
