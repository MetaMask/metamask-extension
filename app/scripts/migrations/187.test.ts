import { cloneDeep } from 'lodash';
import { RpcEndpointType } from '@metamask/network-controller';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { migrate, version } from './187';

const VERSION = version;
const oldVersion = VERSION - 1;
const QUICKNODE_MONAD_URL = 'https://example.quicknode.com/monad';
const MONAD_CHAIN_ID = CHAIN_IDS.MONAD;

describe(`migration #${VERSION}`, () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    global.sentry = { captureException: jest.fn() };
  });

  afterEach(() => {
    process.env = originalEnv;
    global.sentry = undefined;
  });

  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {},
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();
    await migrate(versionedData, changedControllers);

    expect(versionedData.meta).toStrictEqual({ version: VERSION });
    expect(changedControllers.has('NetworkController')).toBe(true);
  });

  it('skips migration if NetworkController is missing', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();
    await migrate(versionedData, changedControllers);

    // Version should still be updated
    expect(versionedData.meta).toStrictEqual({ version: VERSION });
    // Data should remain unchanged
    expect(versionedData.data).toStrictEqual(oldStorage.data);
    // NetworkController should not be added to changedControllers
    expect(changedControllers.size).toBe(0);
  });

  it('does nothing if Monad network does not exist in the state', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x1': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://mainnet.infura.io/v3/`,
                },
              ],
            },
          },
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();
    await migrate(versionedData, changedControllers);

    expect(versionedData.data).toStrictEqual(oldStorage.data);
    expect(changedControllers.has('NetworkController')).toBe(true);
  });

  it('does not add failover URL if QUICKNODE_MONAD_URL env variable is not set', async () => {
    process.env.INFURA_PROJECT_ID = 'test-infura-project-id';

    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            [MONAD_CHAIN_ID]: {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://monad-mainnet.infura.io/v3/test-infura-project-id`,
                },
              ],
            },
          },
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();
    await migrate(versionedData, changedControllers);

    // When QUICKNODE_MONAD_URL is not set, no failover URL should be added
    expect(versionedData.data).toStrictEqual(oldStorage.data);
    expect(changedControllers.has('NetworkController')).toBe(true);
  });

  it('does not add failover URL if there is already a failover URL', async () => {
    process.env.QUICKNODE_MONAD_URL = QUICKNODE_MONAD_URL;
    process.env.INFURA_PROJECT_ID = 'test-infura-project-id';

    const existingFailoverUrl = 'https://existing-failover.com';

    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            [MONAD_CHAIN_ID]: {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://monad-mainnet.infura.io/v3/test-infura-project-id`,
                  failoverUrls: [existingFailoverUrl],
                },
              ],
            },
          },
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();
    await migrate(versionedData, changedControllers);

    expect(versionedData.data).toStrictEqual(oldStorage.data);
    expect(changedControllers.has('NetworkController')).toBe(true);
  });

  it('adds QuickNode failover URL to Monad Infura RPC endpoints when no failover URLs exist', async () => {
    process.env.QUICKNODE_MONAD_URL = QUICKNODE_MONAD_URL;
    process.env.INFURA_PROJECT_ID = 'test-infura-project-id';

    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            [MONAD_CHAIN_ID]: {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://monad-mainnet.infura.io/v3/test-infura-project-id`,
                },
                {
                  type: RpcEndpointType.Custom,
                  url: `https://some-monad-rpc.com`,
                },
              ],
            },
            '0x1': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://ethereum-mainnet.infura.io/v3/test-infura-project-id`,
                },
              ],
            },
          },
        },
      },
    };

    const expectedStorage = {
      meta: { version: VERSION },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            [MONAD_CHAIN_ID]: {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://monad-mainnet.infura.io/v3/test-infura-project-id`,
                  failoverUrls: [QUICKNODE_MONAD_URL],
                },
                {
                  type: RpcEndpointType.Custom,
                  url: `https://some-monad-rpc.com`,
                  // Custom endpoint should NOT get failover URL
                },
              ],
            },
            '0x1': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://ethereum-mainnet.infura.io/v3/test-infura-project-id`,
                },
              ],
            },
          },
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();
    await migrate(versionedData, changedControllers);

    expect(versionedData).toStrictEqual(expectedStorage);
    expect(changedControllers.has('NetworkController')).toBe(true);
  });

  it('adds QuickNode failover URL to Monad Infura-like endpoints (custom type with Infura URL pattern)', async () => {
    process.env.QUICKNODE_MONAD_URL = QUICKNODE_MONAD_URL;
    process.env.INFURA_PROJECT_ID = 'test-infura-project-id';

    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            [MONAD_CHAIN_ID]: {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://monad-mainnet.infura.io/v3/test-infura-project-id`,
                },
              ],
            },
          },
        },
      },
    };

    const expectedStorage = {
      meta: { version: VERSION },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            [MONAD_CHAIN_ID]: {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://monad-mainnet.infura.io/v3/test-infura-project-id`,
                  failoverUrls: [QUICKNODE_MONAD_URL],
                },
              ],
            },
          },
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();
    await migrate(versionedData, changedControllers);

    expect(versionedData).toStrictEqual(expectedStorage);
    expect(changedControllers.has('NetworkController')).toBe(true);
  });

  it('does not add QuickNode failover URL to non-Infura Monad endpoints', async () => {
    process.env.QUICKNODE_MONAD_URL = QUICKNODE_MONAD_URL;

    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            [MONAD_CHAIN_ID]: {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://some-monad-rpc.com`,
                },
              ],
            },
          },
        },
      },
    };

    const expectedStorage = {
      meta: { version: VERSION },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            [MONAD_CHAIN_ID]: {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://some-monad-rpc.com`,
                },
              ],
            },
          },
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();
    await migrate(versionedData, changedControllers);

    // Custom non-Infura endpoint should NOT get failover URL
    expect(versionedData).toStrictEqual(expectedStorage);
    expect(changedControllers.has('NetworkController')).toBe(true);
  });
});
