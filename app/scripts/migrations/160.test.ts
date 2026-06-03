import { SnapEndowments } from '@metamask/snaps-rpc-methods';
import { METAMASK_DOMAIN } from '@metamask/selected-network-controller';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from '@metamask/chain-agnostic-permission';
import { migrate, version } from './160';

const oldVersion = 159;

const MOCK_ORIGIN = 'http://example.com';
const MOCK_SNAP_ID = 'npm:foo-snap';

jest.useFakeTimers();
jest.setSystemTime(1723635247705);

describe(`migration #${version}`, () => {
  afterEach(() => jest.resetAllMocks());

  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.meta).toStrictEqual({ version });
  });

  it('adds the network endowment to Snaps with the `endowment:ethereum-provider` permission', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          selectedNetworkClientId: 'linea-sepolia',
          networkConfigurationsByChainId: {
            '0x1': {
              rpcEndpoints: [
                {
                  networkClient: 'mainnet',
                },
              ],
            },
            '0xe705': {
              rpcEndpoints: [
                {
                  networkClient: 'linea-sepolia',
                },
              ],
            },
          },
        },

        PermissionController: {
          subjects: {
            [MOCK_SNAP_ID]: {
              permissions: {
                [SnapEndowments.EthereumProvider]: {
                  caveats: [],
                  date: 1664187844588,
                  id: 'izn0WGUO8cvq_jqvLQuQP',
                  invoker: MOCK_ORIGIN,
                  parentCapability: SnapEndowments.EthereumProvider,
                },
              },
            },
          },
        },

        SelectedNetworkController: {
          domains: {
            [METAMASK_DOMAIN]: 'mainnet',
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data.PermissionController).toStrictEqual({
      subjects: {
        [MOCK_SNAP_ID]: {
          permissions: {
            [SnapEndowments.EthereumProvider]: {
              caveats: [],
              date: 1664187844588,
              id: 'izn0WGUO8cvq_jqvLQuQP',
              invoker: MOCK_ORIGIN,
              parentCapability: SnapEndowments.EthereumProvider,
            },
            [Caip25EndowmentPermissionName]: {
              caveats: [
                {
                  type: Caip25CaveatType,
                  value: {
                    isMultichainOrigin: false,
                    optionalScopes: {
                      'eip155:59141': {
                        accounts: [],
                      },
                    },
                    requiredScopes: {},
                    sessionProperties: {},
                  },
                },
              ],
              date: 1723635247705,
              id: expect.any(String),
              invoker: MOCK_SNAP_ID,
              parentCapability: Caip25EndowmentPermissionName,
            },
          },
        },
      },
    });

    expect(newStorage.data.SelectedNetworkController).toStrictEqual({
      domains: {
        [METAMASK_DOMAIN]: 'mainnet',
        [MOCK_SNAP_ID]: 'linea-sepolia',
      },
    });
  });

  it('merges with an existing permission if the Snap already has `endowment:caip25`', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          selectedNetworkClientId: 'mainnet',
          networkConfigurationsByChainId: {
            '0x1': {
              rpcEndpoints: [
                {
                  networkClient: 'mainnet',
                },
              ],
            },
            '0xe705': {
              rpcEndpoints: [
                {
                  networkClient: 'linea-sepolia',
                },
              ],
            },
          },
        },

        PermissionController: {
          subjects: {
            [MOCK_SNAP_ID]: {
              permissions: {
                [SnapEndowments.EthereumProvider]: {
                  caveats: [],
                  date: 1664187844588,
                  id: 'izn0WGUO8cvq_jqvLQuQP',
                  invoker: MOCK_ORIGIN,
                  parentCapability: SnapEndowments.EthereumProvider,
                },
                [Caip25EndowmentPermissionName]: {
                  caveats: [
                    {
                      type: Caip25CaveatType,
                      value: {
                        isMultichainOrigin: false,
                        optionalScopes: {
                          'wallet:eip155': {
                            accounts: [
                              '0x1234567890123456789012345678901234567890',
                            ],
                          },
                        },
                        requiredScopes: {},
                        sessionProperties: {},
                      },
                    },
                  ],
                  date: 1723635247705,
                  id: 'izn0WGUO8cvq_jqvLQuQP',
                  invoker: MOCK_SNAP_ID,
                  parentCapability: Caip25EndowmentPermissionName,
                },
              },
            },
          },
        },

        SelectedNetworkController: {
          domains: {
            [METAMASK_DOMAIN]: 'mainnet',
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data.PermissionController).toStrictEqual({
      subjects: {
        [MOCK_SNAP_ID]: {
          permissions: {
            [SnapEndowments.EthereumProvider]: {
              caveats: [],
              date: 1664187844588,
              id: 'izn0WGUO8cvq_jqvLQuQP',
              invoker: MOCK_ORIGIN,
              parentCapability: SnapEndowments.EthereumProvider,
            },
            [Caip25EndowmentPermissionName]: {
              caveats: [
                {
                  type: Caip25CaveatType,
                  value: {
                    isMultichainOrigin: false,
                    optionalScopes: {
                      'wallet:eip155': {
                        accounts: [
                          '0x1234567890123456789012345678901234567890',
                        ],
                      },
                      'eip155:1': {
                        accounts: [],
                      },
                    },
                    requiredScopes: {},
                    sessionProperties: {},
                  },
                },
              ],
              date: 1723635247705,
              id: 'izn0WGUO8cvq_jqvLQuQP',
              invoker: MOCK_SNAP_ID,
              parentCapability: Caip25EndowmentPermissionName,
            },
          },
        },
      },
    });

    expect(newStorage.data.SelectedNetworkController).toStrictEqual({
      domains: {
        [METAMASK_DOMAIN]: 'mainnet',
        [MOCK_SNAP_ID]: 'mainnet',
      },
    });
  });

  it(`does not modify Snaps that don't have the \`endowment:ethereum-provider\` permission`, async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          selectedNetworkClientId: 'mainnet',
          networkConfigurationsByChainId: {
            '0x1': {
              rpcEndpoints: [
                {
                  networkClient: 'mainnet',
                },
              ],
            },
            '0xe705': {
              rpcEndpoints: [
                {
                  networkClient: 'linea-sepolia',
                },
              ],
            },
          },
        },

        PermissionController: {
          subjects: {
            [MOCK_SNAP_ID]: {
              permissions: {
                [SnapEndowments.HomePage]: {
                  caveats: [],
                  date: 1664187844588,
                  id: 'izn0WGUO8cvq_jqvLQuQP',
                  invoker: MOCK_ORIGIN,
                  parentCapability: SnapEndowments.HomePage,
                },
              },
            },
          },
        },

        SelectedNetworkController: {
          domains: {
            [METAMASK_DOMAIN]: 'mainnet',
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data.NetworkController).toStrictEqual(
      oldStorage.data.NetworkController,
    );
    expect(newStorage.data.PermissionController).toStrictEqual(
      oldStorage.data.PermissionController,
    );
    expect(newStorage.data.SelectedNetworkController).toStrictEqual(
      oldStorage.data.SelectedNetworkController,
    );
  });
});
