const mockInfuraIdValue = 'unitTestInfuraId';
let mockInfuraId: string | undefined = mockInfuraIdValue;

jest.mock('../../../shared/constants/network', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  ...jest.requireActual('../../../shared/constants/network'),
  get infuraProjectId() {
    return mockInfuraId;
  },
}));

// eslint-disable-next-line import/first
import { migrate, version, FEATURED_INFURA_NETWORKS } from './199';

const VERSION = version;
const OLD_VERSION = VERSION - 1;

function makeState(networkConfigurationsByChainId: Record<string, unknown>) {
  return {
    meta: { version: OLD_VERSION },
    data: {
      NetworkController: {
        networkConfigurationsByChainId,
        selectedNetworkClientId: 'mainnet',
      },
    },
  };
}

function makeNetworkConfig(
  chainId: string,
  rpcEndpoints: {
    url: string;
    networkClientId?: string;
    type?: string;
    failoverUrls?: string[];
  }[],
  defaultRpcEndpointIndex = 0,
) {
  return {
    chainId,
    name: 'Test Network',
    nativeCurrency: 'ETH',
    blockExplorerUrls: ['https://explorer.example.com'],
    defaultBlockExplorerUrlIndex: 0,
    defaultRpcEndpointIndex,
    rpcEndpoints: rpcEndpoints.map((ep) => ({
      networkClientId: ep.networkClientId ?? 'client-1',
      type: ep.type ?? 'custom',
      url: ep.url,
      failoverUrls: ep.failoverUrls ?? [],
    })),
  };
}

