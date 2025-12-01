import { RpcEndpointType } from '@metamask/network-controller';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { migrate, version } from './184';

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

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('does not add failover URL if QUICKNODE_MONAD_URL env variable is not set', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            [MONAD_CHAIN_ID]: {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://monad-mainnet.infura.io/v3/`,
                },
              ],
            },
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    // When QUICKNODE_MONAD_URL is not set, no failover URL should be added
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('does not add failover URL if there is already a failover URL', async () => {
    process.env.QUICKNODE_MONAD_URL = QUICKNODE_MONAD_URL;

    const existingFailoverUrl = 'https://existing-failover.com';

    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            [MONAD_CHAIN_ID]: {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://monad-mainnet.infura.io/v3/`,
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

  it('adds QuickNode failover URL to all Monad RPC endpoints when no failover URLs exist', async () => {
    process.env.QUICKNODE_MONAD_URL = QUICKNODE_MONAD_URL;

    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            [MONAD_CHAIN_ID]: {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Infura,
                  url: `https://monad-mainnet.infura.io/v3/`,
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
                  url: `https://ethereum-mainnet.infura.io/v3/`,
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
                  url: `https://monad-mainnet.infura.io/v3/`,
                  failoverUrls: [QUICKNODE_MONAD_URL],
                },
                {
                  type: RpcEndpointType.Custom,
                  url: `https://some-monad-rpc.com`,
                  failoverUrls: [QUICKNODE_MONAD_URL],
                },
              ],
            },
            '0x1': {
              rpcEndpoints: [
                {
                  type: RpcEndpointType.Custom,
                  url: `https://ethereum-mainnet.infura.io/v3/`,
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

