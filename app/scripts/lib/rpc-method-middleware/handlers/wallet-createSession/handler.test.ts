import { JsonRpcError } from '@metamask/rpc-errors';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
  Caip25Authorization,
  NormalizedScopesObject,
  KnownSessionProperties,
} from '@metamask/chain-agnostic-permission';
import * as Multichain from '@metamask/chain-agnostic-permission';
import { MultichainNetwork } from '@metamask/multichain-transactions-controller';
import { Json, JsonRpcRequest, JsonRpcSuccess } from '@metamask/utils';
import * as Util from '../../../util';
import { walletCreateSession } from './handler';

jest.mock('../../../util', () => ({
  ...jest.requireActual('../../../util'),
  shouldEmitDappViewedEvent: jest.fn(),
}));
const MockUtil = jest.mocked(Util);

jest.mock('@metamask/chain-agnostic-permission', () => ({
  ...jest.requireActual('@metamask/chain-agnostic-permission'),
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
  const getNonEvmSupportedMethods = jest.fn().mockReturnValue([]);
  const isNonEvmScopeSupported = jest.fn().mockReturnValue(false);
  const response = {
    jsonrpc: '2.0' as const,
    id: 0,
  } as unknown as JsonRpcSuccess<{
    sessionScopes: NormalizedScopesObject;
    sessionProperties?: Record<string, Json>;
  }>;
  const getNonEvmAccountAddresses = jest.fn().mockReturnValue([]);
  const handler = (
    request: JsonRpcRequest<Caip25Authorization> & { origin: string },
  ) =>
    walletCreateSession.implementation(request, response, next, end, {
      findNetworkClientIdByChainId,
      requestPermissionsForOrigin,
      metamaskState,
      sendMetrics,
      listAccounts,
      getNonEvmSupportedMethods,
      isNonEvmScopeSupported,
      getNonEvmAccountAddresses,
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
    getNonEvmSupportedMethods,
    isNonEvmScopeSupported,
    getNonEvmAccountAddresses,
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
      supportedScopes: {
        'eip155:1': {
          methods: [],
          notifications: [],
          accounts: ['eip155:1:0x1', 'eip155:1:0x2'],
        },
      },
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
    const { handler, getNonEvmSupportedMethods } = createMockedHandler();
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

    expect(MockMultichain.getSupportedScopeObjects).toHaveBeenNthCalledWith(
      1,
      {
        'eip155:1': {
          methods: ['eth_chainId'],
          notifications: ['accountsChanged', 'chainChanged'],
          accounts: ['eip155:1:0x1', 'eip155:1:0x2'],
        },
      },
      {
        getNonEvmSupportedMethods,
      },
    );
  });

  it('filters the optional scopesObjects', async () => {
    const { handler, getNonEvmSupportedMethods } = createMockedHandler();
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

    expect(MockMultichain.getSupportedScopeObjects).toHaveBeenNthCalledWith(
      2,
      {
        'eip155:1': {
          methods: ['eth_chainId'],
          notifications: ['accountsChanged', 'chainChanged'],
          accounts: ['eip155:1:0x1', 'eip155:1:0x2'],
        },
      },
      {
        getNonEvmSupportedMethods,
      },
    );
  });

  it('buckets the required scopes', async () => {
    const { handler, getNonEvmSupportedMethods, isNonEvmScopeSupported } =
      createMockedHandler();
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
        isEvmChainIdSupported: expect.any(Function),
        isEvmChainIdSupportable: expect.any(Function),
        getNonEvmSupportedMethods,
        isNonEvmScopeSupported,
      }),
    );

    const isEvmChainIdSupportedBody =
      MockMultichain.bucketScopes.mock.calls[0][1].isEvmChainIdSupported.toString();
    expect(isEvmChainIdSupportedBody).toContain('findNetworkClientIdByChainId');
  });

  it('buckets the optional scopes', async () => {
    const { handler, getNonEvmSupportedMethods, isNonEvmScopeSupported } =
      createMockedHandler();
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
        isEvmChainIdSupported: expect.any(Function),
        isEvmChainIdSupportable: expect.any(Function),
        getNonEvmSupportedMethods,
        isNonEvmScopeSupported,
      }),
    );

    const isEvmChainIdSupportedBody =
      MockMultichain.bucketScopes.mock.calls[1][1].isEvmChainIdSupported.toString();
    expect(isEvmChainIdSupportedBody).toContain('findNetworkClientIdByChainId');
  });

  it('throws an error when no scopes are supported', async () => {
    const { handler, end } = createMockedHandler();
    MockMultichain.bucketScopes
      .mockReturnValueOnce({
        supportedScopes: {},
        supportableScopes: {},
        unsupportableScopes: {},
      })
      .mockReturnValueOnce({
        supportedScopes: {},
        supportableScopes: {},
        unsupportableScopes: {},
      });
    await handler(baseRequest);
    expect(end).toHaveBeenCalledWith(
      new JsonRpcError(5100, 'Requested scopes are not supported'),
    );
  });

  it('gets a list of evm accounts in the wallet', async () => {
    const { handler, listAccounts } = createMockedHandler();

    await handler(baseRequest);

    expect(listAccounts).toHaveBeenCalled();
  });

  it('gets the account addresses for non evm scopes', async () => {
    const { handler, listAccounts, getNonEvmAccountAddresses } =
      createMockedHandler();
    listAccounts.mockReturnValue([
      { address: '0x1' },
      { address: '0x3' },
      { address: '0x4' },
    ]);
    MockMultichain.bucketScopes
      .mockReturnValueOnce({
        supportedScopes: {},
        supportableScopes: {},
        unsupportableScopes: {},
      })
      .mockReturnValueOnce({
        supportedScopes: {
          [MultichainNetwork.Solana]: {
            methods: [],
            notifications: [],
            accounts: [
              'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp:EEivRh9T4GTLEJprEaKQyjSQzW13JRb5D7jSpvPQ8296',
            ],
          },
          'solana:deadbeef': {
            methods: [],
            notifications: [],
            accounts: [
              'solana:deadbeef:EEivRh9T4GTLEJprEaKQyjSQzW13JRb5D7jSpvPQ8296',
            ],
          },
        },
        supportableScopes: {},
        unsupportableScopes: {},
      });
    getNonEvmAccountAddresses.mockReturnValue([]);

    await handler(baseRequest);

    expect(getNonEvmAccountAddresses).toHaveBeenCalledTimes(2);
    expect(getNonEvmAccountAddresses).toHaveBeenCalledWith(
      MultichainNetwork.Solana,
    );
    expect(getNonEvmAccountAddresses).toHaveBeenCalledWith('solana:deadbeef');
  });

  it('requests approval for account and permitted chains permission based on the supported accounts and scopes in the request', async () => {
    const {
      handler,
      listAccounts,
      requestPermissionsForOrigin,
      getNonEvmAccountAddresses,
    } = createMockedHandler();
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
          [MultichainNetwork.Solana]: {
            methods: [],
            notifications: [],
            accounts: [
              'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp:EEivRh9T4GTLEJprEaKQyjSQzW13JRb5D7jSpvPQ8296',
              'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp:notSupported',
            ],
          },
        },
        supportableScopes: {},
        unsupportableScopes: {},
      });
    getNonEvmAccountAddresses.mockReturnValue([
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp:EEivRh9T4GTLEJprEaKQyjSQzW13JRb5D7jSpvPQ8296',
    ]);

    await handler(baseRequest);

    expect(requestPermissionsForOrigin).toHaveBeenCalledWith(
      {
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
                  [MultichainNetwork.Solana]: {
                    accounts: [
                      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp:EEivRh9T4GTLEJprEaKQyjSQzW13JRb5D7jSpvPQ8296',
                    ],
                  },
                },
                isMultichainOrigin: true,
                sessionProperties: {},
              },
            },
          ],
        },
      },
      { metadata: { promptToCreateSolanaAccount: false } },
    );
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

  it('returns the known sessionProperties and approved session scopes', async () => {
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
      sessionProperties: {},
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

  it('filters out unknown session properties', async () => {
    const { handler, requestPermissionsForOrigin, listAccounts } =
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
    expect(requestPermissionsForOrigin).toHaveBeenCalledWith(
      {
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
                sessionProperties: {},
              },
            },
          ],
        },
      },
      { metadata: { promptToCreateSolanaAccount: false } },
    );
  });

  it('preserves known session properties', async () => {
    const { handler, response, requestPermissionsForOrigin } =
      createMockedHandler();
    requestPermissionsForOrigin.mockReturnValue([
      {
        [Caip25EndowmentPermissionName]: {
          caveats: [
            {
              type: Caip25CaveatType,
              value: {
                optionalScopes: {
                  'eip155:5': {
                    accounts: ['eip155:5:0x1', 'eip155:5:0x2'],
                    methods: ['eth_chainId', 'net_version'],
                    notifications: ['accountsChanged', 'chainChanged'],
                  },
                },
                sessionProperties: {
                  [KnownSessionProperties.SolanaAccountChangedNotifications]:
                    true,
                },
              },
            },
          ],
        },
      },
    ]);
    MockMultichain.getSessionScopes.mockReturnValue({
      'eip155:5': {
        methods: ['eth_chainId', 'net_version'],
        notifications: ['accountsChanged', 'chainChanged'],
        accounts: ['eip155:5:0x1', 'eip155:5:0x2'],
      },
    });
    await handler({
      ...baseRequest,
      params: {
        ...baseRequest.params,
        sessionProperties: {
          [KnownSessionProperties.SolanaAccountChangedNotifications]: true,
        },
      },
    });

    expect(response.result).toStrictEqual({
      sessionProperties: {
        [KnownSessionProperties.SolanaAccountChangedNotifications]: true,
      },
      sessionScopes: {
        'eip155:5': {
          accounts: ['eip155:5:0x1', 'eip155:5:0x2'],
          methods: ['eth_chainId', 'net_version'],
          notifications: ['accountsChanged', 'chainChanged'],
        },
      },
    });
  });

  describe('promptToCreateSolanaAccount', () => {
    const baseRequestWithSolanaScope = {
      jsonrpc: '2.0' as const,
      id: 0,
      method: 'wallet_createSession',
      origin: 'http://test.com',
      params: {
        optionalScopes: {
          [MultichainNetwork.Solana]: {
            methods: [],
            notifications: [],
            accounts: [],
          },
        },
        sessionProperties: {
          [KnownSessionProperties.SolanaAccountChangedNotifications]: true,
        },
      },
    };
    it('prompts to create a solana account if a solana scope is requested and no solana accounts are currently available', async () => {
      const {
        handler,
        requestPermissionsForOrigin,
        getNonEvmAccountAddresses,
      } = createMockedHandler();
      getNonEvmAccountAddresses.mockResolvedValue([]);
      MockMultichain.validateAndNormalizeScopes.mockReturnValue({
        normalizedRequiredScopes: {
          [MultichainNetwork.Solana]: {
            methods: [],
            notifications: [],
            accounts: [],
          },
        },
        normalizedOptionalScopes: {},
      });

      MockMultichain.bucketScopes
        .mockReturnValueOnce({
          supportedScopes: {},
          supportableScopes: {},
          unsupportableScopes: {},
        })
        .mockReturnValueOnce({
          supportedScopes: {
            'eip155:1337': {
              methods: [],
              notifications: [],
              accounts: [],
            },
          },
          supportableScopes: {},
          unsupportableScopes: {},
        });

      await handler(baseRequestWithSolanaScope);

      expect(requestPermissionsForOrigin).toHaveBeenCalledWith(
        {
          [Caip25EndowmentPermissionName]: {
            caveats: [
              {
                type: Caip25CaveatType,
                value: {
                  requiredScopes: {},
                  optionalScopes: {
                    'eip155:1337': {
                      accounts: [],
                    },
                  },
                  isMultichainOrigin: true,
                  sessionProperties: {
                    [KnownSessionProperties.SolanaAccountChangedNotifications]:
                      true,
                  },
                },
              },
            ],
          },
        },
        { metadata: { promptToCreateSolanaAccount: true } },
      );
    });

    it('does not prompt to create a solana account if a solana scope is requested and solana accounts are currently available', async () => {
      const {
        handler,
        requestPermissionsForOrigin,
        getNonEvmAccountAddresses,
      } = createMockedHandler();
      getNonEvmAccountAddresses.mockResolvedValue([
        'solana:101:0x1',
        'solana:101:0x2',
      ]);
      MockMultichain.validateAndNormalizeScopes.mockReturnValue({
        normalizedRequiredScopes: {},
        normalizedOptionalScopes: {
          [MultichainNetwork.Solana]: {
            methods: [],
            notifications: [],
            accounts: [],
          },
        },
      });

      MockMultichain.bucketScopes
        .mockReturnValueOnce({
          supportedScopes: {},
          supportableScopes: {},
          unsupportableScopes: {},
        })
        .mockReturnValueOnce({
          supportedScopes: {
            [MultichainNetwork.Solana]: {
              methods: [],
              notifications: [],
              accounts: [],
            },
          },
          supportableScopes: {},
          unsupportableScopes: {},
        });

      await handler(baseRequestWithSolanaScope);

      expect(requestPermissionsForOrigin).toHaveBeenCalledWith(
        {
          [Caip25EndowmentPermissionName]: {
            caveats: [
              {
                type: Caip25CaveatType,
                value: {
                  requiredScopes: {},
                  optionalScopes: {
                    [MultichainNetwork.Solana]: {
                      accounts: [],
                    },
                  },
                  isMultichainOrigin: true,
                  sessionProperties: {
                    [KnownSessionProperties.SolanaAccountChangedNotifications]:
                      true,
                  },
                },
              },
            ],
          },
        },
        { metadata: { promptToCreateSolanaAccount: false } },
      );
    });
  });

  describe('address case sensitivity', () => {
    it('treats EVM addresses as case insensitive but other addresses as case sensitive', async () => {
      const {
        handler,
        listAccounts,
        requestPermissionsForOrigin,
        getNonEvmAccountAddresses,
      } = createMockedHandler();

      listAccounts.mockReturnValue([
        { address: '0xabc123' }, // Note: lowercase in wallet
      ]);

      // Mocking nonEVM account addresses in the wallet
      getNonEvmAccountAddresses.mockImplementation((scope) => {
        if (scope === MultichainNetwork.Solana) {
          return ['solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp:address1'];
        }
        if (scope === MultichainNetwork.Bitcoin) {
          return ['bip122:000000000019d6689c085ae165831e93:address1'];
        }
        return [];
      });

      // Test both EVM (case-insensitive) and Solana (case-sensitive) and Bitcoin (case-sensitive) behavior
      MockMultichain.bucketScopes
        .mockReturnValueOnce({
          supportedScopes: {
            'eip155:1': {
              methods: [],
              notifications: [],
              accounts: ['eip155:1:0xABC123'], // Upper case in request
            },
          },
          supportableScopes: {},
          unsupportableScopes: {},
        })
        .mockReturnValueOnce({
          supportedScopes: {
            [MultichainNetwork.Solana]: {
              methods: [],
              notifications: [],
              accounts: [
                // Solana address in request is different case than what
                // getNonEvmAccountAddresses (returns in wallet account address) returns
                'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp:ADDRESS1',
              ],
            },
            [MultichainNetwork.Bitcoin]: {
              methods: [],
              notifications: [],
              accounts: ['bip122:000000000019d6689c085ae165831e93:ADDRESS1'],
            },
          },
          supportableScopes: {},
          unsupportableScopes: {},
        });

      await handler({
        jsonrpc: '2.0',
        id: 0,
        method: 'wallet_createSession',
        origin: 'http://test.com',
        params: {
          requiredScopes: {
            eip155: {
              methods: ['eth_accounts'],
              notifications: [],
              accounts: ['eip155:1:0xABC123'],
            },
          },
          optionalScopes: {
            [MultichainNetwork.Solana]: {
              methods: ['getAccounts'],
              notifications: [],
              accounts: ['solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp:ADDRESS1'],
            },
            [MultichainNetwork.Bitcoin]: {
              methods: ['getAccounts'],
              notifications: [],
              accounts: ['bip122:000000000019d6689c085ae165831e93:ADDRESS1'],
            },
          },
        },
      });

      expect(requestPermissionsForOrigin).toHaveBeenCalledWith(
        {
          [Caip25EndowmentPermissionName]: {
            caveats: [
              {
                type: Caip25CaveatType,
                value: {
                  requiredScopes: {
                    'eip155:1': {
                      accounts: ['eip155:1:0xABC123'], // Requested EVM address included
                    },
                  },
                  optionalScopes: {
                    [MultichainNetwork.Solana]: {
                      accounts: [], // Solana address excluded due to case mismatch
                    },
                    [MultichainNetwork.Bitcoin]: {
                      accounts: [], // Bitcoin address excluded due to case mismatch
                    },
                  },
                  isMultichainOrigin: true,
                  sessionProperties: {},
                },
              },
            ],
          },
        },
        { metadata: { promptToCreateSolanaAccount: false } },
      );
    });
  });
});
