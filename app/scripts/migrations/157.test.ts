import { RpcEndpointType } from '@metamask/network-controller';
import { migrate } from './157';

const VERSION = 157;

const INFURA_PROJECT_ID = 'some-infura-project-id';
const QUICKNODE_MAINNET_URL = 'https://example.quicknode.com/mainnet';
const QUICKNODE_LINEA_MAINNET_URL =
  'https://example.quicknode.com/linea-mainnet';
const QUICKNODE_ARBITRUM_URL = 'https://example.quicknode.com/arbitrum';
const QUICKNODE_AVALANCHE_URL = 'https://example.quicknode.com/avalanche';
const QUICKNODE_OPTIMISM_URL = 'https://example.quicknode.com/optimism';
const QUICKNODE_POLYGON_URL = 'https://example.quicknode.com/polygon';
const QUICKNODE_BASE_URL = 'https://example.quicknode.com/base';

describe(`migration #${VERSION}`, () => {
  let originalEnv: NodeJS.ProcessEnv;
  let captureExceptionMock: jest.SpyInstance<void, [unknown]>;
  let previousSentry: unknown;

  beforeEach(() => {
    originalEnv = { ...process.env };
    captureExceptionMock = jest.fn();
    previousSentry = global.sentry;
    global.sentry = { captureException: captureExceptionMock };
  });

  afterEach(() => {
    for (const key of new Set([
      ...Object.keys(originalEnv),
      ...Object.keys(process.env),
    ])) {
      if (originalEnv[key]) {
        process.env[key] = originalEnv[key];
      } else {
        delete process.env[key];
      }
    }
    global.sentry = previousSentry;
  });

  it('logs an error and returns a new version of the data unchanged if INFURA_PROJECT_ID is not set', async () => {
    const oldVersionedData = {
      meta: { version: VERSION - 1 },
      data: {},
    };
    const expectedVersionData = {
      meta: { version: VERSION },
      data: oldVersionedData.data,
    };

    const newVersionedData = await migrate(oldVersionedData);

    expect(newVersionedData).toStrictEqual(expectedVersionData);
    expect(captureExceptionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Migration #157: No INFURA_PROJECT_ID set!',
      }),
    );
  });

  it('logs an error and returns a new version of the data unchanged if NetworkController is missing', async () => {
    process.env.INFURA_PROJECT_ID = INFURA_PROJECT_ID;
    const oldVersionedData = {
      meta: { version: VERSION - 1 },
      data: {},
    };
    const expectedVersionData = {
      meta: { version: VERSION },
      data: oldVersionedData.data,
    };

    const newVersionedData = await migrate(oldVersionedData);

    expect(newVersionedData).toStrictEqual(expectedVersionData);
    expect(captureExceptionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Migration #157: Missing NetworkController state',
      }),
    );
  });

  it('logs an error and returns a new version of the data unchanged if NetworkController is not an object', async () => {
    process.env.INFURA_PROJECT_ID = INFURA_PROJECT_ID;
    const oldVersionedData = {
      meta: { version: VERSION - 1 },
      data: {
        NetworkController: 'not-an-object',
      },
    };
    const expectedVersionData = {
      meta: { version: VERSION },
      data: oldVersionedData.data,
    };

    const newVersionedData = await migrate(oldVersionedData);

    expect(newVersionedData).toStrictEqual(expectedVersionData);
    expect(captureExceptionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message:
          'Migration #157: Expected state.NetworkController to be an object, but is string',
      }),
    );
  });

  it('logs an error and returns a new version of the data unchanged if NetworkController.networkConfigurationsByChainId is missing', async () => {
    process.env.INFURA_PROJECT_ID = INFURA_PROJECT_ID;
    const oldVersionedData = {
      meta: { version: VERSION - 1 },
      data: {
        NetworkController: {},
      },
    };
    const expectedVersionData = {
      meta: { version: VERSION },
      data: oldVersionedData.data,
    };

    const newVersionedData = await migrate(oldVersionedData);

    expect(newVersionedData).toStrictEqual(expectedVersionData);
    expect(captureExceptionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message:
          'Migration #157: Missing state.NetworkController.networkConfigurationsByChainId',
      }),
    );
  });

  it('logs an error and returns a new version of the data unchanged if NetworkController.networkConfigurationsByChainId is not an object', async () => {
    process.env.INFURA_PROJECT_ID = INFURA_PROJECT_ID;
    const oldVersionedData = {
      meta: { version: VERSION - 1 },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: 'not-an-object',
        },
      },
    };
    const expectedVersionData = {
      meta: { version: VERSION },
      data: oldVersionedData.data,
    };

    const newVersionedData = await migrate(oldVersionedData);

    expect(newVersionedData).toStrictEqual(expectedVersionData);
    expect(captureExceptionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message:
          'Migration #157: Expected state.NetworkController.networkConfigurationsByChainId to be an object, but is string',
      }),
    );
  });

  it('returns a new version of the data unchanged if NetworkController.networkConfigurationsByChainId is empty', async () => {
    process.env.INFURA_PROJECT_ID = INFURA_PROJECT_ID;
    const oldVersionedData = {
      meta: { version: VERSION - 1 },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {},
        },
      },
    };
    const expectedVersionData = {
      meta: { version: VERSION },
      data: oldVersionedData.data,
    };

    const newVersionedData = await migrate(oldVersionedData);

    expect(newVersionedData).toStrictEqual(expectedVersionData);
  });

  it('does not update any network configurations that are not objects', async () => {
    process.env.INFURA_PROJECT_ID = INFURA_PROJECT_ID;
    process.env.QUICKNODE_LINEA_MAINNET_URL = QUICKNODE_LINEA_MAINNET_URL;
    const oldVersionedData = {
      meta: { version: VERSION - 1 },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x1': 'not-an-object',
            '0xe708': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://linea-mainnet.infura.io/v3/{infuraProjectId}`,
                },
              ],
            },
          },
        },
      },
    };
    const expectedVersionedData = {
      meta: { version: VERSION },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x1': 'not-an-object',
            '0xe708': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://linea-mainnet.infura.io/v3/{infuraProjectId}`,
                  failoverUrls: [QUICKNODE_LINEA_MAINNET_URL],
                },
              ],
            },
          },
        },
      },
    };

    const newVersionedData = await migrate(oldVersionedData);

    expect(newVersionedData).toStrictEqual(expectedVersionedData);
  });

  it('does not update any network configurations that do not have rpcEndpoints', async () => {
    process.env.INFURA_PROJECT_ID = INFURA_PROJECT_ID;
    process.env.QUICKNODE_LINEA_MAINNET_URL = QUICKNODE_LINEA_MAINNET_URL;
    const oldVersionedData = {
      meta: { version: VERSION - 1 },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x1': {},
            '0xe708': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://linea-mainnet.infura.io/v3/{infuraProjectId}`,
                },
              ],
            },
          },
        },
      },
    };
    const expectedVersionedData = {
      meta: { version: VERSION },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x1': {},
            '0xe708': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://linea-mainnet.infura.io/v3/{infuraProjectId}`,
                  failoverUrls: [QUICKNODE_LINEA_MAINNET_URL],
                },
              ],
            },
          },
        },
      },
    };

    const newVersionedData = await migrate(oldVersionedData);

    expect(newVersionedData).toStrictEqual(expectedVersionedData);
  });

  it('does not assign failover URLs to custom RPC endpoints that use non-Infura URLs', async () => {
    process.env.INFURA_PROJECT_ID = INFURA_PROJECT_ID;
    process.env.QUICKNODE_LINEA_MAINNET_URL = QUICKNODE_LINEA_MAINNET_URL;
    const oldVersionedData = {
      meta: { version: VERSION - 1 },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x539': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: 'https://foo.com',
                },
              ],
            },
            '0xe708': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://linea-mainnet.infura.io/v3/{infuraProjectId}`,
                },
              ],
            },
          },
        },
      },
    };
    const expectedVersionedData = {
      meta: { version: VERSION },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x539': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: 'https://foo.com',
                },
              ],
            },
            '0xe708': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://linea-mainnet.infura.io/v3/{infuraProjectId}`,
                  failoverUrls: [QUICKNODE_LINEA_MAINNET_URL],
                },
              ],
            },
          },
        },
      },
    };

    const newVersionedData = await migrate(oldVersionedData);

    expect(newVersionedData).toStrictEqual(expectedVersionedData);
  });

  it('does not assign failover URLs to custom RPC endpoints that contain an Infura URL but do not use our API key', async () => {
    process.env.INFURA_PROJECT_ID = INFURA_PROJECT_ID;
    process.env.QUICKNODE_LINEA_MAINNET_URL = QUICKNODE_LINEA_MAINNET_URL;
    const oldVersionedData = {
      meta: { version: VERSION - 1 },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x1': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: 'https://mainnet.infura.io/v3/some-other-api-key',
                },
              ],
            },
            '0xe708': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://linea-mainnet.infura.io/v3/{infuraProjectId}`,
                },
              ],
            },
          },
        },
      },
    };
    const expectedVersionedData = {
      meta: { version: VERSION },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x1': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: 'https://mainnet.infura.io/v3/some-other-api-key',
                },
              ],
            },
            '0xe708': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://linea-mainnet.infura.io/v3/{infuraProjectId}`,
                  failoverUrls: [QUICKNODE_LINEA_MAINNET_URL],
                },
              ],
            },
          },
        },
      },
    };

    const newVersionedData = await migrate(oldVersionedData);

    expect(newVersionedData).toStrictEqual(expectedVersionedData);
  });

  it('assigns failover URLs to known Infura RPC endpoints', async () => {
    process.env.INFURA_PROJECT_ID = INFURA_PROJECT_ID;
    process.env.QUICKNODE_MAINNET_URL = QUICKNODE_MAINNET_URL;
    process.env.QUICKNODE_LINEA_MAINNET_URL = QUICKNODE_LINEA_MAINNET_URL;
    process.env.QUICKNODE_ARBITRUM_URL = QUICKNODE_ARBITRUM_URL;
    process.env.QUICKNODE_AVALANCHE_URL = QUICKNODE_AVALANCHE_URL;
    process.env.QUICKNODE_OPTIMISM_URL = QUICKNODE_OPTIMISM_URL;
    process.env.QUICKNODE_POLYGON_URL = QUICKNODE_POLYGON_URL;
    process.env.QUICKNODE_BASE_URL = QUICKNODE_BASE_URL;
    const oldVersionedData = {
      meta: { version: VERSION - 1 },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x1': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://mainnet.infura.io/v3/{infuraProjectId}`,
                },
              ],
            },
            '0xe708': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://linea-mainnet.infura.io/v3/{infuraProjectId}`,
                },
              ],
            },
            '0xa4b1': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://arbitrum.infura.io/v3/{infuraProjectId}`,
                },
              ],
            },
            '0xa86a': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://avalanche.infura.io/v3/{infuraProjectId}`,
                },
              ],
            },
            '0xa': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://optimism.infura.io/v3/{infuraProjectId}`,
                },
              ],
            },
            '0x89': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://polygon.infura.io/v3/{infuraProjectId}`,
                },
              ],
            },
            '0x2105': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://base.infura.io/v3/{infuraProjectId}`,
                },
              ],
            },
          },
        },
      },
    };
    const expectedVersionedData = {
      meta: { version: VERSION },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x1': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://mainnet.infura.io/v3/{infuraProjectId}`,
                  failoverUrls: [QUICKNODE_MAINNET_URL],
                },
              ],
            },
            '0xe708': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://linea-mainnet.infura.io/v3/{infuraProjectId}`,
                  failoverUrls: [QUICKNODE_LINEA_MAINNET_URL],
                },
              ],
            },
            '0xa4b1': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://arbitrum.infura.io/v3/{infuraProjectId}`,
                  failoverUrls: [QUICKNODE_ARBITRUM_URL],
                },
              ],
            },
            '0xa86a': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://avalanche.infura.io/v3/{infuraProjectId}`,
                  failoverUrls: [QUICKNODE_AVALANCHE_URL],
                },
              ],
            },
            '0xa': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://optimism.infura.io/v3/{infuraProjectId}`,
                  failoverUrls: [QUICKNODE_OPTIMISM_URL],
                },
              ],
            },
            '0x89': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://polygon.infura.io/v3/{infuraProjectId}`,
                  failoverUrls: [QUICKNODE_POLYGON_URL],
                },
              ],
            },
            '0x2105': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://base.infura.io/v3/{infuraProjectId}`,
                  failoverUrls: [QUICKNODE_BASE_URL],
                },
              ],
            },
          },
        },
      },
    };

    const newVersionedData = await migrate(oldVersionedData);

    expect(newVersionedData).toStrictEqual(expectedVersionedData);
  });

  it('assigns failover URLs to known Infura RPC endpoints, even if they have an empty set of failover URLs', async () => {
    process.env.INFURA_PROJECT_ID = INFURA_PROJECT_ID;
    process.env.QUICKNODE_MAINNET_URL = QUICKNODE_MAINNET_URL;
    process.env.QUICKNODE_LINEA_MAINNET_URL = QUICKNODE_LINEA_MAINNET_URL;
    process.env.QUICKNODE_ARBITRUM_URL = QUICKNODE_ARBITRUM_URL;
    process.env.QUICKNODE_AVALANCHE_URL = QUICKNODE_AVALANCHE_URL;
    process.env.QUICKNODE_OPTIMISM_URL = QUICKNODE_OPTIMISM_URL;
    process.env.QUICKNODE_POLYGON_URL = QUICKNODE_POLYGON_URL;
    process.env.QUICKNODE_BASE_URL = QUICKNODE_BASE_URL;
    const oldVersionedData = {
      meta: { version: VERSION - 1 },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x1': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://mainnet.infura.io/v3/{infuraProjectId}`,
                  failoverUrls: [],
                },
              ],
            },
            '0xe708': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://linea-mainnet.infura.io/v3/{infuraProjectId}`,
                  failoverUrls: [],
                },
              ],
            },
            '0xa4b1': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://arbitrum.infura.io/v3/{infuraProjectId}`,
                  failoverUrls: [],
                },
              ],
            },
            '0xa86a': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://avalanche.infura.io/v3/{infuraProjectId}`,
                  failoverUrls: [],
                },
              ],
            },
            '0xa': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://optimism.infura.io/v3/{infuraProjectId}`,
                  failoverUrls: [],
                },
              ],
            },
            '0x89': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://polygon.infura.io/v3/{infuraProjectId}`,
                  failoverUrls: [],
                },
              ],
            },
            '0x2105': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://base.infura.io/v3/{infuraProjectId}`,
                  failoverUrls: [],
                },
              ],
            },
          },
        },
      },
    };
    const expectedVersionedData = {
      meta: { version: VERSION },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x1': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://mainnet.infura.io/v3/{infuraProjectId}`,
                  failoverUrls: [QUICKNODE_MAINNET_URL],
                },
              ],
            },
            '0xe708': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://linea-mainnet.infura.io/v3/{infuraProjectId}`,
                  failoverUrls: [QUICKNODE_LINEA_MAINNET_URL],
                },
              ],
            },
            '0xa4b1': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://arbitrum.infura.io/v3/{infuraProjectId}`,
                  failoverUrls: [QUICKNODE_ARBITRUM_URL],
                },
              ],
            },
            '0xa86a': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://avalanche.infura.io/v3/{infuraProjectId}`,
                  failoverUrls: [QUICKNODE_AVALANCHE_URL],
                },
              ],
            },
            '0xa': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://optimism.infura.io/v3/{infuraProjectId}`,
                  failoverUrls: [QUICKNODE_OPTIMISM_URL],
                },
              ],
            },
            '0x89': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://polygon.infura.io/v3/{infuraProjectId}`,
                  failoverUrls: [QUICKNODE_POLYGON_URL],
                },
              ],
            },
            '0x2105': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://base.infura.io/v3/{infuraProjectId}`,
                  failoverUrls: [QUICKNODE_BASE_URL],
                },
              ],
            },
          },
        },
      },
    };

    const newVersionedData = await migrate(oldVersionedData);

    expect(newVersionedData).toStrictEqual(expectedVersionedData);
  });

  it('does not assign failover URLs to any Infura endpoints for which the appropriate environment variable is not set', async () => {
    process.env.INFURA_PROJECT_ID = INFURA_PROJECT_ID;
    const oldVersionedData = {
      meta: { version: VERSION - 1 },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x1': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://mainnet.infura.io/v3/{infuraProjectId}`,
                },
              ],
            },
            '0xe708': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://linea-mainnet.infura.io/v3/{infuraProjectId}`,
                },
              ],
            },
            '0xa4b1': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://arbitrum.infura.io/v3/{infuraProjectId}`,
                },
              ],
            },
            '0xa86a': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://avalanche.infura.io/v3/{infuraProjectId}`,
                },
              ],
            },
            '0xa': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://optimism.infura.io/v3/{infuraProjectId}`,
                },
              ],
            },
            '0x89': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://polygon.infura.io/v3/{infuraProjectId}`,
                },
              ],
            },
            '0x2105': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://base.infura.io/v3/{infuraProjectId}`,
                },
              ],
            },
          },
        },
      },
    };
    const expectedVersionedData = {
      meta: { version: VERSION },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x1': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://mainnet.infura.io/v3/{infuraProjectId}`,
                },
              ],
            },
            '0xe708': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://linea-mainnet.infura.io/v3/{infuraProjectId}`,
                },
              ],
            },
            '0xa4b1': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://arbitrum.infura.io/v3/{infuraProjectId}`,
                },
              ],
            },
            '0xa86a': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://avalanche.infura.io/v3/{infuraProjectId}`,
                },
              ],
            },
            '0xa': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://optimism.infura.io/v3/{infuraProjectId}`,
                },
              ],
            },
            '0x89': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://polygon.infura.io/v3/{infuraProjectId}`,
                },
              ],
            },
            '0x2105': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://base.infura.io/v3/{infuraProjectId}`,
                },
              ],
            },
          },
        },
      },
    };

    const newVersionedData = await migrate(oldVersionedData);

    expect(newVersionedData).toStrictEqual(expectedVersionedData);
  });

  it('does not update any Infura RPC endpoints that already have failover URLs defined', async () => {
    process.env.INFURA_PROJECT_ID = INFURA_PROJECT_ID;
    process.env.QUICKNODE_LINEA_MAINNET_URL = QUICKNODE_LINEA_MAINNET_URL;
    const oldVersionedData = {
      meta: { version: VERSION - 1 },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x1': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://mainnet.infura.io/v3/{infuraProjectId}`,
                  failoverUrls: ['https://foo.com'],
                },
              ],
            },
            '0xe708': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://linea-mainnet.infura.io/v3/{infuraProjectId}`,
                },
              ],
            },
          },
        },
      },
    };
    const expectedVersionedData = {
      meta: { version: VERSION },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x1': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://mainnet.infura.io/v3/{infuraProjectId}`,
                  failoverUrls: ['https://foo.com'],
                },
              ],
            },
            '0xe708': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://linea-mainnet.infura.io/v3/{infuraProjectId}`,
                  failoverUrls: [QUICKNODE_LINEA_MAINNET_URL],
                },
              ],
            },
          },
        },
      },
    };

    const newVersionedData = await migrate(oldVersionedData);

    expect(newVersionedData).toStrictEqual(expectedVersionedData);
  });

  it('assigns failover URLs to custom RPC endpoints that are actually Infura RPC endpoints in disguise', async () => {
    process.env.INFURA_PROJECT_ID = INFURA_PROJECT_ID;
    process.env.QUICKNODE_MAINNET_URL = QUICKNODE_MAINNET_URL;
    process.env.QUICKNODE_LINEA_MAINNET_URL = QUICKNODE_LINEA_MAINNET_URL;
    process.env.QUICKNODE_ARBITRUM_URL = QUICKNODE_ARBITRUM_URL;
    process.env.QUICKNODE_AVALANCHE_URL = QUICKNODE_AVALANCHE_URL;
    process.env.QUICKNODE_OPTIMISM_URL = QUICKNODE_OPTIMISM_URL;
    process.env.QUICKNODE_POLYGON_URL = QUICKNODE_POLYGON_URL;
    process.env.QUICKNODE_BASE_URL = QUICKNODE_BASE_URL;
    const oldVersionedData = {
      meta: { version: VERSION - 1 },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x1': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
                },
              ],
            },
            '0xe708': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://linea-mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
                },
              ],
            },
            '0xa4b1': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://arbitrum.infura.io/v3/${INFURA_PROJECT_ID}`,
                },
              ],
            },
            '0xa86a': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://avalanche.infura.io/v3/${INFURA_PROJECT_ID}`,
                },
              ],
            },
            '0xa': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://optimism.infura.io/v3/${INFURA_PROJECT_ID}`,
                },
              ],
            },
            '0x89': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://polygon.infura.io/v3/${INFURA_PROJECT_ID}`,
                },
              ],
            },
            '0x2105': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://base.infura.io/v3/${INFURA_PROJECT_ID}`,
                },
              ],
            },
          },
        },
      },
    };
    const expectedVersionedData = {
      meta: { version: VERSION },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x1': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
                  failoverUrls: [QUICKNODE_MAINNET_URL],
                },
              ],
            },
            '0xe708': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://linea-mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
                  failoverUrls: [QUICKNODE_LINEA_MAINNET_URL],
                },
              ],
            },
            '0xa4b1': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://arbitrum.infura.io/v3/${INFURA_PROJECT_ID}`,
                  failoverUrls: [QUICKNODE_ARBITRUM_URL],
                },
              ],
            },
            '0xa86a': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://avalanche.infura.io/v3/${INFURA_PROJECT_ID}`,
                  failoverUrls: [QUICKNODE_AVALANCHE_URL],
                },
              ],
            },
            '0xa': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://optimism.infura.io/v3/${INFURA_PROJECT_ID}`,
                  failoverUrls: [QUICKNODE_OPTIMISM_URL],
                },
              ],
            },
            '0x89': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://polygon.infura.io/v3/${INFURA_PROJECT_ID}`,
                  failoverUrls: [QUICKNODE_POLYGON_URL],
                },
              ],
            },
            '0x2105': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://base.infura.io/v3/${INFURA_PROJECT_ID}`,
                  failoverUrls: [QUICKNODE_BASE_URL],
                },
              ],
            },
          },
        },
      },
    };

    const newVersionedData = await migrate(oldVersionedData);

    expect(newVersionedData).toStrictEqual(expectedVersionedData);
  });

  it('assigns failover URLs to custom RPC endpoints that are actually Infura RPC endpoints in disguise, even if they have an empty set of failover URLs', async () => {
    process.env.INFURA_PROJECT_ID = INFURA_PROJECT_ID;
    process.env.QUICKNODE_MAINNET_URL = QUICKNODE_MAINNET_URL;
    process.env.QUICKNODE_LINEA_MAINNET_URL = QUICKNODE_LINEA_MAINNET_URL;
    process.env.QUICKNODE_ARBITRUM_URL = QUICKNODE_ARBITRUM_URL;
    process.env.QUICKNODE_AVALANCHE_URL = QUICKNODE_AVALANCHE_URL;
    process.env.QUICKNODE_OPTIMISM_URL = QUICKNODE_OPTIMISM_URL;
    process.env.QUICKNODE_POLYGON_URL = QUICKNODE_POLYGON_URL;
    process.env.QUICKNODE_BASE_URL = QUICKNODE_BASE_URL;
    const oldVersionedData = {
      meta: { version: VERSION - 1 },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x1': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
                  failoverUrls: [],
                },
              ],
            },
            '0xe708': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://linea-mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
                  failoverUrls: [],
                },
              ],
            },
            '0xa4b1': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://arbitrum.infura.io/v3/${INFURA_PROJECT_ID}`,
                  failoverUrls: [],
                },
              ],
            },
            '0xa86a': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://avalanche.infura.io/v3/${INFURA_PROJECT_ID}`,
                  failoverUrls: [],
                },
              ],
            },
            '0xa': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://optimism.infura.io/v3/${INFURA_PROJECT_ID}`,
                  failoverUrls: [],
                },
              ],
            },
            '0x89': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://polygon.infura.io/v3/${INFURA_PROJECT_ID}`,
                  failoverUrls: [],
                },
              ],
            },
            '0x2105': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://base.infura.io/v3/${INFURA_PROJECT_ID}`,
                  failoverUrls: [],
                },
              ],
            },
          },
        },
      },
    };
    const expectedVersionedData = {
      meta: { version: VERSION },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x1': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
                  failoverUrls: [QUICKNODE_MAINNET_URL],
                },
              ],
            },
            '0xe708': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://linea-mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
                  failoverUrls: [QUICKNODE_LINEA_MAINNET_URL],
                },
              ],
            },
            '0xa4b1': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://arbitrum.infura.io/v3/${INFURA_PROJECT_ID}`,
                  failoverUrls: [QUICKNODE_ARBITRUM_URL],
                },
              ],
            },
            '0xa86a': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://avalanche.infura.io/v3/${INFURA_PROJECT_ID}`,
                  failoverUrls: [QUICKNODE_AVALANCHE_URL],
                },
              ],
            },
            '0xa': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://optimism.infura.io/v3/${INFURA_PROJECT_ID}`,
                  failoverUrls: [QUICKNODE_OPTIMISM_URL],
                },
              ],
            },
            '0x89': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://polygon.infura.io/v3/${INFURA_PROJECT_ID}`,
                  failoverUrls: [QUICKNODE_POLYGON_URL],
                },
              ],
            },
            '0x2105': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://base.infura.io/v3/${INFURA_PROJECT_ID}`,
                  failoverUrls: [QUICKNODE_BASE_URL],
                },
              ],
            },
          },
        },
      },
    };

    const newVersionedData = await migrate(oldVersionedData);

    expect(newVersionedData).toStrictEqual(expectedVersionedData);
  });

  it('does not assign failover URLs to custom RPC endpoints that are actually Infura RPC endpoints in disguise but for which the appropriate environment variables are not set', async () => {
    process.env.INFURA_PROJECT_ID = INFURA_PROJECT_ID;
    const oldVersionedData = {
      meta: { version: VERSION - 1 },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x1': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
                },
              ],
            },
            '0xe708': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://linea-mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
                },
              ],
            },
            '0xa4b1': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://arbitrum.infura.io/v3/${INFURA_PROJECT_ID}`,
                },
              ],
            },
            '0xa86a': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://avalanche.infura.io/v3/${INFURA_PROJECT_ID}`,
                },
              ],
            },
            '0xa': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://optimism.infura.io/v3/${INFURA_PROJECT_ID}`,
                },
              ],
            },
            '0x89': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://polygon.infura.io/v3/${INFURA_PROJECT_ID}`,
                },
              ],
            },
            '0x2105': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://base.infura.io/v3/${INFURA_PROJECT_ID}`,
                },
              ],
            },
          },
        },
      },
    };
    const expectedVersionedData = {
      meta: { version: VERSION },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x1': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
                },
              ],
            },
            '0xe708': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://linea-mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
                },
              ],
            },
            '0xa4b1': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://arbitrum.infura.io/v3/${INFURA_PROJECT_ID}`,
                },
              ],
            },
            '0xa86a': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://avalanche.infura.io/v3/${INFURA_PROJECT_ID}`,
                },
              ],
            },
            '0xa': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://optimism.infura.io/v3/${INFURA_PROJECT_ID}`,
                },
              ],
            },
            '0x89': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://polygon.infura.io/v3/${INFURA_PROJECT_ID}`,
                },
              ],
            },
            '0x2105': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://base.infura.io/v3/${INFURA_PROJECT_ID}`,
                },
              ],
            },
          },
        },
      },
    };

    const newVersionedData = await migrate(oldVersionedData);

    expect(newVersionedData).toStrictEqual(expectedVersionedData);
  });

  it('does not update any in-disguise Infura RPC endpoints that already have failover URLs defined', async () => {
    process.env.INFURA_PROJECT_ID = INFURA_PROJECT_ID;
    process.env.QUICKNODE_LINEA_MAINNET_URL = QUICKNODE_LINEA_MAINNET_URL;
    const oldVersionedData = {
      meta: { version: VERSION - 1 },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x1': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
                  failoverUrls: ['https://foo.com'],
                },
              ],
            },
            '0xe708': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://linea-mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
                },
              ],
            },
          },
        },
      },
    };
    const expectedVersionedData = {
      meta: { version: VERSION },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x1': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
                  failoverUrls: ['https://foo.com'],
                },
              ],
            },
            '0xe708': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://linea-mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
                  failoverUrls: [QUICKNODE_LINEA_MAINNET_URL],
                },
              ],
            },
          },
        },
      },
    };

    const newVersionedData = await migrate(oldVersionedData);

    expect(newVersionedData).toStrictEqual(expectedVersionedData);
  });
});
