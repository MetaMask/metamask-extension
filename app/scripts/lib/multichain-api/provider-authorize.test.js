import { EthereumRpcError } from 'eth-rpc-errors';
import {
  CaveatTypes,
  RestrictedMethods,
} from '../../../../shared/constants/permissions';
import { providerAuthorizeHandler } from './provider-authorize';
import { processScopes } from './authorization';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from './caip25permissions';

jest.mock('./scope', () => ({
  ...jest.requireActual('./scope'),
  processScopes: jest.fn(),
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
  const requestPermissions = jest.fn().mockResolvedValue(undefined);
  const grantPermissions = jest.fn().mockResolvedValue(undefined);
  const findNetworkClientIdByChainId = jest.fn().mockReturnValue('mainnet');
  const getInternalAccounts = jest.fn().mockReturnValue([
    {
      type: 'eip155:eoa',
      address: '0xdeadbeef',
    },
  ]);
  const response = {};
  const handler = (request) =>
    providerAuthorizeHandler(request, response, next, end, {
      findNetworkClientIdByChainId,
      getInternalAccounts,
      requestPermissions,
      grantPermissions,
    });

  return {
    response,
    next,
    end,
    findNetworkClientIdByChainId,
    getInternalAccounts,
    requestPermissions,
    grantPermissions,
    handler,
  };
};

describe('provider_authorize', () => {
  beforeEach(() => {
    processScopes.mockReturnValue({
      flattenedRequiredScopes: {},
      flattenedOptionalScopes: {},
    });
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
    const { handler, findNetworkClientIdByChainId, getInternalAccounts } =
      createMockedHandler();
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
      { findNetworkClientIdByChainId, getInternalAccounts },
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

  it('requests permissions for accounts defined in the processed scopes', async () => {
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
        [RestrictedMethods.eth_accounts]: {
          caveats: [
            {
              type: CaveatTypes.restrictReturnedAccounts,
              value: ['0x1', '0x2', '0x3', '0x4'],
            },
          ],
        },
      },
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

  it('grants the CAIP-25 permission for the processed scopes', async () => {
    const { handler, grantPermissions } = createMockedHandler();
    processScopes.mockReturnValue({
      flattenedRequiredScopes: {
        'eip155:1': {
          methods: ['eth_chainId'],
          notifications: ['accountsChanged'],
          accounts: ['eip155:1:0x1'],
        },
      },
      flattenedOptionalScopes: {
        'eip155:64': {
          methods: ['net_version'],
          notifications: ['chainChanged'],
          accounts: ['eip155:64:0x2'],
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
                    notifications: ['accountsChanged'],
                    accounts: ['eip155:1:0x1'],
                  },
                },
                optionalScopes: {
                  'eip155:64': {
                    methods: ['net_version'],
                    notifications: ['chainChanged'],
                    accounts: ['eip155:64:0x2'],
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
          accounts: ['eip155:1:0x1'],
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
          accounts: ['eip155:1:0x2'],
        },
        'eip155:64': {
          methods: ['net_version'],
          notifications: ['chainChanged'],
          accounts: ['eip155:64:0x2'],
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
          accounts: ['eip155:1:0x1', 'eip155:1:0x2'],
          methods: ['eth_chainId', 'eth_sendTransaction'],
          notifications: ['accountsChanged', 'chainChanged'],
        },
        'eip155:2': {
          methods: ['eth_chainId'],
          notifications: [],
        },
        'eip155:64': {
          accounts: ['eip155:64:0x2'],
          methods: ['net_version'],
          notifications: ['chainChanged'],
        },
      },
    });
  });
});
