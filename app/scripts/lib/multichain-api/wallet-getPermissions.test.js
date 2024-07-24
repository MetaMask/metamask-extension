import { CaveatTypes } from '../../../../shared/constants/permissions';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from './caip25permissions';
import { getPermissionsHandler } from './wallet-getPermissions';

const baseRequest = {
  origin: 'http://test.com',
};

const createMockedHandler = () => {
  const next = jest.fn();
  const end = jest.fn();
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
  const response = {};
  const handler = (request) =>
    getPermissionsHandler.implementation(request, response, next, end, {
      getPermissionsForOrigin,
    });

  return {
    response,
    next,
    end,
    getPermissionsForOrigin,
    handler,
  };
};

describe('getPermissionsHandler', () => {
  beforeAll(() => {
    delete process.env.BARAD_DUR;
  });

  it('gets the permissions for the origin', () => {
    const { handler, getPermissionsForOrigin } = createMockedHandler();

    handler(baseRequest);
    expect(getPermissionsForOrigin).toHaveBeenCalled();
  });

  it('does not return the CAIP-25 endowment', () => {
    const { handler, response } = createMockedHandler();

    handler(baseRequest);
    expect(response.result).toStrictEqual([
      {
        id: '1',
        parentCapability: 'eth_accounts',
        caveats: [
          {
            value: ['0xdead', '0xbeef'],
          },
        ],
      },
      {
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
    ]);
  });

  describe('BARAD_DUR flag is set', () => {
    beforeAll(() => {
      process.env.BARAD_DUR = 1;
    });

    it('returns the permissions without the CAIP-25 endowment if the CAIP-25 caveat is not found', () => {
      const { handler, getPermissionsForOrigin, response } =
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
      expect(response.result).toStrictEqual([
        {
          id: '1',
          parentCapability: 'eth_accounts',
          caveats: [
            {
              value: ['0xdead', '0xbeef'],
            },
          ],
        },
        {
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
      ]);
    });

    it('returns the permissions without eth_accounts and the CAIP-25 endowement if there are no accounts authorized for eip155 namespaces', () => {
      const { handler, getPermissionsForOrigin, response } =
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
        [Caip25EndowmentPermissionName]: {
          id: '2',
          parentCapability: Caip25EndowmentPermissionName,
          caveats: [
            {
              type: Caip25CaveatType,
              value: {
                requiredScopes: {
                  wallet: {
                    methods: [],
                    notifications: [],
                    accounts: [],
                  },
                },
                optionalScopes: {
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

      handler(baseRequest);
      expect(response.result).toStrictEqual([
        {
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
      ]);
    });

    it('returns the permissions with the CAIP-25 endowement transformed into a eth_accounts permission if there are accounts authorized for eip155 namespaces', () => {
      const { handler, response } = createMockedHandler();

      handler(baseRequest);
      console.log(response.result);
      expect(response.result).toStrictEqual([
        {
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
        {
          id: '2',
          parentCapability: 'eth_accounts',
          caveats: [
            {
              type: CaveatTypes.restrictReturnedAccounts,
              value: ['0x1', '0x2', '0xdeadbeef', '0x3'],
            },
          ],
        },
      ]);
    });
  });
});
