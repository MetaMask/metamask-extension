import { cloneDeep } from 'lodash';
import { RpcEndpointType } from '@metamask/network-controller';

const mockUnitTestInfuraIdInitialValue = 'unitTestInfuraId';
let mockUnitTestInfuraId: string | undefined = mockUnitTestInfuraIdInitialValue;

jest.mock('../../../shared/constants/network', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  ...jest.requireActual('../../../shared/constants/network'),
  get infuraProjectId() {
    return mockUnitTestInfuraId;
  },
}));

// eslint-disable-next-line import-x/first
import {
  migrate,
  version,
  BSC_CHAIN_ID,
  ZKSYNC_ERA_CHAIN_ID,
  MEGAETH_CHAIN_ID,
  TEMPO_CHAIN_ID,
} from './222';

const VERSION = version;
const oldVersion = VERSION - 1;

const QUICKNODE_BSC_URL = 'https://failover.example/bsc';
const QUICKNODE_ZKSYNC_URL = 'https://failover.example/zksync';
const QUICKNODE_MEGAETH_URL = 'https://failover.example/megaeth';
const QUICKNODE_TEMPO_URL = 'https://failover.example/tempo';

const BSC_INFURA_URL = `https://bsc-mainnet.infura.io/v3/${mockUnitTestInfuraIdInitialValue}`;
const ZKSYNC_INFURA_URL = `https://zksync-mainnet.infura.io/v3/${mockUnitTestInfuraIdInitialValue}`;
const MEGAETH_INFURA_URL = `https://megaeth-mainnet.infura.io/v3/${mockUnitTestInfuraIdInitialValue}`;
const TEMPO_DEFAULT_URL = 'https://rpc.tempo.xyz/';

function infuraNetworkConfiguration(
  chainId: string,
  url: string,
  failoverUrls: string[] = [],
) {
  return {
    chainId,
    name: `Network ${chainId}`,
    nativeCurrency: 'ETH',
    blockExplorerUrls: ['https://explorer.example'],
    defaultRpcEndpointIndex: 0,
    defaultBlockExplorerUrlIndex: 0,
    rpcEndpoints: [
      {
        networkClientId: `client-${chainId}`,
        type: RpcEndpointType.Custom,
        url,
        failoverUrls,
      },
    ],
  };
}

function baseStorage(networkConfigurationsByChainId: Record<string, unknown>) {
  return {
    meta: { version: oldVersion },
    data: {
      NetworkController: {
        selectedNetworkClientId: 'client-1',
        networkConfigurationsByChainId,
      },
    },
  };
}

