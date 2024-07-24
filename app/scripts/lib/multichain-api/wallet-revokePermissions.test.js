import { invalidParams } from '@metamask/permission-controller';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from './caip25permissions';
import { revokePermissionsHandler } from './wallet-revokePermissions';

const baseRequest = {
  origin: 'http://test.com',
  params: [
    {
      eth_accounts: {},
      [Caip25EndowmentPermissionName]: {},
      otherPermission: {},
    },
  ],
};

const createMockedHandler = () => {
  const next = jest.fn();
  const end = jest.fn();
  const revokePermissionsForOrigin = jest.fn();
  const getPermissionsForOrigin = jest.fn().mockReturnValue({
    eth_accounts: {
      id: '1',
      parentCapability: 'eth_accounts',
      caveats: [
        {
          value: ['0xdead', '0xbeef'],
        },
      ],
    },
    [Caip25EndowmentPermissionName]: {
      id: '2',
      parentCapability: Caip25EndowmentPermissionName,
      caveats: [
        {
          type: Caip25CaveatType,
          value: {
            requiredScopes: {
              'eip155:1': {
                methods: [],
                notifications: [],
                accounts: ['eip155:1:0x1', 'eip155:1:0x2'],
              },
              'eip155:5': {
                methods: [],
                notifications: [],
                accounts: ['eip155:5:0x1', 'eip155:5:0x3'],
              },
            },
            optionalScopes: {
              'eip155:1': {
                methods: [],
                notifications: [],
                accounts: ['eip155:1:0xdeadbeef'],
              },
              'other:1': {
                methods: [],
                notifications: [],
                accounts: ['other:1:0xdeadbeef'],
              },
            },
          },
        },
      ],
    },
    otherPermission: {
      id: '3',
      parentCapability: 'otherPermission',
      caveats: [
        {
          value: {
            foo: 'bar',
          },
        },
      ],
    },
  });
  const updateCaveat = jest.fn();
  const response = {};
  const handler = (request) =>
    revokePermissionsHandler.implementation(request, response, next, end, {
      revokePermissionsForOrigin,
      getPermissionsForOrigin,
      updateCaveat,
    });

  return {
    response,
    next,
    end,
    revokePermissionsForOrigin,
    getPermissionsForOrigin,
    updateCaveat,
    handler,
  };
};

describe('revokePermissionsHandler', () => {
  beforeAll(() => {
    delete process.env.BARAD_DUR;
  });

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

  it('revokes permissions from params, but ignores CAIP-25 if specified', () => {
    const { handler, revokePermissionsForOrigin } = createMockedHandler();

    handler(baseRequest);
    expect(revokePermissionsForOrigin).toHaveBeenCalledWith([
      'eth_accounts',
      'otherPermission',
    ]);
  });

  it('returns null', () => {
    const { handler, response } = createMockedHandler();

    handler(baseRequest);
    expect(response.result).toStrictEqual(null);
  });

  describe('BARAD_DUR flag is set', () => {
    beforeAll(() => {
      process.env.BARAD_DUR = 1;
    });

    it('does not update the CAIP-25 endowment if it does not exist', () => {
      const { handler, getPermissionsForOrigin, updateCaveat } =
        createMockedHandler();

      getPermissionsForOrigin.mockReturnValue({
        eth_accounts: {
          id: '1',
          parentCapability: 'eth_accounts',
          caveats: [
            {
              value: ['0xdead', '0xbeef'],
            },
          ],
        },
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
      });

      handler(baseRequest);
      expect(updateCaveat).not.toHaveBeenCalled();
    });

    it('does not update the CAIP-25 endowment if eth_accounts was not revoked', () => {
      const { handler, updateCaveat } = createMockedHandler();

      handler({
        ...baseRequest,
        params: [{ otherParams: {} }],
      });
      expect(updateCaveat).not.toHaveBeenCalled();
    });

    it('updates the CAIP-25 endowment with all eip155 accounts removed', () => {
      const { handler, updateCaveat } = createMockedHandler();

      handler(baseRequest);
      expect(updateCaveat).toHaveBeenCalledWith(
        'http://test.com',
        Caip25EndowmentPermissionName,
        Caip25CaveatType,
        {
          requiredScopes: {
            'eip155:1': {
              methods: [],
              notifications: [],
              accounts: [],
            },
            'eip155:5': {
              methods: [],
              notifications: [],
              accounts: [],
            },
          },
          optionalScopes: {
            'eip155:1': {
              methods: [],
              notifications: [],
              accounts: [],
            },
            'other:1': {
              methods: [],
              notifications: [],
              accounts: ['other:1:0xdeadbeef'],
            },
          },
        },
      );
    });
  });
});
