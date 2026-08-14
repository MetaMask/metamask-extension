import migrate, { version } from './207';

const SEI_MAINNET_CHAIN_ID = '0x531';
const OLD_URL = 'https://seitrace.com';
const NEW_URL = 'https://seiscan.io/';

const seiBlockExplorerUrls = (state: { data: Record<string, unknown> }) => {
  const networkController = state.data.NetworkController as {
    networkConfigurationsByChainId: Record<
      string,
      { blockExplorerUrls: string[] }
    >;
  };
  return networkController.networkConfigurationsByChainId[SEI_MAINNET_CHAIN_ID]
    .blockExplorerUrls;
};

describe(`migration #${version}`, () => {
  it('bumps the state version', async () => {
    const state = { meta: { version: version - 1 }, data: {} };
    await migrate(state, new Set());
    expect(state.meta.version).toBe(version);
  });

  it('rewrites seitrace.com to seiscan.io for the Sei Mainnet network configuration', async () => {
    const state = {
      meta: { version: version - 1 },
      data: {
        NetworkController: {
          selectedNetworkClientId: 'x',
          networkConfigurationsByChainId: {
            [SEI_MAINNET_CHAIN_ID]: {
              chainId: SEI_MAINNET_CHAIN_ID,
              name: 'Sei Network',
              nativeCurrency: 'SEI',
              blockExplorerUrls: [OLD_URL],
              defaultBlockExplorerUrlIndex: 0,
              defaultRpcEndpointIndex: 0,
              rpcEndpoints: [
                { networkClientId: 'abc', url: 'https://rpc', type: 'custom' },
              ],
            },
          },
        },
      },
    };
    const changed = new Set<string>();
    await migrate(state, changed);
    expect(seiBlockExplorerUrls(state)).toEqual([NEW_URL]);
    expect(changed.has('NetworkController')).toBe(true);
  });

  it('is a no-op when Sei Mainnet is not configured', async () => {
    const state = {
      meta: { version: version - 1 },
      data: {
        NetworkController: {
          selectedNetworkClientId: 'x',
          networkConfigurationsByChainId: {},
        },
      },
    };
    const before = JSON.parse(JSON.stringify(state));
    const changed = new Set<string>();
    await migrate(state, changed);
    expect(state.data).toEqual(before.data);
    expect(changed.size).toBe(0);
  });

  it('skips silently when NetworkController state is missing (upgrade-from-old-version case)', async () => {
    const state = { meta: { version: version - 1 }, data: {} };
    const changed = new Set<string>();
    await expect(migrate(state, changed)).resolves.toBeUndefined();
    expect(state.meta.version).toBe(version);
    expect(changed.size).toBe(0);
  });

  it('leaves a user-customized block explorer URL untouched', async () => {
    const state = {
      meta: { version: version - 1 },
      data: {
        NetworkController: {
          selectedNetworkClientId: 'x',
          networkConfigurationsByChainId: {
            [SEI_MAINNET_CHAIN_ID]: {
              chainId: SEI_MAINNET_CHAIN_ID,
              name: 'Sei Network',
              nativeCurrency: 'SEI',
              blockExplorerUrls: ['https://seistream.app'],
              defaultBlockExplorerUrlIndex: 0,
              defaultRpcEndpointIndex: 0,
              rpcEndpoints: [
                { networkClientId: 'abc', url: 'https://rpc', type: 'custom' },
              ],
            },
          },
        },
      },
    };
    const changed = new Set<string>();
    await migrate(state, changed);
    expect(seiBlockExplorerUrls(state)).toEqual(['https://seistream.app']);
    expect(changed.size).toBe(0);
  });

  it('does not rewrite lookalike hostnames that merely contain seitrace.com as a substring', async () => {
    const lookalikes = [
      'https://seitrace.com.attacker.example/path',
      'https://evil.com/seitrace.com',
      'https://seitrace.com.evil.com',
    ];
    const state = {
      meta: { version: version - 1 },
      data: {
        NetworkController: {
          selectedNetworkClientId: 'x',
          networkConfigurationsByChainId: {
            [SEI_MAINNET_CHAIN_ID]: {
              chainId: SEI_MAINNET_CHAIN_ID,
              name: 'Sei Network',
              nativeCurrency: 'SEI',
              blockExplorerUrls: [...lookalikes],
              defaultBlockExplorerUrlIndex: 0,
              defaultRpcEndpointIndex: 0,
              rpcEndpoints: [
                { networkClientId: 'abc', url: 'https://rpc', type: 'custom' },
              ],
            },
          },
        },
      },
    };
    const changed = new Set<string>();
    await migrate(state, changed);
    expect(seiBlockExplorerUrls(state)).toEqual(lookalikes);
    expect(changed.size).toBe(0);
  });
});
