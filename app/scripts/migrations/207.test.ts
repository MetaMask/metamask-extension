import migrate, { version } from './207';

const SEI_MAINNET_CHAIN_ID = '0x531';
const OLD_URL = 'https://seitrace.com';
const NEW_URL = 'https://seiscan.io';

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
    expect(
      (state.data.NetworkController as any).networkConfigurationsByChainId[
        SEI_MAINNET_CHAIN_ID
      ].blockExplorerUrls,
    ).toEqual([NEW_URL]);
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
    expect(
      (state.data.NetworkController as any).networkConfigurationsByChainId[
        SEI_MAINNET_CHAIN_ID
      ].blockExplorerUrls,
    ).toEqual(['https://seistream.app']);
    expect(changed.size).toBe(0);
  });
});