describe(`migration #${VERSION}`, () => {
  let originalEnv: NodeJS.ProcessEnv;
  let mockedCaptureException: jest.Mock;

  beforeEach(() => {
    originalEnv = { ...process.env };
    process.env.QUICKNODE_BSC_URL = QUICKNODE_BSC_URL;
    process.env.QUICKNODE_ZKSYNC_URL = QUICKNODE_ZKSYNC_URL;
    process.env.QUICKNODE_MEGAETH_URL = QUICKNODE_MEGAETH_URL;
    process.env.QUICKNODE_TEMPO_URL = QUICKNODE_TEMPO_URL;
    mockedCaptureException = jest.fn();
    global.sentry = { captureException: mockedCaptureException };
    mockUnitTestInfuraId = mockUnitTestInfuraIdInitialValue;
  });

  afterEach(() => {
    process.env = originalEnv;
    global.sentry = undefined;
  });

  it('updates the version metadata', async () => {
    const oldStorage = baseStorage({});
    const versionedData = cloneDeep(oldStorage);
    await migrate(versionedData, new Set());
    expect(versionedData.meta).toStrictEqual({ version: VERSION });
  });

  it('skips migration and does not mark controller changed if NetworkController is missing', async () => {
    const oldStorage = { meta: { version: oldVersion }, data: {} };
    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();
    await migrate(versionedData, changedControllers);

    expect(versionedData.meta).toStrictEqual({ version: VERSION });
    expect(versionedData.data).toStrictEqual(oldStorage.data);
    expect(changedControllers.size).toBe(0);
  });

  it('does nothing if none of the 4 networks exist', async () => {
    const oldStorage = baseStorage({
      '0x1': infuraNetworkConfiguration(
        '0x1',
        `https://mainnet.infura.io/v3/${mockUnitTestInfuraIdInitialValue}`,
      ),
    });
    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();
    await migrate(versionedData, changedControllers);

    expect(versionedData.data).toStrictEqual(oldStorage.data);
    expect(changedControllers.has('NetworkController')).toBe(false);
  });

  it('does not add failover URL when the QuickNode env var is not set', async () => {
    delete process.env.QUICKNODE_BSC_URL;

    const oldStorage = baseStorage({
      [BSC_CHAIN_ID]: infuraNetworkConfiguration(BSC_CHAIN_ID, BSC_INFURA_URL),
    });
    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();
    await migrate(versionedData, changedControllers);

    expect(versionedData.data).toStrictEqual(oldStorage.data);
    expect(changedControllers.has('NetworkController')).toBe(false);
  });

  it('does not overwrite an existing failover URL', async () => {
    const existing = 'https://existing-failover.example';
    const oldStorage = baseStorage({
      [BSC_CHAIN_ID]: infuraNetworkConfiguration(BSC_CHAIN_ID, BSC_INFURA_URL, [
        existing,
      ]),
    });
    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();
    await migrate(versionedData, changedControllers);

    expect(versionedData.data).toStrictEqual(oldStorage.data);
    expect(changedControllers.has('NetworkController')).toBe(false);
  });

  it('adds the QuickNode failover to BSC, ZKsync Era and MegaETH Infura endpoints', async () => {
    const oldStorage = baseStorage({
      [BSC_CHAIN_ID]: infuraNetworkConfiguration(BSC_CHAIN_ID, BSC_INFURA_URL),
      [ZKSYNC_ERA_CHAIN_ID]: infuraNetworkConfiguration(
        ZKSYNC_ERA_CHAIN_ID,
        ZKSYNC_INFURA_URL,
      ),
      [MEGAETH_CHAIN_ID]: infuraNetworkConfiguration(
        MEGAETH_CHAIN_ID,
        MEGAETH_INFURA_URL,
      ),
    });
    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();
    await migrate(versionedData, changedControllers);

    const configs = (
      versionedData.data.NetworkController as {
        networkConfigurationsByChainId: Record<string, { rpcEndpoints: { failoverUrls: string[] }[] }>;
      }
    ).networkConfigurationsByChainId;

    expect(configs[BSC_CHAIN_ID].rpcEndpoints[0].failoverUrls).toStrictEqual([
      QUICKNODE_BSC_URL,
    ]);
    expect(
      configs[ZKSYNC_ERA_CHAIN_ID].rpcEndpoints[0].failoverUrls,
    ).toStrictEqual([QUICKNODE_ZKSYNC_URL]);
    expect(configs[MEGAETH_CHAIN_ID].rpcEndpoints[0].failoverUrls).toStrictEqual(
      [QUICKNODE_MEGAETH_URL],
    );
    expect(changedControllers.has('NetworkController')).toBe(true);
  });

  it('does not add failover to a non-Infura endpoint for the Infura networks', async () => {
    const oldStorage = baseStorage({
      [BSC_CHAIN_ID]: infuraNetworkConfiguration(
        BSC_CHAIN_ID,
        'https://my-own-bsc-rpc.example',
      ),
    });
    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();
    await migrate(versionedData, changedControllers);

    expect(versionedData.data).toStrictEqual(oldStorage.data);
    expect(changedControllers.has('NetworkController')).toBe(false);
  });

  it('adds the QuickNode failover to the Tempo default (rpc.tempo.xyz) endpoint', async () => {
    const oldStorage = baseStorage({
      [TEMPO_CHAIN_ID]: infuraNetworkConfiguration(
        TEMPO_CHAIN_ID,
        TEMPO_DEFAULT_URL,
      ),
    });
    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();
    await migrate(versionedData, changedControllers);

    const config = (
      versionedData.data.NetworkController as {
        networkConfigurationsByChainId: Record<string, { rpcEndpoints: { failoverUrls: string[] }[] }>;
      }
    ).networkConfigurationsByChainId[TEMPO_CHAIN_ID];

    expect(config.rpcEndpoints[0].failoverUrls).toStrictEqual([
      QUICKNODE_TEMPO_URL,
    ]);
    expect(changedControllers.has('NetworkController')).toBe(true);
  });

  it('does not add the Tempo failover to a non-default Tempo RPC endpoint', async () => {
    const oldStorage = baseStorage({
      [TEMPO_CHAIN_ID]: infuraNetworkConfiguration(
        TEMPO_CHAIN_ID,
        'https://my-own-tempo-rpc.example',
      ),
    });
    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();
    await migrate(versionedData, changedControllers);

    expect(versionedData.data).toStrictEqual(oldStorage.data);
    expect(changedControllers.has('NetworkController')).toBe(false);
  });
});
