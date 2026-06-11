import { CHAIN_IDS, infuraProjectId } from '../../../shared/constants/network';
import migrate, { version } from './213';

const ZKSYNC_CHAIN_ID = CHAIN_IDS.ZKSYNC_ERA;
const ZKSYNC_LEGACY_URL = 'https://mainnet.era.zksync.io';
const ZKSYNC_INFURA_URL = `https://zksync-mainnet.infura.io/v3/${infuraProjectId}`;

const zksyncEndpoints = (state: { data: Record<string, unknown> }) => {
  const networkController = state.data.NetworkController as {
    networkConfigurationsByChainId: Record<
      string,
      { rpcEndpoints: { url: string; type: string }[] }
    >;
  };
  return networkController.networkConfigurationsByChainId[ZKSYNC_CHAIN_ID]
    .rpcEndpoints;
};

const buildState = (
  configsByChainId: Record<string, unknown>,
): { meta: { version: number }; data: Record<string, unknown> } => ({
  meta: { version: version - 1 },
  data: {
    NetworkController: {
      selectedNetworkClientId: 'x',
      networkConfigurationsByChainId: configsByChainId,
    },
  },
});

const infuraDefault = (url: string) => ({
  rpcEndpoints: [{ url, type: 'infura' }],
  defaultRpcEndpointIndex: 0,
});

const customDefault = (url: string) => ({
  rpcEndpoints: [{ url, type: 'custom' }],
  defaultRpcEndpointIndex: 0,
});