describe(`migration #${VERSION}`, () => {
  let originalEnv: NodeJS.ProcessEnv;
  let mockedCaptureException: jest.Mock;

  beforeEach(() => {
    originalEnv = { ...process.env };
    process.env.QUICKNODE_POLYGON_URL = 'https://quicknode-polygon.example.com';
    process.env.QUICKNODE_ARBITRUM_URL =
      'https://quicknode-arbitrum.example.com';
    mockedCaptureException = jest.fn();
    global.sentry = { captureException: mockedCaptureException };
    mockInfuraId = mockInfuraIdValue;
  });

  afterEach(() => {
    process.env = originalEnv;
    global.sentry = undefined;
  });

  it('updates the version metadata', async () => {
    const state = makeState({});
    const changed = new Set<string>();
    await migrate(state, changed);
    expect(state.meta.version).toBe(VERSION);
  });

  it('does nothing when NetworkController is missing', async () => {
    const state = { meta: { version: OLD_VERSION }, data: {} };
    const changed = new Set<string>();
    await migrate(state, changed);
    expect(changed.size).toBe(0);
    expect(mockedCaptureException).toHaveBeenCalled();
  });

  it('does nothing when no featured networks are present', async () => {
    const state = makeState({});
    const changed = new Set<string>();
    await migrate(state, changed);
    expect(changed.has('NetworkController')).toBe(false);
  });

  it('injects Infura endpoint for a featured network missing it', async () => {
    const polygonChainId = '0x89';
    const state = makeState({
      [polygonChainId]: makeNetworkConfig(polygonChainId, [
        { url: 'https://custom-polygon-rpc.example.com' },
      ]),
    });

    const changed = new Set<string>();
    await migrate(state, changed);

    const config = (
      state.data.NetworkController as {
        networkConfigurationsByChainId: Record<
          string,
          {
            rpcEndpoints: { url: string; failoverUrls: string[] }[];
            defaultRpcEndpointIndex: number;
          }
        >;
      }
    ).networkConfigurationsByChainId[polygonChainId];

    expect(config.rpcEndpoints).toHaveLength(2);
    expect(config.rpcEndpoints[0].url).toBe(
      `https://polygon-mainnet.infura.io/v3/${mockInfuraIdValue}`,
    );
    expect(config.rpcEndpoints[0].failoverUrls).toEqual([
      'https://quicknode-polygon.example.com',
    ]);
    expect(config.rpcEndpoints[1].url).toBe(
      'https://custom-polygon-rpc.example.com',
    );
    // User's default shifts from 0 to 1
    expect(config.defaultRpcEndpointIndex).toBe(1);
    expect(changed.has('NetworkController')).toBe(true);
  });

  it('does not duplicate Infura endpoint if already present', async () => {
    const polygonChainId = '0x89';
    const infuraUrl = `https://polygon-mainnet.infura.io/v3/${mockInfuraIdValue}`;
    const state = makeState({
      [polygonChainId]: makeNetworkConfig(polygonChainId, [{ url: infuraUrl }]),
    });

    const changed = new Set<string>();
    await migrate(state, changed);

    const config = (
      state.data.NetworkController as {
        networkConfigurationsByChainId: Record<
          string,
          { rpcEndpoints: { url: string }[] }
        >;
      }
    ).networkConfigurationsByChainId[polygonChainId];

    expect(config.rpcEndpoints).toHaveLength(1);
    expect(changed.has('NetworkController')).toBe(false);
  });

  it('does not duplicate when Infura URL exists with trailing slash', async () => {
    const arbitrumChainId = '0xa4b1';
    const state = makeState({
      [arbitrumChainId]: makeNetworkConfig(arbitrumChainId, [
        { url: 'https://arbitrum-mainnet.infura.io/' },
      ]),
    });

    const changed = new Set<string>();
    await migrate(state, changed);

    const config = (
      state.data.NetworkController as {
        networkConfigurationsByChainId: Record<
          string,
          { rpcEndpoints: { url: string }[] }
        >;
      }
    ).networkConfigurationsByChainId[arbitrumChainId];

    expect(config.rpcEndpoints).toHaveLength(1);
    expect(changed.has('NetworkController')).toBe(false);
  });

  it('does not duplicate when Infura URL exists without trailing slash', async () => {
    const arbitrumChainId = '0xa4b1';
    const state = makeState({
      [arbitrumChainId]: makeNetworkConfig(arbitrumChainId, [
        { url: 'https://arbitrum-mainnet.infura.io' },
      ]),
    });

    const changed = new Set<string>();
    await migrate(state, changed);

    const config = (
      state.data.NetworkController as {
        networkConfigurationsByChainId: Record<
          string,
          { rpcEndpoints: { url: string }[] }
        >;
      }
    ).networkConfigurationsByChainId[arbitrumChainId];

    expect(config.rpcEndpoints).toHaveLength(1);
    expect(changed.has('NetworkController')).toBe(false);
  });

  it('shifts defaultRpcEndpointIndex when Infura is prepended', async () => {
    const arbitrumChainId = '0xa4b1';
    const state = makeState({
      [arbitrumChainId]: makeNetworkConfig(
        arbitrumChainId,
        [
          { url: 'https://rpc1.example.com' },
          { url: 'https://rpc2.example.com' },
        ],
        1,
      ),
    });

    const changed = new Set<string>();
    await migrate(state, changed);

    const config = (
      state.data.NetworkController as {
        networkConfigurationsByChainId: Record<
          string,
          { rpcEndpoints: { url: string }[]; defaultRpcEndpointIndex: number }
        >;
      }
    ).networkConfigurationsByChainId[arbitrumChainId];

    expect(config.rpcEndpoints).toHaveLength(3);
    expect(config.rpcEndpoints[0].url).toBe(
      `https://arbitrum-mainnet.infura.io/v3/${mockInfuraIdValue}`,
    );
    // Default was 1, shifted to 2 after prepend
    expect(config.defaultRpcEndpointIndex).toBe(2);
    expect(changed.has('NetworkController')).toBe(true);
  });

  it('injects Infura for multiple featured networks at once', async () => {
    const state = makeState({
      '0x89': makeNetworkConfig('0x89', [
        { url: 'https://custom-polygon.example.com' },
      ]),
      '0xa4b1': makeNetworkConfig('0xa4b1', [
        { url: 'https://custom-arbitrum.example.com' },
      ]),
    });

    const changed = new Set<string>();
    await migrate(state, changed);

    const configs = (
      state.data.NetworkController as {
        networkConfigurationsByChainId: Record<
          string,
          { rpcEndpoints: { url: string }[] }
        >;
      }
    ).networkConfigurationsByChainId;

    expect(configs['0x89'].rpcEndpoints).toHaveLength(2);
    expect(configs['0xa4b1'].rpcEndpoints).toHaveLength(2);
    expect(changed.has('NetworkController')).toBe(true);
  });

  it('skips migration when Infura project ID is not set', async () => {
    mockInfuraId = undefined;
    const polygonChainId = '0x89';
    const state = makeState({
      [polygonChainId]: makeNetworkConfig(polygonChainId, [
        { url: 'https://custom-polygon-rpc.example.com' },
      ]),
    });

    const changed = new Set<string>();
    await migrate(state, changed);

    const config = (
      state.data.NetworkController as {
        networkConfigurationsByChainId: Record<
          string,
          { rpcEndpoints: { url: string }[] }
        >;
      }
    ).networkConfigurationsByChainId[polygonChainId];

    expect(config.rpcEndpoints).toHaveLength(1);
    expect(changed.has('NetworkController')).toBe(false);
    expect(mockedCaptureException).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('Infura project ID is not set'),
      }),
    );
  });

  it('skips non-featured networks', async () => {
    const customChainId = '0x999';
    const state = makeState({
      [customChainId]: makeNetworkConfig(customChainId, [
        { url: 'https://custom-rpc.example.com' },
      ]),
    });

    const changed = new Set<string>();
    await migrate(state, changed);

    const config = (
      state.data.NetworkController as {
        networkConfigurationsByChainId: Record<
          string,
          { rpcEndpoints: { url: string }[] }
        >;
      }
    ).networkConfigurationsByChainId[customChainId];

    expect(config.rpcEndpoints).toHaveLength(1);
    expect(changed.has('NetworkController')).toBe(false);
  });

  it('adds failover URL when QuickNode env var is set', async () => {
    const polygonChainId = '0x89';
    const state = makeState({
      [polygonChainId]: makeNetworkConfig(polygonChainId, [
        { url: 'https://custom-polygon-rpc.example.com' },
      ]),
    });

    const changed = new Set<string>();
    await migrate(state, changed);

    const config = (
      state.data.NetworkController as {
        networkConfigurationsByChainId: Record<
          string,
          { rpcEndpoints: { url: string; failoverUrls: string[] }[] }
        >;
      }
    ).networkConfigurationsByChainId[polygonChainId];

    expect(config.rpcEndpoints[0].failoverUrls).toEqual([
      'https://quicknode-polygon.example.com',
    ]);
  });

  it('adds empty failover when QuickNode env var is not set', async () => {
    delete process.env.QUICKNODE_POLYGON_URL;
    const polygonChainId = '0x89';
    const state = makeState({
      [polygonChainId]: makeNetworkConfig(polygonChainId, [
        { url: 'https://custom-polygon-rpc.example.com' },
      ]),
    });

    const changed = new Set<string>();
    await migrate(state, changed);

    const config = (
      state.data.NetworkController as {
        networkConfigurationsByChainId: Record<
          string,
          { rpcEndpoints: { url: string; failoverUrls: string[] }[] }
        >;
      }
    ).networkConfigurationsByChainId[polygonChainId];

    expect(config.rpcEndpoints[0].failoverUrls).toEqual([]);
  });

  it('covers all featured networks in FEATURED_INFURA_NETWORKS', () => {
    const expectedChainIds = [
      '0xe708', // Linea
      '0xa4b1', // Arbitrum
      '0xa86a', // Avalanche
      '0x38', // BSC
      '0xa', // Optimism
      '0x89', // Polygon
      '0x531', // SEI
      '0x8f', // Monad
      '0x2105', // Base
      '0x10e6', // MegaETH
    ];
    expect(Object.keys(FEATURED_INFURA_NETWORKS).sort()).toEqual(
      expectedChainIds.sort(),
    );
  });
});
