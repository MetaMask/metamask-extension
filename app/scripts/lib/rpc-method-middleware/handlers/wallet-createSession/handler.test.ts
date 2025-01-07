import { JsonRpcError } from '@metamask/rpc-errors';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
  Caip25Authorization,
  NormalizedScopesObject,
} from '@metamask/multichain';
import * as Multichain from '@metamask/multichain';
import { Json, JsonRpcRequest, JsonRpcSuccess } from '@metamask/utils';
import { CaveatTypes } from '../../../../../../shared/constants/permissions';
import * as Util from '../../../util';
import { PermissionNames } from '../../../../controllers/permissions';
import * as Helpers from './helpers';
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

jest.mock('./helpers', () => ({
  ...jest.requireActual('./helpers'),
  validateAndAddEip3085: jest.fn(),
  processScopedProperties: jest.fn(),
}));
const MockHelpers = jest.mocked(Helpers);

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
  const requestPermissionApprovalForOrigin = jest.fn().mockResolvedValue({
    approvedAccounts: ['0x1', '0x2', '0x3', '0x4'],
    approvedChainIds: ['0x1', '0x5'],
  });
  const grantPermissions = jest.fn().mockResolvedValue(undefined);
  const findNetworkClientIdByChainId = jest.fn().mockReturnValue('mainnet');
  const addNetwork = jest.fn().mockResolvedValue(undefined);
  const removeNetwork = jest.fn();
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
      requestPermissionApprovalForOrigin,
      grantPermissions,
      addNetwork,
      removeNetwork,
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
    MockHelpers.processScopedProperties.mockReturnValue({});
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

  it('processes the scopedProperties', async () => {
    const { handler } = createMockedHandler();
    MockMultichain.validateAndNormalizeScopes.mockReturnValue({
      normalizedRequiredScopes: {
        'eip155:1': {
          methods: ['eth_chainId'],
          notifications: ['accountsChanged', 'chainChanged'],
          accounts: ['eip155:1:0x1', 'eip155:1:0x2'],
        },
      },
      normalizedOptionalScopes: {
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

    expect(MockHelpers.processScopedProperties).toHaveBeenCalledWith(
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
    MockHelpers.processScopedProperties.mockImplementation(() => {
      throw new Error('failed to process scoped properties');
    });
    await handler(baseRequest);
    expect(end).toHaveBeenCalledWith(
      new Error('failed to process scoped properties'),
    );
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

    expect(MockMultichain.getSupportedScopeObjects).toHaveBeenNthCalledWith(
      1,
      {
        'eip155:1': {
          methods: ['eth_chainId'],
          notifications: ['accountsChanged', 'chainChanged'],
          accounts: ['eip155:1:0x1', 'eip155:1:0x2'],
        },
      },
    );
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

    expect(MockMultichain.getSupportedScopeObjects).toHaveBeenNthCalledWith(
      2,
      {
        'eip155:1': {
          methods: ['eth_chainId'],
          notifications: ['accountsChanged', 'chainChanged'],
          accounts: ['eip155:1:0x1', 'eip155:1:0x2'],
        },
      },
    );
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
    const isChainIdSupportableBody =
      MockMultichain.bucketScopes.mock.calls[0][1].isChainIdSupportable.toString();
    expect(isChainIdSupportableBody).toContain('validScopedProperties');
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
    const isChainIdSupportableBody =
      MockMultichain.bucketScopes.mock.calls[1][1].isChainIdSupportable.toString();
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
    MockHelpers.processScopedProperties.mockReturnValue({
      'eip155:1': {
        eip3085: {
          foo: 'bar',
        },
      },
    });
    MockMultichain.getSessionScopes.mockReturnValue({
      'eip155:1': {
        methods: [],
        notifications: [],
        accounts: ['eip155:1:0x1'],
      },
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

    expect(MockHelpers.validateAndAddEip3085).toHaveBeenCalledWith({
      eip3085Params: { foo: 'bar' },
      addNetwork,
      findNetworkClientIdByChainId,
    });
  });

  it('does not validate and upsert EIP 3085 scoped properties when there is no matching sessionScope', async () => {
    const { handler } = createMockedHandler();
    MockMultichain.bucketScopes
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

    expect(MockHelpers.validateAndAddEip3085).not.toHaveBeenCalled();
  });

  it('grants the CAIP-25 permission for the supported scopes and accounts that were approved', async () => {
    const { handler, grantPermissions, requestPermissionApprovalForOrigin } =
      createMockedHandler();
    MockMultichain.bucketScopes
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
                    accounts: ['eip155:5:0x1', 'eip155:5:0x2'],
                  },
                },
                optionalScopes: {
                  'eip155:100': {
                    accounts: ['eip155:100:0x1', 'eip155:100:0x2'],
                  },
                  'eip155:1337': {
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

  it('reverts any upserted network clients if the request fails', async () => {
    const { handler, removeNetwork, grantPermissions } = createMockedHandler();
    MockMultichain.getSessionScopes.mockReturnValue({
      'eip155:1': {
        methods: [],
        notifications: [],
        accounts: [],
      },
    });
    MockHelpers.processScopedProperties.mockReturnValue({
      'eip155:1': {
        eip3085: {
          foo: 'bar',
        },
      },
    });
    MockHelpers.validateAndAddEip3085.mockResolvedValue('0xdeadbeef');
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
