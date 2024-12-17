import {
  invalidParams,
  RequestedPermissions,
} from '@metamask/permission-controller';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from '@metamask/multichain';
import { Json, JsonRpcRequest, PendingJsonRpcResponse } from '@metamask/utils';
import {
  CaveatTypes,
  RestrictedMethods,
} from '../../../../../shared/constants/permissions';
import { PermissionNames } from '../../../controllers/permissions';
import { requestPermissionsHandler } from './wallet-requestPermissions';

const getBaseRequest = (overrides = {}) => ({
  jsonrpc: '2.0' as const,
  id: 0,
  method: 'wallet_requestPermissions',
  networkClientId: 'mainnet',
  origin: 'http://test.com',
  params: [
    {
      eth_accounts: {},
    },
  ],
  ...overrides,
});

const createMockedHandler = () => {
  const next = jest.fn();
  const end = jest.fn();
  const requestPermissionsForOrigin = jest
    .fn()
    .mockRejectedValue(new Error('failed to request unexpected permission'));
  const getAccounts = jest.fn().mockReturnValue([]);
  const requestCaip25PermissionForOrigin = jest.fn().mockResolvedValue({});
  const response: PendingJsonRpcResponse<Json> = {
    jsonrpc: '2.0' as const,
    id: 0,
  };
  const handler = (request: unknown) =>
    requestPermissionsHandler.implementation(
      request as JsonRpcRequest<[RequestedPermissions]> & { origin: string },
      response,
      next,
      end,
      {
        getAccounts,
        requestPermissionsForOrigin,
        requestCaip25PermissionForOrigin,
      },
    );

  return {
    response,
    next,
    end,
    getAccounts,
    requestPermissionsForOrigin,
    requestCaip25PermissionForOrigin,
    handler,
  };
};

