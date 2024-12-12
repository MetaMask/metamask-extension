import {
  invalidParams,
  RequestedPermissions,
} from '@metamask/permission-controller';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from '@metamask/multichain';
import * as Multichain from '@metamask/multichain';
import { Json, JsonRpcRequest, PendingJsonRpcResponse } from '@metamask/utils';
import {
  CaveatTypes,
  RestrictedMethods,
} from '../../../../../shared/constants/permissions';
import { PermissionNames } from '../../../controllers/permissions';
import { requestPermissionsHandler } from './wallet-requestPermissions';

jest.mock('@metamask/multichain', () => ({
  ...jest.requireActual('@metamask/multichain'),
  setEthAccounts: jest.fn(),
  setPermittedEthChainIds: jest.fn(),
}));
const MockMultichain = jest.mocked(Multichain);

const getBaseRequest = (overrides = {}) => ({
  jsonrpc: '2.0' as const,
  id: 0,
  method: 'wallet_requestPermissions',
  networkClientId: 'mainnet',
  origin: 'http://test.com',
  params: [
    {
      eth_accounts: {},
      [Caip25EndowmentPermissionName]: {},
      otherPermission: {},
    },
  ],
  ...overrides,
});

const createMockedHandler = () => {
  const next = jest.fn();
  const end = jest.fn();
  const requestPermissionsForOrigin = jest.fn().mockResolvedValue([
    Object.freeze({
      otherPermission: {
        id: '2',
        parentCapability: 'otherPermission',
        caveats: [
          {
            value: {
              foo: 'bar',
            },
          },
        ],
      },
    }),
  ]);
  const getPermissionsForOrigin = jest.fn().mockReturnValue(
    Object.freeze({
      [Caip25EndowmentPermissionName]: {
        id: '1',
        parentCapability: Caip25EndowmentPermissionName,
        caveats: [
          {
            type: Caip25CaveatType,
            value: {
              requiredScopes: {
                'eip155:1': {
                  accounts: ['eip155:1:0x1', 'eip155:1:0x2'],
                },
                'eip155:5': {
                  accounts: ['eip155:5:0x1', 'eip155:5:0x3'],
                },
              },
              optionalScopes: {
                'eip155:1': {
                  accounts: ['eip155:1:0x4'],
                },
                'other:1': {
                  accounts: ['other:1:0x4'],
                },
              },
            },
            isMultichainOrigin: false,
          },
        ],
      },
    }),
  );
  const updateCaveat = jest.fn();
  const grantPermissions = jest.fn().mockReturnValue(
    Object.freeze({
      [Caip25EndowmentPermissionName]: {
        id: 'new',
        parentCapability: Caip25EndowmentPermissionName,
        caveats: [
          {
            type: Caip25CaveatType,
            value: {
              requiredScopes: {},
              optionalScopes: {},
            },
          },
        ],
      },
    }),
  );
  const requestPermissionApprovalForOrigin = jest.fn().mockResolvedValue({
    approvedChainIds: ['0x1', '0x5'],
    approvedAccounts: ['0xdeadbeef'],
  });
  const getAccounts = jest.fn().mockReturnValue([]);
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
        requestPermissionsForOrigin,
        getPermissionsForOrigin,
        updateCaveat,
        grantPermissions,
        requestPermissionApprovalForOrigin,
        getAccounts,
      },
    );

  return {
    response,
    next,
    end,
    requestPermissionsForOrigin,
    getPermissionsForOrigin,
    updateCaveat,
    grantPermissions,
    requestPermissionApprovalForOrigin,
    getAccounts,
    handler,
  };
};

