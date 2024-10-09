import { migrate, version } from './127';

const oldVersion = 126;

const sentryCaptureExceptionMock = jest.fn();
global.sentry = {
  captureException: sentryCaptureExceptionMock,
};

describe(`migration #${version}`, () => {
  afterEach(() => jest.resetAllMocks());

  it('updates the version metadata', async () => {
    const oldState = {
      meta: { version: oldVersion },
      data: {},
    };

    const newState = await migrate(oldState);
    expect(newState.meta).toStrictEqual({ version });
  });

  it('captures an exception if the network controller state is not defined', async () => {
    const oldState = {
      meta: { version: oldVersion },
      data: {},
    };

    await migrate(oldState);
    expect(sentryCaptureExceptionMock).toHaveBeenCalledTimes(1);
    expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
      new Error(`state.NetworkController is not defined`),
    );
  });

  it('captures an exception if the network controller state is not an object', async () => {
    for (const NetworkController of [undefined, null, 1, 'foo']) {
      const oldState = {
        meta: { version: oldVersion },
        data: { NetworkController },
      };

      await migrate(oldState);
      expect(sentryCaptureExceptionMock).toHaveBeenCalledTimes(1);
      expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
        new Error(
          `typeof state.NetworkController is ${typeof NetworkController}`,
        ),
      );
      sentryCaptureExceptionMock.mockClear();
    }
  });

  it('captures an exception if the transaction controller state is not defined', async () => {
    const oldState = {
      meta: { version: oldVersion },
      data: { NetworkController: {} },
    };

    await migrate(oldState);
    expect(sentryCaptureExceptionMock).toHaveBeenCalledTimes(1);
    expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
      new Error(`state.TransactionController is not defined`),
    );
  });

  it('captures an exception if the transaction controller state is not an object', async () => {
    for (const TransactionController of [undefined, null, 1, 'foo']) {
      const oldState = {
        meta: { version: oldVersion },
        data: { NetworkController: {}, TransactionController },
      };

      await migrate(oldState);
      expect(sentryCaptureExceptionMock).toHaveBeenCalledTimes(1);
      expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
        new Error(
          `typeof state.TransactionController is ${typeof TransactionController}`,
        ),
      );
      sentryCaptureExceptionMock.mockClear();
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
        TransactionController: {},
        NetworkController: {
          selectedNetworkClientId: 'mainnet',
          networkConfigurations: {
            [customNetwork.id]: customNetwork,
          },
        },
      },
    };

    const defaultStateToExpect = defaultPostMigrationState();
    const expectedNetwork = {
      ...defaultStateToExpect.networkConfigurationsByChainId[
        customNetwork.chainId
      ],
    };

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

    const expectedState = {
      ...defaultStateToExpect,
      networkConfigurationsByChainId: {
        ...defaultStateToExpect.networkConfigurationsByChainId,
        [customNetwork.chainId]: expectedNetwork,
      },
    };

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
        TransactionController: {},
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
        TransactionController: {},
        NetworkController: {
          selectedNetworkClientId: customNetwork.id, // make it the selected network
          networkConfigurations: {
            [customNetwork.id]: customNetwork,
          },
        },
      },
    };

    const defaultStateToExpect = defaultPostMigrationState();
    const expectedNetwork = {
      ...defaultStateToExpect.networkConfigurationsByChainId[
        customNetwork.chainId
      ],
    };

    // The custom network should become the default RPC url
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

    const expectedState = {
      ...defaultStateToExpect,
      // The custom network should remain selected
      selectedNetworkClientId: customNetwork.id,
      networkConfigurationsByChainId: {
        ...defaultStateToExpect.networkConfigurationsByChainId,
        [customNetwork.chainId]: expectedNetwork,
      },
    };

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
          selectedNetworkClientId: 'sepolia',
          networkConfigurations: {
            [customNetwork.id]: customNetwork,
          },
        },
      },
    };

    const defaultStateToExpect = defaultPostMigrationState();
    const expectedNetwork = {
      ...defaultStateToExpect.networkConfigurationsByChainId[
        customNetwork.chainId
      ],
    };

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

    const expectedState = {
      ...defaultStateToExpect,
      // Selected network shouldn't change
      selectedNetworkClientId:
        oldState.data.NetworkController.selectedNetworkClientId,
      networkConfigurationsByChainId: {
        ...defaultStateToExpect.networkConfigurationsByChainId,
        [customNetwork.chainId]: expectedNetwork,
      },
    };

    const newState = await migrate(oldState);
    expect(newState.data.NetworkController).toStrictEqual(expectedState);
  });

  it('tie breaks with the custom network that is not built in infura', async () => {
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
        TransactionController: {},
        NetworkController: {
          selectedNetworkClientId: 'sepolia',
          networkConfigurations: {
            [customNetwork.id]: customNetwork,
          },
        },
      },
    };

    const defaultStateToExpect = defaultPostMigrationState();
    const expectedNetwork = {
      ...defaultStateToExpect.networkConfigurationsByChainId[
        customNetwork.chainId
      ],
    };

    // The custom network should become the default RPC url
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

    const expectedState = {
      ...defaultStateToExpect,
      selectedNetworkClientId:
        oldState.data.NetworkController.selectedNetworkClientId,
      networkConfigurationsByChainId: {
        ...defaultStateToExpect.networkConfigurationsByChainId,
        [customNetwork.chainId]: expectedNetwork,
      },
    };

    const newState = await migrate(oldState);
    expect(newState.data.NetworkController).toStrictEqual(expectedState);
  });

  it('dedupes if there are multiple block explorers within a chain id', async () => {
    const randomChainId = '0x123456';

    const oldState = {
      meta: { version: oldVersion },
      data: {
        TransactionController: {},
        NetworkController: {
          selectedNetworkClientId: 'sepolia',
          networkConfigurations: {
            'network-id-1': {
              id: 'network-id-1',
              chainId: randomChainId,
              nickname: 'Random Network',
              ticker: 'FOO',
              rpcUrl: 'https://localhost/rpc/1',
              rpcPrefs: {
                blockExplorerUrl: 'https://localhost/explorer',
              },
            },
            'network-id-2': {
              id: 'network-id-2',
              chainId: randomChainId,
              nickname: 'Random Network',
              ticker: 'FOO',
              rpcUrl: 'https://localhost/rpc/2',
              rpcPrefs: {
                blockExplorerUrl: 'https://localhost/explorer',
              },
            },
          },
        },
      },
    };

    const newState = await migrate(oldState);

    const { networkConfigurationsByChainId } = newState.data
      .NetworkController as {
      networkConfigurationsByChainId: Record<
        string,
        {
          defaultBlockExplorerUrlIndex: number;
          blockExplorerUrls: string[];
        }
      >;
    };

    const networkConfiguration = networkConfigurationsByChainId[randomChainId];
    expect(networkConfiguration.defaultBlockExplorerUrlIndex).toStrictEqual(0);
    expect(networkConfiguration.blockExplorerUrls).toStrictEqual([
      'https://localhost/explorer',
    ]);
  });

  it('dedupes if there are duplicate rpc urls within a chain id, and none are the selected network', async () => {
    for (const [url1, url2] of [
      ['http://test.endpoint/bar', 'http://test.endpoint/bar'],
      // Check case insensitivity (network controller requires this)
      ['http://test.endpoint/bar', 'HTTP://TEST.ENDPOINT/bar'],
    ]) {
      const randomChainId = '0x123456';

      const oldState = {
        meta: { version: oldVersion },
        data: {
          TransactionController: {},
          NetworkController: {
            selectedNetworkClientId: 'sepolia',
            networkConfigurations: {
              'network-id-1': {
                id: 'network-id-1',
                chainId: randomChainId,
                nickname: 'Random Network',
                ticker: 'FOO',
                rpcUrl: url1,
              },
              'network-id-2': {
                id: 'network-id-2',
                chainId: randomChainId,
                nickname: 'Random Network',
                ticker: 'FOO',
                rpcUrl: url2,
              },
            },
          },
        },
      };

      const newState = await migrate(oldState);

      const { networkConfigurationsByChainId } = newState.data
        .NetworkController as {
        networkConfigurationsByChainId: Record<
          string,
          {
            defaultRpcEndpointIndex: number;
            rpcEndpoints: {
              url: string;
              type: string;
              name: string;
              networkClientId: string;
            }[];
          }
        >;
      };

      const networkConfiguration =
        networkConfigurationsByChainId[randomChainId];
      expect(networkConfiguration.defaultRpcEndpointIndex).toStrictEqual(0);

      // The first duplicate encountered should be used to tie break
      // duplicate endpoints, since none were the selected network
      expect(networkConfiguration.rpcEndpoints).toStrictEqual([
        {
          url: url1,
          type: 'custom',
          name: 'Random Network',
          networkClientId: 'network-id-1',
        },
      ]);
    }
  });

  it('dedupes if there are duplicate rpc urls within a chain id, and one is the selected network', async () => {
    for (const [url1, url2] of [
      ['http://test.endpoint/bar', 'http://test.endpoint/bar'],
      // Check case insensitivity (network controller requires this)
      ['http://test.endpoint/bar', 'HTTP://TEST.ENDPOINT/bar'],
    ]) {
      const randomChainId = '0x123456';

      const oldState = {
        meta: { version: oldVersion },
        data: {
          TransactionController: {},
          NetworkController: {
            selectedNetworkClientId: 'network-id-2',
            networkConfigurations: {
              'network-id-1': {
                id: 'network-id-1',
                chainId: randomChainId,
                nickname: 'Random Network',
                ticker: 'FOO',
                rpcUrl: url1,
              },
              // I'm the selected network and should be
              // used to tie break duplicate endpoints
              'network-id-2': {
                id: 'network-id-2',
                chainId: randomChainId,
                nickname: 'Random Network',
                ticker: 'FOO',
                rpcUrl: url2,
              },
            },
          },
        },
      };

      const newState = await migrate(oldState);

      const { networkConfigurationsByChainId } = newState.data
        .NetworkController as {
        networkConfigurationsByChainId: Record<
          string,
          {
            defaultRpcEndpointIndex: number;
            rpcEndpoints: {
              url: string;
              type: string;
              name: string;
              networkClientId: string;
            }[];
          }
        >;
      };

      const networkConfiguration =
        networkConfigurationsByChainId[randomChainId];
      expect(networkConfiguration.defaultRpcEndpointIndex).toStrictEqual(0);
      expect(networkConfiguration.rpcEndpoints).toStrictEqual([
        {
          url: url2,
          type: 'custom',
          name: 'Random Network',
          networkClientId: 'network-id-2',
        },
      ]);
    }
  });

  it('dedupes if there are duplicate rpc urls across chain ids and none are the selected network', async () => {
    const randomChainId1 = '0x123456';
    const randomChainId2 = '0x123456789';

    const oldState = {
      meta: { version: oldVersion },
      data: {
        TransactionController: {},
        NetworkController: {
          selectedNetworkClientId: 'mainnet',
          networkConfigurations: {
            // I'm the first encountered duplicate endpoint and should
            // be used to tie break, since none are the selected network
            'network-id-1': {
              id: 'network-id-1',
              chainId: randomChainId1,
              nickname: 'Random Network',
              ticker: 'FOO',
              rpcUrl: 'http://localhost/rpc',
              rpcPrefs: {
                blockExplorerUrl: 'https://localhost/explorer',
              },
            },
            // I'm the duplicate endpoint that lost the tie break and should be omitted
            'network-id-2': {
              id: 'network-id-2',
              chainId: randomChainId2,
              nickname: 'Random Network',
              ticker: 'FOO',
              rpcUrl: 'http://localhost/rpc',
              rpcPrefs: {
                blockExplorerUrl: 'https://localhost/explorer',
              },
            },
            'network-id-3': {
              id: 'network-id-3',
              chainId: randomChainId2,
              nickname: 'Random Network',
              ticker: 'FOO',
              rpcUrl: 'http://localhost/rpc/different',
              rpcPrefs: {
                blockExplorerUrl: 'https://localhost/explorer',
              },
            },
          },
        },
      },
    };

    const newState = await migrate(oldState);
    const expectedState = defaultPostMigrationState();
    expectedState.networkConfigurationsByChainId[randomChainId1] = {
      chainId: randomChainId1,
      rpcEndpoints: [
        {
          networkClientId: 'network-id-1',
          url: 'http://localhost/rpc',
          type: 'custom',
          name: 'Random Network',
        },
      ],
      defaultRpcEndpointIndex: 0,
      blockExplorerUrls: ['https://localhost/explorer'],
      defaultBlockExplorerUrlIndex: 0,
      name: 'Random Network',
      nativeCurrency: 'FOO',
    };

    expectedState.networkConfigurationsByChainId[randomChainId2] = {
      blockExplorerUrls: ['https://localhost/explorer'],
      defaultBlockExplorerUrlIndex: 0,
      chainId: '0x123456789',
      defaultRpcEndpointIndex: 0,
      name: 'Random Network',
      nativeCurrency: 'FOO',
      rpcEndpoints: [
        {
          name: 'Random Network',
          networkClientId: 'network-id-3',
          type: 'custom',
          url: 'http://localhost/rpc/different',
        },
      ],
    };

    expect(newState.data.NetworkController).toStrictEqual(expectedState);
  });

  it('dedupes if there are duplicate rpc urls across chain ids and one is the selected network', async () => {
    const randomChainId1 = '0x123456';
    const randomChainId2 = '0x123456789';

    const oldState = {
      meta: { version: oldVersion },
      data: {
        TransactionController: {},
        NetworkController: {
          selectedNetworkClientId: 'network-id-2',
          networkConfigurations: {
            // This endpoint is duplicated but not the selected network, and should be omitted
            'network-id-1': {
              id: 'network-id-1',
              chainId: randomChainId1,
              nickname: 'Random Network',
              ticker: 'FOO',
              rpcUrl: 'http://localhost/rpc',
              rpcPrefs: {
                blockExplorerUrl: 'https://localhost/explorer',
              },
            },
            // This is the selected network and should tie break duplicate endpoints
            'network-id-2': {
              id: 'network-id-2',
              chainId: randomChainId2,
              nickname: 'Random Network',
              ticker: 'FOO',
              rpcUrl: 'http://localhost/rpc',
              rpcPrefs: {
                blockExplorerUrl: 'https://localhost/explorer',
              },
            },
            // I'm just an extra unique endpoint that should stay
            'network-id-3': {
              id: 'network-id-3',
              chainId: randomChainId2,
              nickname: 'Random Network',
              ticker: 'FOO',
              rpcUrl: 'http://localhost/rpc/different',
              rpcPrefs: {
                blockExplorerUrl: 'https://localhost/explorer',
              },
            },
          },
        },
      },
    };

    const newState = await migrate(oldState);
    const expectedState = defaultPostMigrationState();
    expectedState.selectedNetworkClientId =
      oldState.data.NetworkController.selectedNetworkClientId;
    expectedState.networkConfigurationsByChainId[randomChainId2] = {
      chainId: randomChainId2,
      rpcEndpoints: [
        {
          networkClientId: 'network-id-2',
          url: 'http://localhost/rpc',
          type: 'custom',
          name: 'Random Network',
        },
        {
          networkClientId: 'network-id-3',
          url: 'http://localhost/rpc/different',
          type: 'custom',
          name: 'Random Network',
        },
      ],
      defaultRpcEndpointIndex: 0,
      blockExplorerUrls: ['https://localhost/explorer'],
      defaultBlockExplorerUrlIndex: 0,
      name: 'Random Network',
      nativeCurrency: 'FOO',
    };

    expect(newState.data.NetworkController).toStrictEqual(expectedState);
  });

  it('handles not well formed rpc urls', async () => {
    const randomChainId = '0x123456';

    const oldState = {
      meta: { version: oldVersion },
      data: {
        TransactionController: {},
        NetworkController: {
          selectedNetworkClientId: 'sepolia',
          networkConfigurations: {
            'network-id-1': {
              id: 'network-id-1',
              chainId: randomChainId,
              nickname: 'Random Network',
              ticker: 'FOO',
              rpcUrl: 'http://test.endpoint/bar',
            },
            // This RPC url is not well formed and should be omitted
            'network-id-2': {
              id: 'network-id-2',
              chainId: randomChainId,
              nickname: 'Random Network',
              ticker: 'FOO',
              rpcUrl: 'not_well_formed',
            },
          },
        },
      },
    };

    const newState = await migrate(oldState);

    const { networkConfigurationsByChainId } = newState.data
      .NetworkController as {
      networkConfigurationsByChainId: Record<
        string,
        {
          defaultRpcEndpointIndex: number;
          rpcEndpoints: {
            url: string;
            type: string;
            name: string;
            networkClientId: string;
          }[];
        }
      >;
    };

    const networkConfiguration = networkConfigurationsByChainId[randomChainId];
    expect(networkConfiguration.defaultRpcEndpointIndex).toStrictEqual(0);
    expect(networkConfiguration.rpcEndpoints).toStrictEqual([
      {
        url: 'http://test.endpoint/bar',
        type: 'custom',
        name: 'Random Network',
        networkClientId: 'network-id-1',
      },
    ]);
  });

  it('handles the case where no rpc url is well formed', async () => {
    const randomChainId = '0x123456';

    const oldState = {
      meta: { version: oldVersion },
      data: {
        TransactionController: {},
        NetworkController: {
          selectedNetworkClientId: 'mainnet',
          networkConfigurations: {
            'network-id-1': {
              id: 'network-id-1',
              chainId: randomChainId,
              nickname: 'Random Network',
              ticker: 'FOO',
              rpcUrl: 'not_well_formed',
            },
            'network-id-2': {
              id: 'network-id-2',
              chainId: randomChainId,
              nickname: 'Random Network',
              ticker: 'FOO',
              rpcUrl: 'also_not_well_formed',
            },
          },
        },
      },
    };

    const newState = await migrate(oldState);

    // `randomChainId` had no well formed urls, so it should be omitted
    expect(newState.data.NetworkController).toStrictEqual(
      defaultPostMigrationState(),
    );
  });

  it('handles the case where selectedNetworkClientId doesnt point to any endpoint', async () => {
    const oldState = {
      meta: { version: oldVersion },
      data: {
        TransactionController: {},
        NetworkController: {
          selectedNetworkClientId: 'dont-point-to-anything',
        },
      },
    };

    const newState = await migrate(oldState);

    // selectedNetworkClientId should fall back to mainnet
    expect(newState.data.NetworkController).toStrictEqual(
      defaultPostMigrationState(),
    );
  });

  it('handles the case where selectedNetworkClientId doesnt point to any endpoint and a custom endpoint is the default', async () => {
    const oldState = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          selectedNetworkClientId: 'dont-point-to-anything',
          networkConfigurations: {
            'custom-mainnet': {
              id: 'custom-mainnet',
              chainId: '0x1',
              nickname: 'Custom Mainnet',
              ticker: 'ETH',
              rpcUrl: 'http://localhost/rpc',
            },
          },
        },
        TransactionController: {
          transactions: [
            {
              chainId: '0x1',
              time: 1,
              networkClientId: 'custom-mainnet',
            },
          ],
        },
      },
    };

    const newState = await migrate(oldState);

    // selectedNetworkClientId should fall back to custom mainnet
    expect(
      (newState.data.NetworkController as { selectedNetworkClientId: string })
        .selectedNetworkClientId,
    ).toStrictEqual('custom-mainnet');
  });

  it('handles the case where selectedNetworkClientId doesnt point to a valid endpoint and theres no fallback', async () => {
    const randomChainId = '0x123456';

    const oldState = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          selectedNetworkClientId: 'invalid-url',
          networkConfigurations:
            // The selected network client has an invaid url
            {
              'invalid-url': {
                id: 'invalid-url',
                chainId: randomChainId,
                nickname: 'Random Chain',
                ticker: 'ETH',
                rpcUrl: 'foobar',
              },
              // And there are no other configurations on the same chain to fall back to
            },
        },
        TransactionController: {},
      },
    };

    const newState = await migrate(oldState);

    // Fall back to mainnet
    expect(
      (newState.data.NetworkController as { selectedNetworkClientId: string })
        .selectedNetworkClientId,
    ).toStrictEqual('mainnet');
  });

  it('handles the case where selectedNetworkClientId doesnt point to a valid endpoint but theres a fallback', async () => {
    const randomChainId = '0x123456';

    const oldState = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          selectedNetworkClientId: 'invalid-url',
          networkConfigurations:
            // The selected network client has an invaid url
            {
              'invalid-url': {
                id: 'invalid-url',
                chainId: randomChainId,
                nickname: 'Random Chain',
                ticker: 'ETH',
                rpcUrl: 'foobar',
              },
              // So it should fall back to me, on the same chain
              'pick-me': {
                id: 'pick-me',
                chainId: randomChainId,
                nickname: 'Random Chain',
                ticker: 'ETH',
                rpcUrl: 'http://localhost/rpc',
              },
            },
        },
        TransactionController: {},
      },
    };

    const newState = await migrate(oldState);

    expect(
      (newState.data.NetworkController as { selectedNetworkClientId: string })
        .selectedNetworkClientId,
    ).toStrictEqual('pick-me');
  });

  it('migrates the netork order controller', async () => {
    const oldState = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {},
        TransactionController: {},
        NetworkOrderController: {
          orderedNetworkList: [
            {
              networkId: '0x1',
              networkRpcUrl: 'http://localhost/a',
            },
            {
              networkId: '0x2',
              networkRpcUrl: 'http://localhost/b',
            },
            {
              networkId: '0x3',
              networkRpcUrl: 'http://localhost/c',
            },
            {
              networkId: '0x2',
              networkRpcUrl: 'http://localhost/d',
            },
            {
              networkId: '0x1',
              networkRpcUrl: 'http://localhost/e',
            },
          ],
        },
      },
    };

    // Expect chain IDs to maintain order, but deduped and with `networkRpcUrl` removed
    const newState = await migrate(oldState);
    expect(newState.data.NetworkOrderController).toStrictEqual({
      orderedNetworkList: [
        { networkId: '0x1' },
        { networkId: '0x2' },
        { networkId: '0x3' },
      ],
    });
  });

  it('sets `preferences.showMultiRpcModal` to false when there are no networks with multiple endpoints', async () => {
    const randomChainId = '0x123456';

    const oldState = {
      meta: { version: oldVersion },
      data: {
        TransactionController: {},
        PreferencesController: { preferences: {} },
        NetworkController: {
          selectedNetworkClientId: 'mainnet',
          networkConfigurations: {
            'network-id-1': {
              id: 'network-id-1',
              chainId: randomChainId,
              nickname: 'Random Network',
              ticker: 'FOO',
              rpcUrl: 'https://localhost/rpc',
            },
          },
        },
      },
    };

    const newState = await migrate(oldState);
    expect(newState.data.PreferencesController).toStrictEqual({
      preferences: { showMultiRpcModal: false },
    });
  });

  it('sets `preferences.showMultiRpcModal` to true when there are networks with multiple endpoints', async () => {
    const randomChainId = '0x123456';

    const oldState = {
      meta: { version: oldVersion },
      data: {
        TransactionController: {},
        PreferencesController: { preferences: {} },
        NetworkController: {
          selectedNetworkClientId: 'mainnet',
          networkConfigurations: {
            'network-id-1': {
              id: 'network-id-1',
              chainId: randomChainId,
              nickname: 'Ethereum Network',
              ticker: 'ETH',
              rpcUrl: 'https://localhost/rpc/1',
            },
            'network-id-2': {
              id: 'network-id-2',
              chainId: randomChainId,
              nickname: 'Random Network',
              ticker: 'FOO',
              rpcUrl: 'https://localhost/rpc/2',
            },
          },
        },
      },
    };

    const newState = await migrate(oldState);
    expect(newState.data.PreferencesController).toStrictEqual({
      preferences: { showMultiRpcModal: true },
    });
  });

  it('updates the selected network controller to remove stale network client ids', async () => {
    const randomChainId = '0x123456';

    const oldState = {
      meta: { version: oldVersion },
      data: {
        TransactionController: {},
        SelectedNetworkController: {
          domains: {
            // I should stay in the selected network controller
            'normal.com': 'normal-network-id',
            // I should be removed, as I never pointed to a network
            'neverexisted.com': 'never-existed-network-id',
          },
        },
        NetworkController: {
          selectedNetworkClientId: 'mainnet',
          networkConfigurations: {
            'normal-network-id': {
              id: 'normal-network-id',
              chainId: randomChainId,
              nickname: 'Normal Network',
              ticker: 'TICK',
              rpcUrl: 'https://localhost/rpc',
            },
          },
        },
      },
    };

    const newState = await migrate(oldState);
    expect(newState.data.SelectedNetworkController).toStrictEqual({
      domains: { 'normal.com': 'normal-network-id' },
    });
  });
});

