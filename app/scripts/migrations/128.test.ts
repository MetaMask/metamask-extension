import { migrate, version } from './128';

const oldVersion = 127;

describe(`migration #${version}`, () => {
  it('updates the version metadata', async () => {
    const oldState = {
      meta: { version: oldVersion },
      data: {},
    };

    const newState = await migrate(oldState);
    expect(newState.meta).toStrictEqual({ version });
  });

  it("initializes the network state if it's not defined for some unexpected reason", async () => {
    for (const NetworkController of [undefined, null, {}]) {
      const oldState = {
        meta: { version: oldVersion },
        data: { NetworkController },
      };

      const newState = await migrate(oldState);
      expect(newState.data.NetworkController).toStrictEqual(
        defaultPostMigrationState(),
      );
    }
  });

  it('migrates a custom network on a built-in chain', async () => {
    const customNetwork = {
      id: 'network-configuration-id',
      chainId: '0x1',
      nickname: 'My Local Node',
      ticker: 'ETH',
      rpcUrl: 'https://localhost/rpc',
      rpcPrefs: {
        blockExplorerUrl: 'https://localhost/explorer',
      },
    };

    const oldState = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          selectedNetworkClientId: 'mainnet',
          networkConfigurations: {
            [customNetwork.id]: customNetwork,
          },
        },
      },
    };

    const expectedState = defaultPostMigrationState();
    const expectedNetwork =
      expectedState.networkConfigurationsByChainId[customNetwork.chainId];

    // The custom network's rpc url should be added to the existing network
    expectedNetwork.rpcEndpoints.push({
      networkClientId: customNetwork.id,
      name: customNetwork.nickname,
      url: customNetwork.rpcUrl,
      type: 'custom',
    });

    // The custom network's block explorer should be added to the existing network
    expectedNetwork.blockExplorerUrls.push(
      customNetwork.rpcPrefs.blockExplorerUrl,
    );

    const newState = await migrate(oldState);
    expect(newState.data.NetworkController).toStrictEqual(expectedState);
  });

  it('migrates a custom network on a not built-in chain', async () => {
    const customNetwork = {
      id: 'network-configuration-id',
      chainId: '0x123456789',
      nickname: 'My Random Network',
      ticker: 'FOO',
      rpcUrl: 'https://localhost/rpc',
      rpcPrefs: {
        blockExplorerUrl: 'https://localhost/explorer',
      },
    };

    const oldState = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          selectedNetworkClientId: 'mainnet',
          networkConfigurations: {
            [customNetwork.id]: customNetwork,
          },
        },
      },
    };

    const expectedState = defaultPostMigrationState();

    // A new network should be added
    expectedState.networkConfigurationsByChainId[customNetwork.chainId] = {
      chainId: customNetwork.chainId,
      name: customNetwork.nickname,
      nativeCurrency: customNetwork.ticker,
      rpcEndpoints: [
        {
          name: customNetwork.nickname,
          networkClientId: customNetwork.id,
          url: customNetwork.rpcUrl,
          type: 'custom',
        },
      ],
      defaultRpcEndpointIndex: 0,
      blockExplorerUrls: [customNetwork.rpcPrefs.blockExplorerUrl],
      defaultBlockExplorerUrlIndex: 0,
    };

    const newState = await migrate(oldState);
    expect(newState.data.NetworkController).toStrictEqual(expectedState);
  });
});

it('tie breaks with the globally selected network', async () => {
  const customNetwork = {
    id: 'network-configuration-id',
    chainId: '0x1',
    nickname: 'My Local Node',
    ticker: 'FOO',
    rpcUrl: 'https://localhost/rpc',
    rpcPrefs: {
      blockExplorerUrl: 'https://localhost/explorer',
    },
  };

  const oldState = {
    meta: { version: oldVersion },
    data: {
      NetworkController: {
        selectedNetworkClientId: customNetwork.id, // make it the selected network
        networkConfigurations: {
          [customNetwork.id]: customNetwork,
        },
      },
    },
  };

  const expectedState = defaultPostMigrationState();
  const expectedNetwork =
    expectedState.networkConfigurationsByChainId[customNetwork.chainId];

  // The custom network should remain selected, and become the default RPC url
  expectedState.selectedNetworkClientId = customNetwork.id;
  expectedNetwork.defaultRpcEndpointIndex =
    expectedNetwork.rpcEndpoints.push({
      networkClientId: customNetwork.id,
      name: customNetwork.nickname,
      url: customNetwork.rpcUrl,
      type: 'custom',
    }) - 1;

  // The custom network's block explorer should be added to
  // the existing network, and it should become the default.
  expectedNetwork.defaultBlockExplorerUrlIndex =
    expectedNetwork.blockExplorerUrls.push(
      customNetwork.rpcPrefs.blockExplorerUrl,
    ) - 1;

  const newState = await migrate(oldState);
  expect(newState.data.NetworkController).toStrictEqual(expectedState);
});