describe('requestPermissionsHandler', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  beforeEach(() => {
    MockMultichain.setEthAccounts.mockImplementation(
      (caveatValue) => caveatValue,
    );
    MockMultichain.setPermittedEthChainIds.mockImplementation(
      (caveatValue) => caveatValue,
    );
  });

  it('returns an error if params is malformed', async () => {
    const { handler, end } = createMockedHandler();

    const malformedRequest = getBaseRequest({ params: [] });
    await handler(malformedRequest);
    expect(end).toHaveBeenCalledWith(
      invalidParams({ data: { request: malformedRequest } }),
    );
  });

  it('requests approval from the ApprovalController for eth_accounts and permittedChains when only eth_accounts is specified in params and origin is not snapId', async () => {
    const { handler, requestPermissionApprovalForOrigin } =
      createMockedHandler();

    await handler(
      getBaseRequest({
        origin: 'http://test.com',
        params: [
          {
            [RestrictedMethods.eth_accounts]: {
              foo: 'bar',
            },
          },
        ],
      }),
    );

    expect(requestPermissionApprovalForOrigin).toHaveBeenCalledWith({
      [RestrictedMethods.eth_accounts]: {
        foo: 'bar',
      },
      [PermissionNames.permittedChains]: {},
    });
  });

  it('requests approval from the ApprovalController for eth_accounts and permittedChains when only permittedChains is specified in params and origin is not snapId', async () => {
    const { handler, requestPermissionApprovalForOrigin } =
      createMockedHandler();

    await handler(
      getBaseRequest({
        origin: 'http://test.com',
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

    expect(requestPermissionApprovalForOrigin).toHaveBeenCalledWith({
      [RestrictedMethods.eth_accounts]: {},
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

  it('requests approval from the ApprovalController for eth_accounts and permittedChains when both are specified in params and origin is not snapId', async () => {
    const { handler, requestPermissionApprovalForOrigin } =
      createMockedHandler();

    await handler(
      getBaseRequest({
        origin: 'http://test.com',
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

    expect(requestPermissionApprovalForOrigin).toHaveBeenCalledWith({
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

  it('requests approval from the ApprovalController for only eth_accounts when only eth_accounts is specified in params and origin is snapId', async () => {
    const { handler, requestPermissionApprovalForOrigin } =
      createMockedHandler();

    await handler(
      getBaseRequest({
        origin: 'npm:snap',
        params: [
          {
            [RestrictedMethods.eth_accounts]: {
              foo: 'bar',
            },
          },
        ],
      }),
    );

    expect(requestPermissionApprovalForOrigin).toHaveBeenCalledWith({
      [RestrictedMethods.eth_accounts]: {
        foo: 'bar',
      },
    });
  });

  it('requests approval from the ApprovalController for only eth_accounts when only permittedChains is specified in params and origin is snapId', async () => {
    const { handler, requestPermissionApprovalForOrigin } =
      createMockedHandler();

    await handler(
      getBaseRequest({
        origin: 'npm:snap',
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

    expect(requestPermissionApprovalForOrigin).toHaveBeenCalledWith({
      [RestrictedMethods.eth_accounts]: {},
    });
  });

  it('requests approval from the ApprovalController for only eth_accounts when both eth_accounts and permittedChains are specified in params and origin is snapId', async () => {
    const { handler, requestPermissionApprovalForOrigin } =
      createMockedHandler();

    await handler(
      getBaseRequest({
        origin: 'npm:snap',
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

    expect(requestPermissionApprovalForOrigin).toHaveBeenCalledWith({
      [RestrictedMethods.eth_accounts]: {
        foo: 'bar',
      },
    });
  });

  it('requests other permissions in params from the PermissionController, but ignores CAIP-25 if specified', async () => {
    const { handler, requestPermissionsForOrigin } = createMockedHandler();

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
      otherPermission: {},
    });
  });

  it('requests other permissions in params from the PermissionController, but ignores eth_accounts if specified', async () => {
    const { handler, requestPermissionsForOrigin } = createMockedHandler();

    await handler(
      getBaseRequest({
        params: [
          {
            [RestrictedMethods.eth_accounts]: {},
            otherPermission: {},
          },
        ],
      }),
    );
    expect(requestPermissionsForOrigin).toHaveBeenCalledWith({
      otherPermission: {},
    });
  });

  it('requests other permissions in params from the PermissionController, but ignores permittedChains if specified', async () => {
    const { handler, requestPermissionsForOrigin } = createMockedHandler();

    await handler(
      getBaseRequest({
        params: [
          {
            [PermissionNames.permittedChains]: {},
            otherPermission: {},
          },
        ],
      }),
    );
    expect(requestPermissionsForOrigin).toHaveBeenCalledWith({
      otherPermission: {},
    });
  });

  it('does not request permissions from the PermissionController when only eth_accounts is provided in params', async () => {
    const { handler, requestPermissionsForOrigin } = createMockedHandler();

    await handler(
      getBaseRequest({
        params: [
          {
            [RestrictedMethods.eth_accounts]: {},
          },
        ],
      }),
    );
    expect(requestPermissionsForOrigin).not.toHaveBeenCalled();
  });

  it('does not request permissions from the PermissionController when only permittedChains is provided in params', async () => {
    const { handler, requestPermissionsForOrigin } = createMockedHandler();

    await handler(
      getBaseRequest({
        params: [
          {
            [PermissionNames.permittedChains]: {},
          },
        ],
      }),
    );
    expect(requestPermissionsForOrigin).not.toHaveBeenCalled();
  });

  it('does not request permissions from the PermissionController when both eth_accounts and permittedChains are provided in params', async () => {
    const { handler, requestPermissionsForOrigin } = createMockedHandler();

    await handler(
      getBaseRequest({
        params: [
          {
            [RestrictedMethods.eth_accounts]: {},
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
    expect(requestPermissionsForOrigin).not.toHaveBeenCalled();
  });

  it('requests empty permissions from the PermissionController when only CAIP-25 permission is provided in params', async () => {
    const { handler, requestPermissionsForOrigin } = createMockedHandler();

    await handler(
      getBaseRequest({
        params: [
          {
            [Caip25EndowmentPermissionName]: {},
          },
        ],
      }),
    );
    expect(requestPermissionsForOrigin).toHaveBeenCalledWith({});
  });

  it('requests empty permissions from the PermissionController when no permissions are provided in params', async () => {
    const { handler, requestPermissionsForOrigin } = createMockedHandler();

    await handler(
      getBaseRequest({
        params: [{}],
      }),
    );
    expect(requestPermissionsForOrigin).toHaveBeenCalledWith({});
  });

  it('does not update or grant a CAIP-25 endowment permission if eth_accounts and permittedChains approvals were not requested', async () => {
    const { handler, updateCaveat, grantPermissions, getPermissionsForOrigin } =
      createMockedHandler();

    await handler(
      getBaseRequest({
        params: [
          {
            otherPermission: {},
          },
        ],
      }),
    );
    expect(getPermissionsForOrigin).not.toHaveBeenCalled();
    expect(updateCaveat).not.toHaveBeenCalled();
    expect(grantPermissions).not.toHaveBeenCalled();
  });

  it('returns the granted permissions if eth_accounts and permittedChains approvals were not requested', async () => {
    const { handler, response } = createMockedHandler();

    await handler(
      getBaseRequest({
        params: [
          {
            otherPermission: {},
          },
        ],
      }),
    );
    expect(response.result).toStrictEqual([
      {
        caveats: [{ value: { foo: 'bar' } }],
        id: '2',
        parentCapability: 'otherPermission',
      },
    ]);
  });

  it('does not update or grant a CAIP-25 endowment type permission if eth_accounts and permittedChains approvals were denied', async () => {
    const {
      handler,
      updateCaveat,
      grantPermissions,
      getPermissionsForOrigin,
      requestPermissionApprovalForOrigin,
    } = createMockedHandler();
    requestPermissionApprovalForOrigin.mockRejectedValue(
      new Error('user denied approval'),
    );

    try {
      await handler(
        getBaseRequest({
          params: [
            {
              [RestrictedMethods.eth_accounts]: {},
            },
          ],
        }),
      );
    } catch (err) {
      // noop
    }
    expect(getPermissionsForOrigin).not.toHaveBeenCalled();
    expect(updateCaveat).not.toHaveBeenCalled();
    expect(grantPermissions).not.toHaveBeenCalled();
  });

  describe('eth_accounts and permittedChains approvals were accepted', () => {
    it('sets the approved chainIds on an empty CAIP-25 caveat with isMultichainOrigin: false if origin is not snapId', async () => {
      const { handler } = createMockedHandler();

      await handler(
        getBaseRequest({
          origin: 'http://test.com',
        }),
      );
      expect(MockMultichain.setPermittedEthChainIds).toHaveBeenCalledWith(
        {
          requiredScopes: {},
          optionalScopes: {},
          isMultichainOrigin: false,
        },
        ['0x1', '0x5'],
      );
    });

    it('sets the approved accounts on the CAIP-25 caveat after the approved chainIds if origin is not snapId', async () => {
      const { handler } = createMockedHandler();
      MockMultichain.setPermittedEthChainIds.mockReturnValue({
        requiredScopes: {},
        optionalScopes: {},
        sessionProperties: { caveatValueWithEthChainIdsSet: true },
        isMultichainOrigin: false,
      });

      await handler(
        getBaseRequest({
          origin: 'http://test.com',
        }),
      );
      expect(MockMultichain.setEthAccounts).toHaveBeenCalledWith(
        {
          requiredScopes: {},
          optionalScopes: {},
          sessionProperties: { caveatValueWithEthChainIdsSet: true },
          isMultichainOrigin: false,
        },
        ['0xdeadbeef'],
      );
    });

    it('does not set the approved chainIds on an empty CAIP-25 caveat if origin is snapId', async () => {
      const { handler } = createMockedHandler();

      await handler(getBaseRequest({ origin: 'npm:snap' }));
      expect(MockMultichain.setPermittedEthChainIds).not.toHaveBeenCalled();
    });

    it('sets the approved accounts for the `wallet:eip155` scope with isMultichainOrigin: false if origin is snapId', async () => {
      const { handler } = createMockedHandler();

      await handler(getBaseRequest({ origin: 'npm:snap' }));
      expect(MockMultichain.setEthAccounts).toHaveBeenCalledWith(
        {
          requiredScopes: {},
          optionalScopes: {
            'wallet:eip155': {
              accounts: [],
            },
          },
          isMultichainOrigin: false,
        },
        ['0xdeadbeef'],
      );
    });

    it('gets permission for the origin', async () => {
      const { handler, getPermissionsForOrigin } = createMockedHandler();

      await handler(getBaseRequest());
      expect(getPermissionsForOrigin).toHaveBeenCalled();
    });

    it('throws an error when a CAIP-25 already exists that was granted from the multichain flow (isMultichainOrigin: true)', async () => {
      const { handler, getPermissionsForOrigin, end } = createMockedHandler();
      getPermissionsForOrigin.mockReturnValue({
        [Caip25EndowmentPermissionName]: {
          id: '1',
          parentCapability: Caip25EndowmentPermissionName,
          caveats: [
            {
              type: Caip25CaveatType,
              value: {
                requiredScopes: {},
                optionalScopes: {},
                isMultichainOrigin: true,
              },
            },
          ],
        },
      });

      await handler(getBaseRequest());
      expect(end).toHaveBeenCalledWith(
        new Error(
          'Cannot modify permission granted via the Multichain API. Either modify the permission using the Multichain API or revoke permissions and request again.',
        ),
      );
    });

    it('updates the caveat when a CAIP-25 already exists that was granted from the legacy flow (isMultichainOrigin: false)', async () => {
      const { handler, updateCaveat } = createMockedHandler();
      MockMultichain.setEthAccounts.mockReturnValue({
        requiredScopes: {},
        optionalScopes: {},
        sessionProperties: { caveatValueWithEthAccountsSet: true },
        isMultichainOrigin: false,
      });

      await handler(getBaseRequest());
      expect(updateCaveat).toHaveBeenCalledWith(
        Caip25EndowmentPermissionName,
        Caip25CaveatType,
        {
          requiredScopes: {},
          optionalScopes: {},
          sessionProperties: { caveatValueWithEthAccountsSet: true },
          isMultichainOrigin: false,
        },
      );
    });

    it('grants a CAIP-25 permission if one does not already exist', async () => {
      const { handler, getPermissionsForOrigin, grantPermissions } =
        createMockedHandler();
      getPermissionsForOrigin.mockReturnValue({});
      MockMultichain.setEthAccounts.mockReturnValue({
        requiredScopes: {},
        optionalScopes: {},
        sessionProperties: { caveatValueWithEthAccountsSet: true },
        isMultichainOrigin: false,
      });

      await handler(getBaseRequest());
      expect(grantPermissions).toHaveBeenCalledWith({
        [Caip25EndowmentPermissionName]: {
          caveats: [
            {
              type: Caip25CaveatType,
              value: {
                requiredScopes: {},
                optionalScopes: {},
                sessionProperties: { caveatValueWithEthAccountsSet: true },
                isMultichainOrigin: false,
              },
            },
          ],
        },
      });
    });

    it('gets the ordered eth accounts', async () => {
      const { handler, getAccounts } = createMockedHandler();

      await handler(getBaseRequest());
      expect(getAccounts).toHaveBeenCalled();
    });

    it('returns both eth_accounts and permittedChains permissions in addition to other permissions that were granted if origin is not snapId', async () => {
      const { handler, getAccounts, response } = createMockedHandler();
      getAccounts.mockReturnValue(['0xdeadbeef']);

      await handler(
        getBaseRequest({
          origin: 'http://test.com',
        }),
      );
      expect(response.result).toStrictEqual([
        {
          caveats: [{ value: { foo: 'bar' } }],
          id: '2',
          parentCapability: 'otherPermission',
        },
        {
          caveats: [
            {
              type: CaveatTypes.restrictReturnedAccounts,
              value: ['0xdeadbeef'],
            },
          ],
          id: '1',
          parentCapability: RestrictedMethods.eth_accounts,
        },
        {
          caveats: [
            {
              type: CaveatTypes.restrictNetworkSwitching,
              value: ['0x1', '0x5'],
            },
          ],
          id: '1',
          parentCapability: PermissionNames.permittedChains,
        },
      ]);
    });

    it('returns only eth_accounts permissions in addition to other permissions that were granted if origin is snapId', async () => {
      const { handler, getAccounts, response } = createMockedHandler();
      getAccounts.mockReturnValue(['0xdeadbeef']);

      await handler({ ...getBaseRequest(), origin: 'npm:snap' });
      expect(response.result).toStrictEqual([
        {
          caveats: [{ value: { foo: 'bar' } }],
          id: '2',
          parentCapability: 'otherPermission',
        },
        {
          caveats: [
            {
              type: CaveatTypes.restrictReturnedAccounts,
              value: ['0xdeadbeef'],
            },
          ],
          id: '1',
          parentCapability: RestrictedMethods.eth_accounts,
        },
      ]);
    });
  });
});
