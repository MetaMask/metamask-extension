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
    .mockResolvedValue([{ [Caip25EndowmentPermissionName]: {} }]);
  const getAccounts = jest.fn().mockReturnValue([]);
  const getCaip25PermissionFromLegacyPermissionsForOrigin = jest
    .fn()
    .mockReturnValue({});

  const grantPermissionsForOrigin = jest.fn().mockReturnValue({
    [Caip25EndowmentPermissionName]: {
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
  });
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
        getCaip25PermissionFromLegacyPermissionsForOrigin,
      },
    );

  return {
    response,
    next,
    end,
    getAccounts,
    requestPermissionsForOrigin,
    getCaip25PermissionFromLegacyPermissionsForOrigin,
    grantPermissionsForOrigin,
    handler,
  };
};

// check passing ethaccount and enndowmentl, result should have these (X)
// check just ethaccount (X)
// check just permitted chains (X)
// check passing caiup25, returns error (I should mock requestPermissionsForOrigin result, this func should be called with no permissions, because caip25 was deleted prior) []
// check ethaccount and enndowmentl, and caip25, should just return ethaccount and enndowmentl []
// check other permissions by themselves [X]
// check other permissions with ethaccount and enndowmentl as well []

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

  describe('only other permissions (non CAIP-25 equivalent) requested', () => {
    it('requests the permission for the other permissions', async () => {
      const { handler, requestPermissionsForOrigin } = createMockedHandler();

      await handler(
        getBaseRequest({
          params: [
            {
              otherPermissionA: {},
              otherPermissionB: {},
            },
          ],
        }),
      );

      expect(requestPermissionsForOrigin).toHaveBeenCalledWith({
        otherPermissionA: {},
        otherPermissionB: {},
      });
    });

    it('returns the other permissions that are granted', async () => {
      const { handler, requestPermissionsForOrigin, response } =
        createMockedHandler();

      requestPermissionsForOrigin.mockResolvedValue([
        {
          otherPermissionA: { foo: 'bar' },
          otherPermissionB: { hello: true },
        },
      ]);

      await handler(
        getBaseRequest({
          params: [
            {
              otherPermissionA: {},
              otherPermissionB: {},
            },
          ],
        }),
      );

      expect(response.result).toStrictEqual([{ foo: 'bar' }, { hello: true }]);
    });
  });

  describe('only CAIP-25 equivalent permissions ("eth_accounts" and/or "endowment:permittedChains") requested', () => {
    it('requests the CAIP-25 permission using eth_accounts when only eth_accounts is specified in params', async () => {
      const mockedRequestedPermissions = {
        [Caip25EndowmentPermissionName]: {
          caveats: [
            {
              type: Caip25CaveatType,
              value: {
                requiredScopes: {},
                optionalScopes: {
                  'wallet:eip155': { accounts: ['wallet:eip155:foo'] },
                },
                isMultichainOrigin: false,
              },
            },
          ],
        },
      };

      const {
        handler,
        getCaip25PermissionFromLegacyPermissionsForOrigin,
        requestPermissionsForOrigin,
        getAccounts,
      } = createMockedHandler();
      getCaip25PermissionFromLegacyPermissionsForOrigin.mockReturnValue(
        mockedRequestedPermissions,
      );
      requestPermissionsForOrigin.mockResolvedValue([
        mockedRequestedPermissions,
      ]);
      getAccounts.mockReturnValue(['foo']);

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

      expect(
        getCaip25PermissionFromLegacyPermissionsForOrigin,
      ).toHaveBeenCalledWith({
        [RestrictedMethods.eth_accounts]: {
          foo: 'bar',
        },
      });
    });

    it('requests the CAIP-25 permission for permittedChains when only permittedChains is specified in params', async () => {
      const mockedRequestedPermissions = {
        [Caip25EndowmentPermissionName]: {
          caveats: [
            {
              type: Caip25CaveatType,
              value: {
                requiredScopes: {},
                optionalScopes: {
                  'eip155:100': { accounts: [] },
                },
                isMultichainOrigin: false,
              },
            },
          ],
        },
      };

      const {
        handler,
        requestPermissionsForOrigin,
        getCaip25PermissionFromLegacyPermissionsForOrigin,
      } = createMockedHandler();

      getCaip25PermissionFromLegacyPermissionsForOrigin.mockReturnValue(
        mockedRequestedPermissions,
      );
      requestPermissionsForOrigin.mockResolvedValue([
        mockedRequestedPermissions,
      ]);

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

      expect(
        getCaip25PermissionFromLegacyPermissionsForOrigin,
      ).toHaveBeenCalledWith({
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
      const mockedRequestedPermissions = {
        [Caip25EndowmentPermissionName]: {
          caveats: [
            {
              type: Caip25CaveatType,
              value: {
                requiredScopes: {},
                optionalScopes: {
                  'eip155:100': { accounts: ['bar'] },
                },
                isMultichainOrigin: false,
              },
            },
          ],
        },
      };

      const {
        handler,
        requestPermissionsForOrigin,
        getAccounts,
        getCaip25PermissionFromLegacyPermissionsForOrigin,
      } = createMockedHandler();

      requestPermissionsForOrigin.mockResolvedValue([
        mockedRequestedPermissions,
      ]);
      getAccounts.mockReturnValue(['bar']);
      getCaip25PermissionFromLegacyPermissionsForOrigin.mockReturnValue(
        mockedRequestedPermissions,
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

      expect(
        getCaip25PermissionFromLegacyPermissionsForOrigin,
      ).toHaveBeenCalledWith({
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

    it('grants the CAIP-25 approval', async () => {
      const {
        handler,
        getAccounts,
        getCaip25PermissionFromLegacyPermissionsForOrigin,
        grantPermissionsForOrigin,
      } = createMockedHandler();
      getAccounts.mockReturnValue(['0xdeadbeef']);
      getCaip25PermissionFromLegacyPermissionsForOrigin.mockResolvedValue({
        foo: 'bar',
      });

      await handler(getBaseRequest());
      expect(grantPermissionsForOrigin).toHaveBeenCalledWith({ foo: 'bar' });
    });

    it('returns both eth_accounts and permittedChains permissions that were granted if there are permitted chains', async () => {
      const { handler, getAccounts, grantPermissionsForOrigin, response } =
        createMockedHandler();
      getAccounts.mockReturnValue(['0xdeadbeef']);
      grantPermissionsForOrigin.mockReturnValue({
        [Caip25EndowmentPermissionName]: {
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
        },
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
      const { handler, getAccounts, grantPermissionsForOrigin, response } =
        createMockedHandler();
      getAccounts.mockReturnValue(['0xdeadbeef']);
      grantPermissionsForOrigin.mockReturnValue({
        [Caip25EndowmentPermissionName]: {
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
        },
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

  describe('both CAIP-25 equivalent and other permissions requested', () => {
    describe('both CAIP-25 equivalent permissions and other permissions are approved', () => {
      it('returns eth_accounts, permittedChains, and other permissions that were granted', async () => {
        const {
          handler,
          getAccounts,
          requestPermissionsForOrigin,
          grantPermissionsForOrigin,
          response,
        } = createMockedHandler();
        requestPermissionsForOrigin.mockResolvedValue([
          {
            otherPermissionA: { foo: 'bar' },
            otherPermissionB: { hello: true },
          },
        ]);
        getAccounts.mockReturnValue(['0xdeadbeef']);
        grantPermissionsForOrigin.mockReturnValue({
          [Caip25EndowmentPermissionName]: {
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
          },
        });

        await handler(
          getBaseRequest({
            params: [
              {
                eth_accounts: {},
                'endowment:permitted-chains': {},
                otherPermissionA: {},
                otherPermissionB: {},
              },
            ],
          }),
        );
        expect(response.result).toStrictEqual([
          { foo: 'bar' },
          { hello: true },
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
    });

    describe('CAIP-25 equivalent permissions are approved, but other permissions are not approved', () => {
      it('does not grant the CAIP-25 permission', async () => {
        const {
          handler,
          requestPermissionsForOrigin,
          grantPermissionsForOrigin,
        } = createMockedHandler();
        requestPermissionsForOrigin.mockRejectedValue(
          new Error('other permissions rejected'),
        );

        await handler(
          getBaseRequest({
            params: [
              {
                eth_accounts: {},
                'endowment:permitted-chains': {},
                otherPermissionA: {},
                otherPermissionB: {},
              },
            ],
          }),
        );

        expect(grantPermissionsForOrigin).not.toHaveBeenCalled();
      });

      it('returns an error that the other permissions were not approved', async () => {
        const { handler, requestPermissionsForOrigin, end } =
          createMockedHandler();
        requestPermissionsForOrigin.mockRejectedValue(
          new Error('other permissions rejected'),
        );

        await handler(
          getBaseRequest({
            params: [
              {
                eth_accounts: {},
                'endowment:permitted-chains': {},
                otherPermissionA: {},
                otherPermissionB: {},
              },
            ],
          }),
        );

        expect(end).toHaveBeenCalledWith(
          new Error('other permissions rejected'),
        );
      });
    });

    describe('CAIP-25 equivalent permissions are not approved', () => {
      it('does not grant the CAIP-25 permission', async () => {
        const {
          handler,
          getCaip25PermissionFromLegacyPermissionsForOrigin,
          grantPermissionsForOrigin,
        } = createMockedHandler();
        getCaip25PermissionFromLegacyPermissionsForOrigin.mockRejectedValue(
          new Error('caip25 approval rejected'),
        );

        await handler(
          getBaseRequest({
            params: [
              {
                eth_accounts: {},
                'endowment:permitted-chains': {},
                otherPermissionA: {},
                otherPermissionB: {},
              },
            ],
          }),
        );

        expect(grantPermissionsForOrigin).not.toHaveBeenCalled();
      });

      it('does not request approval for the other permissions', async () => {
        const {
          handler,
          getCaip25PermissionFromLegacyPermissionsForOrigin,
          requestPermissionsForOrigin,
        } = createMockedHandler();
        getCaip25PermissionFromLegacyPermissionsForOrigin.mockRejectedValue(
          new Error('caip25 approval rejected'),
        );

        await handler(
          getBaseRequest({
            params: [
              {
                eth_accounts: {},
                'endowment:permitted-chains': {},
                otherPermissionA: {},
                otherPermissionB: {},
              },
            ],
          }),
        );

        expect(requestPermissionsForOrigin).not.toHaveBeenCalled();
      });

      it('returns an error that the CAIP-25 permissions were not approved', async () => {
        const {
          handler,
          getCaip25PermissionFromLegacyPermissionsForOrigin,
          end,
        } = createMockedHandler();
        getCaip25PermissionFromLegacyPermissionsForOrigin.mockRejectedValue(
          new Error('caip25 approval rejected'),
        );

        await handler(
          getBaseRequest({
            params: [
              {
                eth_accounts: {},
                'endowment:permitted-chains': {},
                otherPermissionA: {},
                otherPermissionB: {},
              },
            ],
          }),
        );

        expect(end).toHaveBeenCalledWith(new Error('caip25 approval rejected'));
      });
    });
  });

  describe('no permissions requested', () => {
    it('returns an error by requesting empty permissions in params from the PermissionController if no permissions specified', async () => {
      const { handler, requestPermissionsForOrigin } = createMockedHandler();
      requestPermissionsForOrigin.mockRejectedValue(
        new Error('failed to request unexpected permission'),
      );

      await expect(
        handler(
          getBaseRequest({
            params: [{}],
          }),
        ),
      ).rejects.toThrow('failed to request unexpected permission');
    });
  });
});