it('updates the selected network controller to point domains to the default RPC endpoint', async () => {
  const untouchedChainId = '0x123';
  const redirectedChainId = '0x456';

  const oldState = {
    meta: { version: oldVersion },
    data: {
      TransactionController: {},
      SelectedNetworkController: {
        domains: {
          'untouched.com': 'untouched-network-id',
          'already-default.com': 'already-default-network-id',
          'redirected.com': 'redirected-network-id',
          // Test the case where it pointed to a built in
          // network, which would not have been in state before
          'mainnet.com': 'mainnet',
        },
      },
      NetworkController: {
        selectedNetworkClientId: 'already-default-network-id',
        networkConfigurations: {
          'untouched-network-id': {
            id: 'untouched-network-id',
            chainId: untouchedChainId,
            nickname: 'Untouched Network',
            ticker: 'TICK',
            rpcUrl: 'https://localhost/rpc/1',
          },
          'already-default-network-id': {
            id: 'already-default-network-id',
            chainId: redirectedChainId,
            nickname: 'Default Network',
            ticker: 'TICK',
            rpcUrl: 'https://localhost/rpc/2',
          },
          'redirected-network-id': {
            id: 'redirected-network-id',
            chainId: redirectedChainId,
            nickname: 'Redirected Network',
            ticker: 'TICK',
            rpcUrl: 'https://localhost/rpc/3',
          },
        },
      },
    },
  };

  const newState = await migrate(oldState);
  expect(newState.data.SelectedNetworkController).toStrictEqual({
    domains: {
      'untouched.com': 'untouched-network-id',
      'already-default.com': 'already-default-network-id',
      'redirected.com': 'already-default-network-id',
      'mainnet.com': 'mainnet',
    },
  });
});

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
