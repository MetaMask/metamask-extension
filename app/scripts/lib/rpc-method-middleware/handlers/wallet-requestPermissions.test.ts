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
  const requestPermissionsForOrigin = jest.fn().mockResolvedValue({});
  const getAccounts = jest.fn().mockReturnValue([]);
  const requestCaip25ApprovalForOrigin = jest.fn().mockResolvedValue({});
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
        requestCaip25ApprovalForOrigin,
        grantPermissionsForOrigin,
      },
    );

  return {
    response,
    next,
    end,
    getAccounts,
    requestPermissionsForOrigin,
    requestCaip25ApprovalForOrigin,
    grantPermissionsForOrigin,
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

  describe('only other permissions (non CAIP-25 equivalent) requested', () => {
    it('it treats "endowment:caip25" as an other permission', async () => {
      const {
        handler,
        requestPermissionsForOrigin,
        requestCaip25ApprovalForOrigin,
      } = createMockedHandler();

      await handler(
        getBaseRequest({
          params: [
            {
              [Caip25EndowmentPermissionName]: {},
            },
          ],
        }),
      );

      expect(requestPermissionsForOrigin).toHaveBeenCalledWith({
        [Caip25EndowmentPermissionName]: {},
      });
      expect(requestCaip25ApprovalForOrigin).not.toHaveBeenCalled();
    });

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

    it('returns an error if requesting other permissions fails', async () => {
      const { handler, requestPermissionsForOrigin, end } =
        createMockedHandler();

      requestPermissionsForOrigin.mockRejectedValue(
        new Error('failed to request other permissions'),
      );

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

      expect(end).toHaveBeenCalledWith(
        new Error('failed to request other permissions'),
      );
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
      const { handler, requestCaip25ApprovalForOrigin } = createMockedHandler();

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

      expect(requestCaip25ApprovalForOrigin).toHaveBeenCalledWith({
        [RestrictedMethods.eth_accounts]: {
          foo: 'bar',
        },
      });
    });

    it('requests the CAIP-25 permission for permittedChains when only permittedChains is specified in params', async () => {
      const { handler, requestCaip25ApprovalForOrigin } = createMockedHandler();

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

      expect(requestCaip25ApprovalForOrigin).toHaveBeenCalledWith({
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
      const { handler, requestCaip25ApprovalForOrigin } = createMockedHandler();

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

      expect(requestCaip25ApprovalForOrigin).toHaveBeenCalledWith({
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

    it('returns an error if requesting the CAIP-25 approval fails', async () => {
      const { handler, requestCaip25ApprovalForOrigin, end } =
        createMockedHandler();
      requestCaip25ApprovalForOrigin.mockRejectedValue(
        new Error('failed to request caip25 approval'),
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
        new Error('failed to request caip25 approval'),
      );
    });

    it('grants the CAIP-25 approval', async () => {
      const {
        handler,
        getAccounts,
        requestCaip25ApprovalForOrigin,
        grantPermissionsForOrigin,
      } = createMockedHandler();
      getAccounts.mockReturnValue(['0xdeadbeef']);
      requestCaip25ApprovalForOrigin.mockResolvedValue({
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
          requestCaip25ApprovalForOrigin,
          grantPermissionsForOrigin,
        } = createMockedHandler();
        requestCaip25ApprovalForOrigin.mockRejectedValue(
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
          requestCaip25ApprovalForOrigin,
          requestPermissionsForOrigin,
        } = createMockedHandler();
        requestCaip25ApprovalForOrigin.mockRejectedValue(
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
        const { handler, requestCaip25ApprovalForOrigin, end } =
          createMockedHandler();
        requestCaip25ApprovalForOrigin.mockRejectedValue(
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
      const { handler, requestPermissionsForOrigin, end } =
        createMockedHandler();
      requestPermissionsForOrigin.mockRejectedValue(
        new Error('failed to request unexpected permission'),
      );

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
  });
});
