import migrate, { version } from './231';

const ROBINHOOD_CHAIN_ID = '0x1237';
const OLD_URL = 'https://robinhoodchain.blockscout.com';
const NEW_URL = 'https://robin.etherscan.io/';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

function buildState(blockExplorerUrls: string[]): VersionedData {
  return {
    meta: { version: version - 1 },
    data: {
      NetworkController: {
        selectedNetworkClientId: 'robinhood-mainnet',
        networkConfigurationsByChainId: {
          [ROBINHOOD_CHAIN_ID]: {
            chainId: ROBINHOOD_CHAIN_ID,
            name: 'Robinhood Chain',
            nativeCurrency: 'ETH',
            blockExplorerUrls,
            defaultBlockExplorerUrlIndex: 1,
            defaultRpcEndpointIndex: 0,
            rpcEndpoints: [
              {
                networkClientId: 'robinhood-mainnet',
                url: 'https://robinhood-mainnet.infura.io/v3/test',
                type: 'custom',
              },
            ],
          },
        },
      },
    },
  };
}

function getRobinhoodConfiguration(state: VersionedData) {
  const networkController = state.data.NetworkController as {
    networkConfigurationsByChainId: Record<
      string,
      { blockExplorerUrls: string[]; defaultBlockExplorerUrlIndex: number }
    >;
  };
  return networkController.networkConfigurationsByChainId[ROBINHOOD_CHAIN_ID];
}

describe(`migration #${version}`, () => {
  it('bumps the state version', async () => {
    const state: VersionedData = {
      meta: { version: version - 1 },
      data: {},
    };

    await migrate(state, new Set());

    expect(state.meta.version).toBe(version);
  });

  it('replaces deprecated Robinhood explorer URLs and preserves their indexes', async () => {
    const customUrl = 'https://custom-explorer.example';
    const state = buildState([`${OLD_URL}/`, OLD_URL, customUrl]);
    const changedControllers = new Set<string>();

    await migrate(state, changedControllers);

    expect(getRobinhoodConfiguration(state)).toMatchObject({
      blockExplorerUrls: [NEW_URL, NEW_URL, customUrl],
      defaultBlockExplorerUrlIndex: 1,
    });
    expect(changedControllers).toStrictEqual(new Set(['NetworkController']));
  });

  it('leaves custom and lookalike explorer URLs unchanged', async () => {
    const urls = [
      'https://custom-explorer.example',
      'https://robinhoodchain.blockscout.com.attacker.example',
    ];
    const state = buildState(urls);
    const changedControllers = new Set<string>();

    await migrate(state, changedControllers);

    expect(getRobinhoodConfiguration(state).blockExplorerUrls).toStrictEqual(
      urls,
    );
    expect(changedControllers).toStrictEqual(new Set());
  });

  it('is a no-op when Robinhood Chain is not configured', async () => {
    const state: VersionedData = {
      meta: { version: version - 1 },
      data: {
        NetworkController: {
          selectedNetworkClientId: 'mainnet',
          networkConfigurationsByChainId: {},
        },
      },
    };
    const changedControllers = new Set<string>();

    await migrate(state, changedControllers);

    expect(state.data).toStrictEqual({
      NetworkController: {
        selectedNetworkClientId: 'mainnet',
        networkConfigurationsByChainId: {},
      },
    });
    expect(changedControllers).toStrictEqual(new Set());
  });
});