describe(`migration #${version}`, () => {
  it('bumps the state version', async () => {
    const state = { meta: { version: version - 1 }, data: {} };
    await migrate(state, new Set());
    expect(state.meta.version).toBe(version);
  });

  it('skips silently when NetworkController state is missing', async () => {
    const state = { meta: { version: version - 1 }, data: {} };
    const changed = new Set<string>();
    await expect(migrate(state, changed)).resolves.toBeUndefined();
    expect(state.meta.version).toBe(version);
    expect(changed.size).toBe(0);
  });

  it('is a no-op when no Infura RPC endpoints are used elsewhere', async () => {
    const state = buildState({
      '0x1': customDefault('https://custom.rpc'),
    });
    const before = JSON.parse(JSON.stringify(state.data));
    const changed = new Set<string>();
    await migrate(state, changed);
    expect(state.data).toEqual(before);
    expect(changed.size).toBe(0);
  });

  it('is a no-op when zkSync Era is not configured', async () => {
    const state = buildState({
      '0x1': infuraDefault(`https://mainnet.infura.io/v3/${infuraProjectId}`),
    });
    const before = JSON.parse(JSON.stringify(state.data));
    const changed = new Set<string>();
    await migrate(state, changed);
    expect(state.data).toEqual(before);
    expect(changed.size).toBe(0);
  });

  it('rewrites the zkSync default URL when the user relies on Infura elsewhere', async () => {
    const state = buildState({
      [ZKSYNC_CHAIN_ID]: customDefault(ZKSYNC_LEGACY_URL),
      '0x1': infuraDefault(`https://mainnet.infura.io/v3/${infuraProjectId}`),
    });
    const changed = new Set<string>();
    await migrate(state, changed);
    expect(zksyncEndpoints(state)[0].url).toEqual(ZKSYNC_INFURA_URL);
    expect(changed.has('NetworkController')).toBe(true);
  });

  it('leaves a user-customised zkSync URL untouched', async () => {
    const state = buildState({
      [ZKSYNC_CHAIN_ID]: customDefault('https://other.rpc'),
      '0x1': infuraDefault(`https://mainnet.infura.io/v3/${infuraProjectId}`),
    });
    const changed = new Set<string>();
    await migrate(state, changed);
    expect(zksyncEndpoints(state)[0].url).toEqual('https://other.rpc');
    expect(changed.size).toBe(0);
  });

  it('keeps defaultRpcEndpointIndex unchanged when rewriting', async () => {
    const state = buildState({
      [ZKSYNC_CHAIN_ID]: customDefault(ZKSYNC_LEGACY_URL),
      '0x1': infuraDefault(`https://mainnet.infura.io/v3/${infuraProjectId}`),
    });
    await migrate(state, new Set());
    const networkController = state.data.NetworkController as {
      networkConfigurationsByChainId: Record<
        string,
        { defaultRpcEndpointIndex: number }
      >;
    };
    expect(
      networkController.networkConfigurationsByChainId[ZKSYNC_CHAIN_ID]
        .defaultRpcEndpointIndex,
    ).toBe(0);
  });

  it('is a no-op when Linea Mainnet is the only Infura network', async () => {
    const state = buildState({
      [ZKSYNC_CHAIN_ID]: customDefault(ZKSYNC_LEGACY_URL),
      '0x1': customDefault('https://custom.rpc'),
      '0xe708': infuraDefault(
        `https://linea-mainnet.infura.io/v3/${infuraProjectId}`,
      ),
    });
    const changed = new Set<string>();
    await migrate(state, changed);
    expect(zksyncEndpoints(state)[0].url).toEqual(ZKSYNC_LEGACY_URL);
    expect(changed.size).toBe(0);
  });

  it('preserves other endpoints when rewriting the zkSync default URL', async () => {
    const state = buildState({
      [ZKSYNC_CHAIN_ID]: {
        rpcEndpoints: [
          { url: ZKSYNC_LEGACY_URL, type: 'custom' },
          { url: 'https://user.custom.zksync.rpc', type: 'custom' },
        ],
        defaultRpcEndpointIndex: 0,
      },
      '0x1': infuraDefault(`https://mainnet.infura.io/v3/${infuraProjectId}`),
    });
    const changed = new Set<string>();
    await migrate(state, changed);
    const endpoints = zksyncEndpoints(state);
    expect(endpoints).toHaveLength(2);
    expect(endpoints[0].url).toEqual(ZKSYNC_INFURA_URL);
    expect(endpoints[1].url).toEqual('https://user.custom.zksync.rpc');
    expect(changed.has('NetworkController')).toBe(true);
  });

  it('is a no-op when zkSync is at the legacy URL but no Infura elsewhere', async () => {
    const state = buildState({
      [ZKSYNC_CHAIN_ID]: customDefault(ZKSYNC_LEGACY_URL),
      '0x1': customDefault('https://custom.rpc'),
    });
    const changed = new Set<string>();
    await migrate(state, changed);
    expect(zksyncEndpoints(state)[0].url).toEqual(ZKSYNC_LEGACY_URL);
    expect(changed.size).toBe(0);
  });

  it('is a no-op when Sepolia is the only Infura network (testnets are excluded)', async () => {
    const state = buildState({
      [ZKSYNC_CHAIN_ID]: customDefault(ZKSYNC_LEGACY_URL),
      '0x1': customDefault('https://custom.rpc'),
      '0xaa36a7': infuraDefault(
        `https://sepolia.infura.io/v3/${infuraProjectId}`,
      ),
    });
    const changed = new Set<string>();
    await migrate(state, changed);
    expect(zksyncEndpoints(state)[0].url).toEqual(ZKSYNC_LEGACY_URL);
    expect(changed.size).toBe(0);
  });

  it('is a no-op when zkSync own Infura is the only Infura (self should not satisfy the gate)', async () => {
    const state = buildState({
      [ZKSYNC_CHAIN_ID]: {
        rpcEndpoints: [
          { url: ZKSYNC_LEGACY_URL, type: 'custom' },
          {
            url: `https://zksync-mainnet.infura.io/v3/${infuraProjectId}`,
            type: 'infura',
          },
        ],
        defaultRpcEndpointIndex: 1,
      },
      '0x1': customDefault('https://my-alchemy-key.alchemy.com'),
    });
    const changed = new Set<string>();
    await migrate(state, changed);
    expect(zksyncEndpoints(state)[0].url).toEqual(ZKSYNC_LEGACY_URL);
    expect(changed.size).toBe(0);
  });

  it('preserves non-url fields on the rewritten endpoint', async () => {
    const state = buildState({
      [ZKSYNC_CHAIN_ID]: {
        rpcEndpoints: [
          {
            url: ZKSYNC_LEGACY_URL,
            type: 'custom',
            name: 'zkSync Era',
            networkClientId: 'zksync-era-client',
            failoverUrls: ['https://failover.zksync.rpc'],
          },
        ],
        defaultRpcEndpointIndex: 0,
      },
      '0x1': infuraDefault(`https://mainnet.infura.io/v3/${infuraProjectId}`),
    });
    const changed = new Set<string>();
    await migrate(state, changed);
    expect(zksyncEndpoints(state)[0]).toStrictEqual({
      url: ZKSYNC_INFURA_URL,
      type: 'custom',
      name: 'zkSync Era',
      networkClientId: 'zksync-era-client',
      failoverUrls: ['https://failover.zksync.rpc'],
    });
    expect(changed.has('NetworkController')).toBe(true);
  });
});