it('tie breaks with the most recently transacted network', async () => {
  const customNetwork = {
    id: 'network-configuration-id',
    chainId: '0x1',
    nickname: 'My Local Node',
    ticker: 'FOO',
    rpcUrl: 'https://localhost/rpc',
    rpcPrefs: {
      blockExplorerUrl: 'https://localhost/explorer',
    },
  };

  const oldState = {
    meta: { version: oldVersion },
    data: {
      TransactionController: {
        transactions: [
          {
            chainId: customNetwork.chainId,
            time: 1,
            networkClientId: 'mainnet',
          },
          {
            chainId: customNetwork.chainId,
            time: 2,
            networkClientId: customNetwork.id,
          },
        ],
      },
      NetworkController: {
        selectedNetworkClientId: 'other-chain-network-client',
        networkConfigurations: {
          [customNetwork.id]: customNetwork,
        },
      },
    },
  };

  // Selected network shouldn't change
  const expectedState = defaultPostMigrationState();
  expectedState.selectedNetworkClientId =
    oldState.data.NetworkController.selectedNetworkClientId;

  const expectedNetwork =
    expectedState.networkConfigurationsByChainId[customNetwork.chainId];

  // The custom network's rpc url should be added to the
  // existing network, and become the default RPC url
  expectedNetwork.defaultRpcEndpointIndex =
    expectedNetwork.rpcEndpoints.push({
      networkClientId: customNetwork.id,
      name: customNetwork.nickname,
      url: customNetwork.rpcUrl,
      type: 'custom',
    }) - 1;

  // The custom network's block explorer should be added to
  // the existing network, and it should become the default.
  expectedNetwork.defaultBlockExplorerUrlIndex =
    expectedNetwork.blockExplorerUrls.push(
      customNetwork.rpcPrefs.blockExplorerUrl,
    ) - 1;

  const newState = await migrate(oldState);
  expect(newState.data.NetworkController).toStrictEqual(expectedState);
});

// TODO: more tests
// - dedupe logic for rpc/block explorers
// - NetworkOrderController migration

// The state of the network controller post migration for just the
// built-in networks. As if there were no custom networks defined.
function defaultPostMigrationState() {
  const state = {
    selectedNetworkClientId: 'mainnet',
    networksMetadata: {},
    networkConfigurationsByChainId: {
      '0x1': {
        chainId: '0x1',
        rpcEndpoints: [
          {
            networkClientId: 'mainnet',
            url: 'https://mainnet.infura.io/v3/{infuraProjectId}',
            type: 'infura',
          },
        ],
        defaultRpcEndpointIndex: 0,
        blockExplorerUrls: ['https://etherscan.io'],
        defaultBlockExplorerUrlIndex: 0,
        name: 'Ethereum Mainnet',
        nativeCurrency: 'ETH',
      },
      '0xaa36a7': {
        chainId: '0xaa36a7',
        rpcEndpoints: [
          {
            networkClientId: 'sepolia',
            url: 'https://sepolia.infura.io/v3/{infuraProjectId}',
            type: 'infura',
          },
        ],
        defaultRpcEndpointIndex: 0,
        blockExplorerUrls: ['https://sepolia.etherscan.io'],
        defaultBlockExplorerUrlIndex: 0,
        name: 'Sepolia',
        nativeCurrency: 'SepoliaETH',
      },
      '0xe705': {
        chainId: '0xe705',
        rpcEndpoints: [
          {
            networkClientId: 'linea-sepolia',
            url: 'https://linea-sepolia.infura.io/v3/{infuraProjectId}',
            type: 'infura',
          },
        ],
        defaultRpcEndpointIndex: 0,
        blockExplorerUrls: ['https://sepolia.lineascan.build'],
        defaultBlockExplorerUrlIndex: 0,
        name: 'Linea Sepolia',
        nativeCurrency: 'LineaETH',
      },
      '0xe708': {
        chainId: '0xe708',
        rpcEndpoints: [
          {
            networkClientId: 'linea-mainnet',
            url: 'https://linea-mainnet.infura.io/v3/{infuraProjectId}',
            type: 'infura',
          },
        ],
        defaultRpcEndpointIndex: 0,
        blockExplorerUrls: ['https://lineascan.build'],
        defaultBlockExplorerUrlIndex: 0,
        name: 'Linea Mainnet',
        nativeCurrency: 'ETH',
      },
    },
  };

  // Expand types to include optional fields that
  // aren't defined on the above built-in networks
  type Networks = typeof state.networkConfigurationsByChainId;
  type Network = Networks[keyof Networks];
  return state as typeof state & {
    networkConfigurationsByChainId: {
      [key: string]: Network & {
        rpcEndpoints: (Network['rpcEndpoints'][number] & { name?: string })[];
      };
    };
  };
}
