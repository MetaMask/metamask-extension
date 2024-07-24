import { invalidParams } from '@metamask/permission-controller';
import { CaveatTypes } from '../../../../shared/constants/permissions';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from './caip25permissions';
import { requestPermissionsHandler } from './wallet-requestPermissions';

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
  const requestPermissionsForOrigin = jest.fn().mockResolvedValue([
    {
      eth_accounts: {
        id: '1',
        parentCapability: 'eth_accounts',
        caveats: [
          {
            value: ['0xdead', '0xbeef'],
          },
        ],
      },
    },
  ]);
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
                accounts: ['eip155:1:0x4'],
              },
              'other:1': {
                methods: [],
                notifications: [],
                accounts: ['other:1:0x4'],
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
  const getNetworkConfigurationByNetworkClientId = jest.fn().mockReturnValue({
    chainId: '0x1',
  });
  const updateCaveat = jest.fn();
  const grantPermissions = jest.fn().mockReturnValue({
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
  });
  const response = {};
  const handler = (request) =>
    requestPermissionsHandler.implementation(request, response, next, end, {
      requestPermissionsForOrigin,
      getPermissionsForOrigin,
      getNetworkConfigurationByNetworkClientId,
      updateCaveat,
      grantPermissions,
    });

  return {
    response,
    next,
    end,
    requestPermissionsForOrigin,
    getPermissionsForOrigin,
    getNetworkConfigurationByNetworkClientId,
    updateCaveat,
    grantPermissions,
    handler,
  };
};

describe('requestPermissionsHandler', () => {
  it('returns an error if params is malformed', async () => {
    const { handler, end } = createMockedHandler();

    const malformedRequest = {
      ...baseRequest,
      params: [],
    };
    await handler(malformedRequest);
    expect(end).toHaveBeenCalledWith(
      invalidParams({ data: { request: malformedRequest } }),
    );
  });

  it('requests permissions from params, but ignores CAIP-25 if specified', async () => {
    const { handler, requestPermissionsForOrigin } = createMockedHandler();

    await handler(baseRequest);
    expect(requestPermissionsForOrigin).toHaveBeenCalledWith({
      eth_accounts: {},
      otherPermission: {},
    });
  });

  describe('BARAD_DUR flag is not set', () => {
    beforeAll(() => {
      delete process.env.BARAD_DUR;
    });

    it('does not update/grant a CAIP-25 endowment', async () => {
      const { handler, updateCaveat, grantPermissions } = createMockedHandler();

      await handler(baseRequest);
      expect(updateCaveat).not.toHaveBeenCalled();
      expect(grantPermissions).not.toHaveBeenCalled();
    });

    it('returns the granted permissions', async () => {
      const { handler, response } = createMockedHandler();

      await handler(baseRequest);
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
      ]);
    });
  });

  describe('BARAD_DUR flag is set', () => {
    beforeAll(() => {
      process.env.BARAD_DUR = 1;
    });

    it('does not update/grant a CAIP-25 endowment if eth_accounts was not granted', async () => {
      const {
        handler,
        requestPermissionsForOrigin,
        updateCaveat,
        grantPermissions,
      } = createMockedHandler();
      requestPermissionsForOrigin.mockResolvedValue([{}]);

      await handler(baseRequest);
      expect(updateCaveat).not.toHaveBeenCalled();
      expect(grantPermissions).not.toHaveBeenCalled();
    });

    it('returns the unmodified granted permissions if eth_accounts was not granted', async () => {
      const { handler, requestPermissionsForOrigin, response } =
        createMockedHandler();
      requestPermissionsForOrigin.mockResolvedValue([
        {
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
        },
      ]);

      await handler(baseRequest);
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

    it('gets permission for the origin', async () => {
      const { handler, getPermissionsForOrigin } = createMockedHandler();

      await handler(baseRequest);
      expect(getPermissionsForOrigin).toHaveBeenCalledWith('http://test.com');
    });

    describe('CAIP-25 permission does not exist', () => {
      it('grants a new CAIP-25 endowment with an optional scope for the current chain', async () => {
        const { handler, getPermissionsForOrigin, grantPermissions } =
          createMockedHandler();
        getPermissionsForOrigin.mockReturnValue({});

        await handler(baseRequest);
        expect(grantPermissions).toHaveBeenCalledWith({
          subject: {
            origin: 'http://test.com',
          },
          approvedPermissions: {
            [Caip25EndowmentPermissionName]: {
              caveats: [
                {
                  type: Caip25CaveatType,
                  value: {
                    requiredScopes: {},
                    optionalScopes: {
                      'eip155:1': {
                        methods: [],
                        notifications: [],
                        accounts: ['eip155:1:0xdead', 'eip155:1:0xbeef'],
                      },
                    },
                  },
                },
              ],
            },
          },
        });
      });

      it('returns the granted permissions with the CAIP-25 endowment transformed into eth_accounts', async () => {
        const { handler, getPermissionsForOrigin, response } =
          createMockedHandler();
        getPermissionsForOrigin.mockReturnValue({});

        await handler(baseRequest);
        expect(response.result).toStrictEqual([
          {
            id: 'new',
            parentCapability: 'eth_accounts',
            caveats: [
              {
                value: ['0xdead', '0xbeef'],
              },
            ],
          },
        ]);
      });
    });

    describe('CAIP-25 permission does exist', () => {
      it('updates the existing CAIP-25 endowment with an optional scope for the current chain', async () => {
        const { handler, updateCaveat } = createMockedHandler();

        await handler(baseRequest);
        expect(updateCaveat).toHaveBeenCalledWith(
          'http://test.com',
          Caip25EndowmentPermissionName,
          Caip25CaveatType,
          {
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
                accounts: [
                  'eip155:1:0x4',
                  'eip155:1:0xdead',
                  'eip155:1:0xbeef',
                ],
              },
              'other:1': {
                methods: [],
                notifications: [],
                accounts: ['other:1:0x4'],
              },
            },
          },
        );
      });

      it('returns the granted permissions with the existing CAIP-25 endowment transformed into eth_accounts', async () => {
        const { handler, response } = createMockedHandler();

        await handler(baseRequest);
        expect(response.result).toStrictEqual([
          {
            id: '2',
            parentCapability: 'eth_accounts',
            caveats: [
              {
                type: CaveatTypes.restrictReturnedAccounts,
                value: ['0xdead', '0xbeef', '0x1', '0x2', '0x4', '0x3'],
              },
            ],
          },
        ]);
      });
    });
  });
});
