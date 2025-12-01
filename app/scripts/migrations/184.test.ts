import { RpcEndpointType } from '@metamask/network-controller';
import {
  migrate,
  version,
  MEGAETH_TESTNET_V2_CONFIG,
  MEGAETH_TESTNET_V1_CHAIN_ID,
} from './184';

const VERSION = version;
const oldVersion = VERSION - 1;

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

  it('removes the megaeth testnet v1 network configuration and adds the megaeth testnet v2 network configuration', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            [MEGAETH_TESTNET_V1_CHAIN_ID]: {
              chainId: MEGAETH_TESTNET_V1_CHAIN_ID,
              name: 'Mega Testnet',
              nativeCurrency: 'MegaETH',
              blockExplorerUrls: ['https://explorer.com'],
              defaultRpcEndpointIndex: 0,
              defaultBlockExplorerUrlIndex: 0,
              rpcEndpoints: [
                {
                  networkClientId: 'megaeth-testnet',
                  type: RpcEndpointType.Custom,
                  url: 'https://rpc.com',
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
            [MEGAETH_TESTNET_V2_CONFIG.chainId]: MEGAETH_TESTNET_V2_CONFIG,
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage).toStrictEqual(expectedStorage);
  });

  it('updates the selected network client id to the new MegaETH Testnet v2 if the selected network client id is the old MegaETH Testnet v1', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          selectedNetworkClientId: 'megaeth-testnet',
          networkConfigurationsByChainId: {
            [MEGAETH_TESTNET_V1_CHAIN_ID]: {
              chainId: MEGAETH_TESTNET_V1_CHAIN_ID,
              name: 'Mega Testnet',
              nativeCurrency: 'MegaETH',
              blockExplorerUrls: ['https://explorer.com'],
              defaultRpcEndpointIndex: 0,
              defaultBlockExplorerUrlIndex: 0,
              rpcEndpoints: [
                {
                  networkClientId: 'megaeth-testnet',
                  type: RpcEndpointType.Custom,
                  url: 'https://rpc.com',
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
          selectedNetworkClientId: 'megaeth-testnet-v2',
          networkConfigurationsByChainId: {
            [MEGAETH_TESTNET_V2_CONFIG.chainId]: MEGAETH_TESTNET_V2_CONFIG,
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage).toStrictEqual(expectedStorage);
  });
});
