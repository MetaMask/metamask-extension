import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from '@metamask/multichain/caip25Permission';
import PermittedChainsAdapters from '@metamask/multichain/adapters/caip-permission-adapter-permittedChains';
import {
  CaveatTypes,
  RestrictedMethods,
} from '../../../../shared/constants/permissions';
import { PermissionNames } from '../../controllers/permissions';
import { getPermissionsHandler } from './wallet-getPermissions';

jest.mock(
  '@metamask/multichain/adapters/caip-permission-adapter-permittedChains',
  () => ({
    ...jest.requireActual(
      '@metamask/multichain/adapters/caip-permission-adapter-permittedChains',
    ),
    getPermittedEthChainIds: jest.fn(),
  }),
);
const MockPermittedChainsAdapters = jest.mocked(PermittedChainsAdapters);

const baseRequest = {
  origin: 'http://test.com',
};

const createMockedHandler = () => {
  const next = jest.fn();
  const end = jest.fn();
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
  );
  const getAccounts = jest
    .fn()
    .mockResolvedValue(['0x1', '0x2', '0x3', '0xdeadbeef']);
  const response = {};
  const handler = (request) =>
    getPermissionsHandler.implementation(request, response, next, end, {
      getPermissionsForOrigin,
      getAccounts,
    });

  return {
    response,
    next,
    end,
    getPermissionsForOrigin,
    getAccounts,
    handler,
  };
};

describe('getPermissionsHandler', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  beforeEach(() => {
    MockPermittedChainsAdapters.getPermittedEthChainIds.mockReturnValue([]);
  });

  it('gets the permissions for the origin', async () => {
    const { handler, getPermissionsForOrigin } = createMockedHandler();

    await handler(baseRequest);
    expect(getPermissionsForOrigin).toHaveBeenCalled();
  });

  it('returns permissions unmodified if no CAIP-25 endowment permission has been granted', async () => {
    const { handler, getPermissionsForOrigin, response } =
      createMockedHandler();

    getPermissionsForOrigin.mockReturnValue(
      Object.freeze({
        otherPermission: {
          id: '1',
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
    );

    await handler(baseRequest);
    expect(response.result).toStrictEqual([
      {
        id: '1',
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

  describe('CAIP-25 endowment permissions has been granted', () => {
    it('returns the permissions with the CAIP-25 permission removed', async () => {
      const { handler, getAccounts, response } = createMockedHandler();
      getAccounts.mockResolvedValue([]);
      await handler(baseRequest);
      expect(response.result).toStrictEqual([
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

    it('gets the lastSelected sorted permissioned eth accounts for the origin', async () => {
      const { handler, getAccounts } = createMockedHandler();
      await handler(baseRequest);
      expect(getAccounts).toHaveBeenCalled();
    });

    it('returns the permissions with an eth_accounts permission if some eth accounts are permissioned', async () => {
      const { handler, response } = createMockedHandler();

      await handler(baseRequest);
      expect(response.result).toStrictEqual([
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
        {
          id: '1',
          parentCapability: RestrictedMethods.eth_accounts,
          caveats: [
            {
              type: CaveatTypes.restrictReturnedAccounts,
              value: ['0x1', '0x2', '0x3', '0xdeadbeef'],
            },
          ],
        },
      ]);
    });

    it('gets the permitted eip155 chainIds from the CAIP-25 caveat value', async () => {
      const { handler } = createMockedHandler();
      await handler(baseRequest);
      expect(
        MockPermittedChainsAdapters.getPermittedEthChainIds,
      ).toHaveBeenCalledWith({
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
      });
    });

    it('returns the permissions with a permittedChains permission if some eip155 chainIds are permissioned', async () => {
      const { handler, getAccounts, response } = createMockedHandler();
      getAccounts.mockResolvedValue([]);
      MockPermittedChainsAdapters.getPermittedEthChainIds.mockReturnValue([
        '0x1',
        '0x64',
      ]);

      await handler(baseRequest);
      expect(response.result).toStrictEqual([
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
        {
          id: '1',
          parentCapability: PermissionNames.permittedChains,
          caveats: [
            {
              type: CaveatTypes.restrictNetworkSwitching,
              value: ['0x1', '0x64'],
            },
          ],
        },
      ]);
    });

    it('returns the permissions with a eth_accounts and permittedChains permission if some eip155 accounts and chainIds are permissioned', async () => {
      const { handler, getAccounts, response } = createMockedHandler();
      getAccounts.mockResolvedValue(['0x1', '0x2', '0xdeadbeef']);
      MockPermittedChainsAdapters.getPermittedEthChainIds.mockReturnValue([
        '0x1',
        '0x64',
      ]);

      await handler(baseRequest);
      expect(response.result).toStrictEqual([
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
        {
          id: '1',
          parentCapability: RestrictedMethods.eth_accounts,
          caveats: [
            {
              type: CaveatTypes.restrictReturnedAccounts,
              value: ['0x1', '0x2', '0xdeadbeef'],
            },
          ],
        },
        {
          id: '1',
          parentCapability: PermissionNames.permittedChains,
          caveats: [
            {
              type: CaveatTypes.restrictNetworkSwitching,
              value: ['0x1', '0x64'],
            },
          ],
        },
      ]);
    });
  });
});
