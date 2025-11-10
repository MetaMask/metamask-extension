import { RpcEndpointType } from '@metamask/network-controller';
import { migrate, version } from './183';
import { CHAIN_IDS } from '../../../shared/constants/network';

const VERSION = version;
const oldVersion = VERSION - 1;
const INFURA_PROJECT_ID = 'test-infura-project-id';
const QUICKNODE_SEI_URL = 'https://example.quicknode.com/sei';
const SEI_CHAIN_ID = CHAIN_IDS.SEI;

describe(`migration #${VERSION}`, () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = process.env;
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

    const newStorage = await migrate(oldStorage);

    expect(newStorage.meta).toStrictEqual({ version: VERSION });
  });

  it('logs a warning and returns the original state if NetworkController is missing', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };

    const mockWarn = jest.spyOn(console, 'warn').mockImplementation(jest.fn());

    const newStorage = await migrate(oldStorage);

    expect(mockWarn).toHaveBeenCalledWith(
      `Migration ${VERSION}: NetworkController not found.`,
    );
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('does nothing if Sei network does not exist', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x1': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
                },
              ],
            },
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('adds QuickNode failover URL to Sei Infura endpoint without failover URLs', async () => {
    process.env.INFURA_PROJECT_ID = INFURA_PROJECT_ID;
    process.env.QUICKNODE_SEI_URL = QUICKNODE_SEI_URL;

    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            [SEI_CHAIN_ID]: {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://sei-mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
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
            [SEI_CHAIN_ID]: {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://sei-mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
                  failoverUrls: [QUICKNODE_SEI_URL],
                },
              ],
            },
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage).toStrictEqual(expectedStorage);
  });

  it('adds QuickNode failover URL to Sei Infura endpoint with empty failover URLs array', async () => {
    process.env.INFURA_PROJECT_ID = INFURA_PROJECT_ID;
    process.env.QUICKNODE_SEI_URL = QUICKNODE_SEI_URL;

    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            [SEI_CHAIN_ID]: {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://sei-mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
                  failoverUrls: [],
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
            [SEI_CHAIN_ID]: {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://sei-mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
                  failoverUrls: [QUICKNODE_SEI_URL],
                },
              ],
            },
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage).toStrictEqual(expectedStorage);
  });

  it('does not update Sei endpoint that already has failover URLs', async () => {
    process.env.INFURA_PROJECT_ID = INFURA_PROJECT_ID;
    process.env.QUICKNODE_SEI_URL = QUICKNODE_SEI_URL;

    const existingFailoverUrl = 'https://existing-failover.com';

    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            [SEI_CHAIN_ID]: {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://sei-mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
                  failoverUrls: [existingFailoverUrl],
                },
              ],
            },
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('does not add failover URL when QUICKNODE_SEI_URL env variable is not set', async () => {
    process.env.INFURA_PROJECT_ID = INFURA_PROJECT_ID;
    delete process.env.QUICKNODE_SEI_URL;

    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            [SEI_CHAIN_ID]: {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://sei-mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
                },
              ],
            },
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    // When QUICKNODE_SEI_URL is not set, no failover URL should be added
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('does not update non-Sei endpoints', async () => {
    process.env.INFURA_PROJECT_ID = INFURA_PROJECT_ID;
    process.env.QUICKNODE_SEI_URL = QUICKNODE_SEI_URL;

    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x1': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
                },
              ],
            },
            [SEI_CHAIN_ID]: {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://sei-mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
                },
              ],
            },
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    // Mainnet endpoint should remain unchanged
    expect(
      newStorage.data.NetworkController.networkConfigurationsByChainId['0x1']
        .rpcEndpoints[0],
    ).not.toHaveProperty('failoverUrls');

    // Sei endpoint should have failover URL added
    expect(
      newStorage.data.NetworkController.networkConfigurationsByChainId[
        SEI_CHAIN_ID
      ].rpcEndpoints[0].failoverUrls,
    ).toEqual([QUICKNODE_SEI_URL]);
  });

  it('handles Sei network with multiple RPC endpoints', async () => {
    process.env.INFURA_PROJECT_ID = INFURA_PROJECT_ID;
    process.env.QUICKNODE_SEI_URL = QUICKNODE_SEI_URL;

    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            [SEI_CHAIN_ID]: {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://sei-mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
                },
                {
                  type: RpcEndpointType.Custom,
                  url: 'https://custom-rpc.sei.com',
                  failoverUrls: ['https://existing-failover.com'],
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
            [SEI_CHAIN_ID]: {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://sei-mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
                  failoverUrls: [QUICKNODE_SEI_URL],
                },
                {
                  type: RpcEndpointType.Custom,
                  url: 'https://custom-rpc.sei.com',
                  failoverUrls: ['https://existing-failover.com'],
                },
              ],
            },
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage).toStrictEqual(expectedStorage);
  });
});