describe('requestPermissionsHandler', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns an error if params is malformed', async () => {
    const { handler, end } = createMockedHandler();

    const malformedRequest = getBaseRequest({ params: [] });
    await handler(malformedRequest);
    expect(end).toHaveBeenCalledWith(
      invalidParams({ data: { request: malformedRequest } }),
    );
  });

  it('requests the CAIP-25 permission using eth_accounts when only eth_accounts is specified in params', async () => {
    const { handler, requestCaip25PermissionForOrigin } = createMockedHandler();

    await handler(
      getBaseRequest({
        params: [
          {
            [RestrictedMethods.eth_accounts]: {
              foo: 'bar',
            },
          },
        ],
      }),
    );

    expect(requestCaip25PermissionForOrigin).toHaveBeenCalledWith({
      [RestrictedMethods.eth_accounts]: {
        foo: 'bar',
      },
    });
  });

  it('requests the CAIP-25 permission for permittedChains when only permittedChains is specified in params', async () => {
    const { handler, requestCaip25PermissionForOrigin } = createMockedHandler();

    await handler(
      getBaseRequest({
        params: [
          {
            [PermissionNames.permittedChains]: {
              caveats: [
                {
                  type: CaveatTypes.restrictNetworkSwitching,
                  value: ['0x64'],
                },
              ],
            },
          },
        ],
      }),
    );

    expect(requestCaip25PermissionForOrigin).toHaveBeenCalledWith({
      [PermissionNames.permittedChains]: {
        caveats: [
          {
            type: CaveatTypes.restrictNetworkSwitching,
            value: ['0x64'],
          },
        ],
      },
    });
  });

  it('requests the CAIP-25 permission for eth_accounts and permittedChains when both are specified in params', async () => {
    const { handler, requestCaip25PermissionForOrigin } = createMockedHandler();

    await handler(
      getBaseRequest({
        params: [
          {
            [RestrictedMethods.eth_accounts]: {
              foo: 'bar',
            },
            [PermissionNames.permittedChains]: {
              caveats: [
                {
                  type: CaveatTypes.restrictNetworkSwitching,
                  value: ['0x64'],
                },
              ],
            },
          },
        ],
      }),
    );

    expect(requestCaip25PermissionForOrigin).toHaveBeenCalledWith({
      [RestrictedMethods.eth_accounts]: {
        foo: 'bar',
      },
      [PermissionNames.permittedChains]: {
        caveats: [
          {
            type: CaveatTypes.restrictNetworkSwitching,
            value: ['0x64'],
          },
        ],
      },
    });
  });

  it('returns an error if requesting the CAIP-25 permission fails', async () => {
    const { handler, requestCaip25PermissionForOrigin, end } =
      createMockedHandler();
    requestCaip25PermissionForOrigin.mockRejectedValue(
      new Error('failed to request caip25 permission'),
    );

    await handler(
      getBaseRequest({
        params: [
          {
            [RestrictedMethods.eth_accounts]: {
              foo: 'bar',
            },
            [PermissionNames.permittedChains]: {
              caveats: [
                {
                  type: CaveatTypes.restrictNetworkSwitching,
                  value: ['0x64'],
                },
              ],
            },
          },
        ],
      }),
    );

    expect(end).toHaveBeenCalledWith(
      new Error('failed to request caip25 permission'),
    );
  });

  it('returns an error by requesting other permissions in params from the PermissionController if specified', async () => {
    const { handler, requestPermissionsForOrigin, end } = createMockedHandler();

    await handler(
      getBaseRequest({
        params: [
          {
            [Caip25EndowmentPermissionName]: {},
            otherPermission: {},
          },
        ],
      }),
    );

    expect(requestPermissionsForOrigin).toHaveBeenCalledWith({
      [Caip25EndowmentPermissionName]: {},
      otherPermission: {},
    });
    expect(end).toHaveBeenCalledWith(
      new Error('failed to request unexpected permission'),
    );
  });

  it('returns an error by requesting empty permissions in params from the PermissionController if no permissions specified', async () => {
    const { handler, requestPermissionsForOrigin, end } = createMockedHandler();

    await handler(
      getBaseRequest({
        params: [{}],
      }),
    );
    expect(requestPermissionsForOrigin).toHaveBeenCalledWith({});
    expect(end).toHaveBeenCalledWith(
      new Error('failed to request unexpected permission'),
    );
  });

  it('returns both eth_accounts and permittedChains permissions that were granted there are permitted chains', async () => {
    const { handler, getAccounts, requestCaip25PermissionForOrigin, response } =
      createMockedHandler();
    getAccounts.mockReturnValue(['0xdeadbeef']);
    requestCaip25PermissionForOrigin.mockResolvedValue({
      id: 'new',
      parentCapability: Caip25EndowmentPermissionName,
      caveats: [
        {
          type: Caip25CaveatType,
          value: {
            requiredScopes: {},
            optionalScopes: {
              'eip155:1': {
                accounts: ['0xdeadbeef'],
              },
              'eip155:5': {
                accounts: ['0xdeadbeef'],
              },
            },
          },
        },
      ],
    });

    await handler(getBaseRequest());
    expect(response.result).toStrictEqual([
      {
        caveats: [
          {
            type: CaveatTypes.restrictReturnedAccounts,
            value: ['0xdeadbeef'],
          },
        ],
        id: 'new',
        parentCapability: RestrictedMethods.eth_accounts,
      },
      {
        caveats: [
          {
            type: CaveatTypes.restrictNetworkSwitching,
            value: ['0x1', '0x5'],
          },
        ],
        id: 'new',
        parentCapability: PermissionNames.permittedChains,
      },
    ]);
  });

  it('returns only eth_accounts permission that was granted if there are no permitted chains', async () => {
    const { handler, getAccounts, requestCaip25PermissionForOrigin, response } =
      createMockedHandler();
    getAccounts.mockReturnValue(['0xdeadbeef']);
    requestCaip25PermissionForOrigin.mockResolvedValue({
      id: 'new',
      parentCapability: Caip25EndowmentPermissionName,
      caveats: [
        {
          type: Caip25CaveatType,
          value: {
            requiredScopes: {},
            optionalScopes: {
              'wallet:eip155': {
                accounts: ['0xdeadbeef'],
              },
            },
          },
        },
      ],
    });

    await handler(getBaseRequest());
    expect(response.result).toStrictEqual([
      {
        caveats: [
          {
            type: CaveatTypes.restrictReturnedAccounts,
            value: ['0xdeadbeef'],
          },
        ],
        id: 'new',
        parentCapability: RestrictedMethods.eth_accounts,
      },
    ]);
  });
});
