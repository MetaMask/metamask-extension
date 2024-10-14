import { invalidParams } from '@metamask/permission-controller';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from '@metamask/multichain';
import { PermissionNames } from '../../../controllers/permissions';
import { RestrictedMethods } from '../../../../../shared/constants/permissions';
import { revokePermissionsHandler } from './wallet-revokePermissions';

const baseRequest = {
  origin: 'http://test.com',
  params: [
    {
      [Caip25EndowmentPermissionName]: {},
      otherPermission: {},
    },
  ],
};

const createMockedHandler = () => {
  const next = jest.fn();
  const end = jest.fn();
  const revokePermissionsForOrigin = jest.fn();
  const getPermissionsForOrigin = jest.fn().mockReturnValue(
    Object.freeze({
      [Caip25EndowmentPermissionName]: {
        id: '1',
        parentCapability: Caip25EndowmentPermissionName,
        caveats: [
          {
            type: Caip25CaveatType,
            value: {
              requiredScopes: {},
              optionalScopes: {},
              isMultichainOrigin: false,
            },
          },
        ],
      },
    }),
  );
  const response = {};
  const handler = (request) =>
    revokePermissionsHandler.implementation(request, response, next, end, {
      revokePermissionsForOrigin,
      getPermissionsForOrigin,
    });

  return {
    response,
    next,
    end,
    revokePermissionsForOrigin,
    getPermissionsForOrigin,
    handler,
  };
};

describe('revokePermissionsHandler', () => {
  it('returns an error if params is malformed', () => {
    const { handler, end } = createMockedHandler();

    const malformedRequest = {
      ...baseRequest,
      params: [],
    };
    handler(malformedRequest);
    expect(end).toHaveBeenCalledWith(
      invalidParams({ data: { request: malformedRequest } }),
    );
  });

  it('returns an error if params are empty', () => {
    const { handler, end } = createMockedHandler();

    const emptyRequest = {
      ...baseRequest,
      params: [{}],
    };
    handler(emptyRequest);
    expect(end).toHaveBeenCalledWith(
      invalidParams({ data: { request: emptyRequest } }),
    );
  });

  it('returns an error if params only the CAIP-25 permission is specified', () => {
    const { handler, end } = createMockedHandler();

    const emptyRequest = {
      ...baseRequest,
      params: [
        {
          [Caip25EndowmentPermissionName]: {},
        },
      ],
    };
    handler(emptyRequest);
    expect(end).toHaveBeenCalledWith(
      invalidParams({ data: { request: emptyRequest } }),
    );
  });

  describe.each([
    [RestrictedMethods.eth_accounts],
    [PermissionNames.permittedChains],
  ])('%s permission is specified', (permission) => {
    it('gets permissions for the origin', () => {
      const { handler, getPermissionsForOrigin } = createMockedHandler();

      handler({
        ...baseRequest,
        params: [
          {
            [permission]: {},
          },
        ],
      });
      expect(getPermissionsForOrigin).toHaveBeenCalled();
    });

    it('revokes the CAIP-25 endowment permission', () => {
      const { handler, revokePermissionsForOrigin } = createMockedHandler();

      handler({
        ...baseRequest,
        params: [
          {
            [permission]: {},
          },
        ],
      });
      expect(revokePermissionsForOrigin).toHaveBeenCalledWith([
        Caip25EndowmentPermissionName,
      ]);
    });

    it('revokes other permissions specified', () => {
      const { handler, revokePermissionsForOrigin } = createMockedHandler();

      handler({
        ...baseRequest,
        params: [
          {
            [permission]: {},
            otherPermission: {},
          },
        ],
      });
      expect(revokePermissionsForOrigin).toHaveBeenCalledWith([
        'otherPermission',
        Caip25EndowmentPermissionName,
      ]);
    });

    it('throws an error when a CAIP-25 permission exists from the multichain flow (isMultichainOrigin: true)', () => {
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

      handler({
        ...baseRequest,
        params: [
          {
            [permission]: {},
            otherPermission: {},
          },
        ],
      });
      expect(end).toHaveBeenCalledWith(
        new Error('cannot modify permission granted from multichain flow'),
      );
    });
  });

  it('revokes permissions other than eth_accounts, permittedChains, CAIP-25 if specified', () => {
    const { handler, revokePermissionsForOrigin } = createMockedHandler();

    handler(baseRequest);
    expect(revokePermissionsForOrigin).toHaveBeenCalledWith([
      'otherPermission',
    ]);
  });

  it('returns null', () => {
    const { handler, response } = createMockedHandler();

    handler(baseRequest);
    expect(response.result).toStrictEqual(null);
  });
});
