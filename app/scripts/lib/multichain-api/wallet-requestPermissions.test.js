import { invalidParams } from '@metamask/permission-controller';
import {
  CaveatTypes,
  RestrictedMethods,
} from '../../../../shared/constants/permissions';
import { PermissionNames } from '../../controllers/permissions';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from './caip25permissions';
import { requestPermissionsHandler } from './wallet-requestPermissions';
import PermittedChainsAdapters from './adapters/caip-permission-adapter-permittedChains';
import EthAccountsAdapters from './adapters/caip-permission-adapter-eth-accounts';

jest.mock('./adapters/caip-permission-adapter-permittedChains', () => ({
  ...jest.requireActual('./adapters/caip-permission-adapter-permittedChains'),
  setPermittedEthChainIds: jest.fn(),
}));
const MockPermittedChainsAdapters = jest.mocked(PermittedChainsAdapters);

jest.mock('./adapters/caip-permission-adapter-eth-accounts', () => ({
  ...jest.requireActual('./adapters/caip-permission-adapter-eth-accounts'),
  setEthAccounts: jest.fn(),
}));
const MockEthAccountsAdapters = jest.mocked(EthAccountsAdapters);

const getBaseRequest = () => ({
  networkClientId: 'mainnet',
  origin: 'http://test.com',
  params: [
    {
      eth_accounts: {},
      [Caip25EndowmentPermissionName]: {},
      otherPermission: {},
    },
  ],
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
  const getAccounts = jest.fn().mockResolvedValue([]);
  const response = {};
  const handler = (request) =>
    requestPermissionsHandler.implementation(request, response, next, end, {
      requestPermissionsForOrigin,
      getPermissionsForOrigin,
      updateCaveat,
      grantPermissions,
      requestPermissionApprovalForOrigin,
      getAccounts,
      request,
    });

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
    MockEthAccountsAdapters.setEthAccounts.mockImplementation(
      (caveatValue) => caveatValue,
    );
    MockPermittedChainsAdapters.setPermittedEthChainIds.mockImplementation(
      (caveatValue) => caveatValue,
    );
  });

  it('returns an error if params is malformed', async () => {
    const { handler, end } = createMockedHandler();

    const malformedRequest = {
      ...getBaseRequest(),
      params: [],
    };
    await handler(malformedRequest);
    expect(end).toHaveBeenCalledWith(
      invalidParams({ data: { request: malformedRequest } }),
    );
  });

  it('requests approval from the ApprovalController for eth_accounts and permittedChains when only eth_accounts is specified in params', async () => {
    const { handler, requestPermissionApprovalForOrigin } =
      createMockedHandler();

    await handler({
      ...getBaseRequest(),
      params: [
        {
          [RestrictedMethods.eth_accounts]: {
            foo: 'bar',
          },
        },
      ],
    });

    expect(requestPermissionApprovalForOrigin).toHaveBeenCalledWith({
      [RestrictedMethods.eth_accounts]: {
        foo: 'bar',
      },
      [PermissionNames.permittedChains]: {},
    });
  });

  it('requests approval from the ApprovalController for eth_accounts and permittedChains when only permittedChains is specified in params', async () => {
    const { handler, requestPermissionApprovalForOrigin } =
      createMockedHandler();

    await handler({
      ...getBaseRequest(),
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
    });

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

  it('requests approval from the ApprovalController for eth_accounts and permittedChains when both are specified in params', async () => {
    const { handler, requestPermissionApprovalForOrigin } =
      createMockedHandler();

    await handler({
      ...getBaseRequest(),
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
    });

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

  it('requests other permissions in params from the PermissionController, but ignores CAIP-25 if specified', async () => {
    const { handler, requestPermissionsForOrigin } = createMockedHandler();

    await handler({
      ...getBaseRequest(),
      params: [
        {
          [Caip25EndowmentPermissionName]: {},
          otherPermission: {},
        },
      ],
    });
    expect(requestPermissionsForOrigin).toHaveBeenCalledWith({
      otherPermission: {},
    });
  });

  it('requests other permissions in params from the PermissionController, but ignores eth_accounts if specified', async () => {
    const { handler, requestPermissionsForOrigin } = createMockedHandler();

    await handler({
      ...getBaseRequest(),
      params: [
        {
          [RestrictedMethods.eth_accounts]: {},
          otherPermission: {},
        },
      ],
    });
    expect(requestPermissionsForOrigin).toHaveBeenCalledWith({
      otherPermission: {},
    });
  });

  it('requests other permissions in params from the PermissionController, but ignores permittedChains if specified', async () => {
    const { handler, requestPermissionsForOrigin } = createMockedHandler();

    await handler({
      ...getBaseRequest(),
      params: [
        {
          [PermissionNames.permittedChains]: {},
          otherPermission: {},
        },
      ],
    });
    expect(requestPermissionsForOrigin).toHaveBeenCalledWith({
      otherPermission: {},
    });
  });

  it('does not request permissions from the PermissionController when only eth_accounts is provided in params', async () => {
    const { handler, requestPermissionsForOrigin } = createMockedHandler();

    await handler({
      ...getBaseRequest(),
      params: [
        {
          [RestrictedMethods.eth_accounts]: {},
        },
      ],
    });
    expect(requestPermissionsForOrigin).not.toHaveBeenCalled();
  });

  it('does not request permissions from the PermissionController when only permittedChains is provided in params', async () => {
    const { handler, requestPermissionsForOrigin } = createMockedHandler();

    await handler({
      ...getBaseRequest(),
      params: [
        {
          [PermissionNames.permittedChains]: {},
        },
      ],
    });
    expect(requestPermissionsForOrigin).not.toHaveBeenCalled();
  });

  it('does not request permissions from the PermissionController when both eth_accounts and permittedChains are provided in params', async () => {
    const { handler, requestPermissionsForOrigin } = createMockedHandler();

    await handler({
      ...getBaseRequest(),
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
    });
    expect(requestPermissionsForOrigin).not.toHaveBeenCalled();
  });

  it('requests empty permissions from the PermissionController when only CAIP-25 permission is provided in params', async () => {
    const { handler, requestPermissionsForOrigin } = createMockedHandler();

    await handler({
      ...getBaseRequest(),
      params: [
        {
          [Caip25EndowmentPermissionName]: {},
        },
      ],
    });
    expect(requestPermissionsForOrigin).toHaveBeenCalledWith({});
  });

  it('requests empty permissions from the PermissionController when no permissions are provided in params', async () => {
    const { handler, requestPermissionsForOrigin } = createMockedHandler();

    await handler({
      ...getBaseRequest(),
      params: [{}],
    });
    expect(requestPermissionsForOrigin).toHaveBeenCalledWith({});
  });

  it('does not update or grant a CAIP-25 endowment permission if eth_accounts and permittedChains approvals were not requested', async () => {
    const { handler, updateCaveat, grantPermissions, getPermissionsForOrigin } =
      createMockedHandler();

    await handler({
      ...getBaseRequest(),
      params: [
        {
          otherPermission: {},
        },
      ],
    });
    expect(getPermissionsForOrigin).not.toHaveBeenCalled();
    expect(updateCaveat).not.toHaveBeenCalled();
    expect(grantPermissions).not.toHaveBeenCalled();
  });

  it('returns the granted permissions if eth_accounts and permittedChains approvals were not requested', async () => {
    const { handler, response } = createMockedHandler();

    await handler({
      ...getBaseRequest(),
      params: [
        {
          otherPermission: {},
        },
      ],
    });
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
      await handler({
        ...getBaseRequest(),
        params: [
          {
            [RestrictedMethods.eth_accounts]: {},
          },
        ],
      });
    } catch (err) {
      // noop
    }
    expect(getPermissionsForOrigin).not.toHaveBeenCalled();
    expect(updateCaveat).not.toHaveBeenCalled();
    expect(grantPermissions).not.toHaveBeenCalled();
  });

  describe('eth_accounts and permittedChains approvals were accepted', () => {
    it('sets the approved chainIds on an empty CAIP-25 caveat with isMultichainOrigin: false', async () => {
      const { handler } = createMockedHandler();

      await handler(getBaseRequest());
      expect(
        MockPermittedChainsAdapters.setPermittedEthChainIds,
      ).toHaveBeenCalledWith(
        {
          requiredScopes: {},
          optionalScopes: {},
          isMultichainOrigin: false,
        },
        ['0x1', '0x5'],
      );
    });

    it('sets the approved accounts on the CAIP-25 caveat after the approved chainIds', async () => {
      const { handler } = createMockedHandler();
      MockPermittedChainsAdapters.setPermittedEthChainIds.mockReturnValue(
        'caveatValueWithEthChainIdsSet',
      );

      await handler(getBaseRequest());
      expect(MockEthAccountsAdapters.setEthAccounts).toHaveBeenCalledWith(
        'caveatValueWithEthChainIdsSet',
        ['0xdeadbeef'],
      );
    });

    it('gets permission for the origin', async () => {
      const { handler, getPermissionsForOrigin } = createMockedHandler();

      await handler(getBaseRequest());
      expect(getPermissionsForOrigin).toHaveBeenCalledWith('http://test.com');
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
        new Error('cannot modify permission granted from multichain flow'),
      );
    });

    it('updates the caveat when a CAIP-25 already exists that was granted from the legacy flow (isMultichainOrigin: false)', async () => {
      const { handler, updateCaveat } = createMockedHandler();
      MockEthAccountsAdapters.setEthAccounts.mockReturnValue(
        'updatedCaveatValue',
      );

      await handler(getBaseRequest());
      expect(updateCaveat).toHaveBeenCalledWith(
        'http://test.com',
        Caip25EndowmentPermissionName,
        Caip25CaveatType,
        'updatedCaveatValue',
      );
    });

    it('grants a CAIP-25 permission if one does not already exist', async () => {
      const { handler, getPermissionsForOrigin, grantPermissions } =
        createMockedHandler();
      getPermissionsForOrigin.mockReturnValue({});
      MockEthAccountsAdapters.setEthAccounts.mockReturnValue(
        'updatedCaveatValue',
      );

      await handler(getBaseRequest());
      expect(grantPermissions).toHaveBeenCalledWith({
        subject: {
          origin: 'http://test.com',
        },
        approvedPermissions: {
          [Caip25EndowmentPermissionName]: {
            caveats: [
              {
                type: Caip25CaveatType,
                value: 'updatedCaveatValue',
              },
            ],
          },
        },
      });
    });

    it('gets the ordered eth accounts', async () => {
      const { handler, getAccounts } = createMockedHandler();

      await handler(getBaseRequest());
      expect(getAccounts).toHaveBeenCalled();
    });

    it('returns eth_accounts and permittedChains permissions in addition to other permissions that were granted', async () => {
      const { handler, getAccounts, response } = createMockedHandler();
      getAccounts.mockResolvedValue(['0xdeadbeef']);

      await handler(getBaseRequest());
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
  });
});
