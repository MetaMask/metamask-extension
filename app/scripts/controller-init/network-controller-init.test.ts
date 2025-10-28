import {
  ControllerStateChangeEvent,
  Messenger,
} from '@metamask/base-controller';
import { NetworkController } from '@metamask/network-controller';
import { RemoteFeatureFlagControllerState } from '@metamask/remote-feature-flag-controller';
import { ControllerInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import {
  NetworkControllerInitMessenger,
  NetworkControllerMessenger,
  getNetworkControllerMessenger,
  getNetworkControllerInitMessenger,
} from './messengers';
import {
  ADDITIONAL_DEFAULT_NETWORKS,
  NetworkControllerInit,
} from './network-controller-init';

jest.mock('@metamask/network-controller', () => {
  const originalModule = jest.requireActual('@metamask/network-controller');
  const NetworkControllerMock = jest.fn().mockImplementation(() => {
    return {
      initializeProvider: jest.fn(),
      enableRpcFailover: jest.fn(),
      disableRpcFailover: jest.fn(),
    };
  });

  return {
    ...originalModule,
    NetworkController: NetworkControllerMock,
  };
});

function getInitRequestMock(
  baseMessenger = new Messenger<never, never>(),
): jest.Mocked<
  ControllerInitRequest<
    NetworkControllerMessenger,
    NetworkControllerInitMessenger
  >
> {
  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getNetworkControllerMessenger(baseMessenger),
    initMessenger: getNetworkControllerInitMessenger(baseMessenger),
  };

  return requestMock;
}

describe('NetworkControllerInit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes the controller', () => {
    const { controller } = NetworkControllerInit(getInitRequestMock());
    expect(controller).toStrictEqual({
      initializeProvider: expect.any(Function),
      enableRpcFailover: expect.any(Function),
      disableRpcFailover: expect.any(Function),
    });
  });

  it('passes the proper arguments to the controller', () => {
    NetworkControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(NetworkController);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      state: expect.any(Object),
      additionalDefaultNetworks: ADDITIONAL_DEFAULT_NETWORKS,
      getBlockTrackerOptions: expect.any(Function),
      getRpcServiceOptions: expect.any(Function),
      infuraProjectId: undefined,
    });
  });

  it('sets the default state for the controller', () => {
    NetworkControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(NetworkController);
    const initialState = controllerMock.mock.calls[0][0].state;
    expect(initialState).toMatchInlineSnapshot(`
      {
        "networkConfigurationsByChainId": {
          "0x1": {
            "blockExplorerUrls": [
              "https://etherscan.io",
            ],
            "chainId": "0x1",
            "defaultBlockExplorerUrlIndex": 0,
            "defaultRpcEndpointIndex": 0,
            "name": "Ethereum",
            "nativeCurrency": "ETH",
            "rpcEndpoints": [
              {
                "failoverUrls": [],
                "networkClientId": "mainnet",
                "type": "infura",
                "url": "https://mainnet.infura.io/v3/{infuraProjectId}",
              },
            ],
          },
          "0x18c6": {
            "blockExplorerUrls": [
              "https://megaexplorer.xyz",
            ],
            "chainId": "0x18c6",
            "defaultBlockExplorerUrlIndex": 0,
            "defaultRpcEndpointIndex": 0,
            "name": "Mega Testnet",
            "nativeCurrency": "MegaETH",
            "rpcEndpoints": [
              {
                "failoverUrls": [],
                "networkClientId": "megaeth-testnet",
                "type": "custom",
                "url": "https://carrot.megaeth.com/rpc",
              },
            ],
          },
          "0x2105": {
            "blockExplorerUrls": [
              "https://basescan.org",
            ],
            "chainId": "0x2105",
            "defaultBlockExplorerUrlIndex": 0,
            "defaultRpcEndpointIndex": 0,
            "name": "Base",
            "nativeCurrency": "ETH",
            "rpcEndpoints": [
              {
                "failoverUrls": [],
                "networkClientId": "base-mainnet",
                "type": "infura",
                "url": "https://base-mainnet.infura.io/v3/{infuraProjectId}",
              },
            ],
          },
          "0x279f": {
            "blockExplorerUrls": [
              "https://testnet.monadexplorer.com",
            ],
            "chainId": "0x279f",
            "defaultBlockExplorerUrlIndex": 0,
            "defaultRpcEndpointIndex": 0,
            "name": "Monad Testnet",
            "nativeCurrency": "MON",
            "rpcEndpoints": [
              {
                "failoverUrls": [],
                "networkClientId": "monad-testnet",
                "type": "custom",
                "url": "https://testnet-rpc.monad.xyz",
              },
            ],
          },
          "0x38": {
            "blockExplorerUrls": [
              "https://bscscan.com",
            ],
            "chainId": "0x38",
            "defaultBlockExplorerUrlIndex": 0,
            "defaultRpcEndpointIndex": 0,
            "name": "BSC Mainnet",
            "nativeCurrency": "BNB",
            "rpcEndpoints": [
              {
                "failoverUrls": [],
                "networkClientId": "bsc-mainnet",
                "type": "infura",
                "url": "https://bsc-mainnet.infura.io/v3/{infuraProjectId}",
              },
            ],
          },
          "0x531": {
            "blockExplorerUrls": [
              "https://seitrace.com",
            ],
            "chainId": "0x531",
            "defaultBlockExplorerUrlIndex": 0,
            "defaultRpcEndpointIndex": 0,
            "name": "Sei Mainnet",
            "nativeCurrency": "SEI",
            "rpcEndpoints": [
              {
                "failoverUrls": [],
                "networkClientId": "sei-mainnet",
                "type": "infura",
                "url": "https://sei-mainnet.infura.io/v3/{infuraProjectId}",
              },
            ],
          },
          "0x539": {
            "blockExplorerUrls": [],
            "chainId": "0x539",
            "defaultRpcEndpointIndex": 0,
            "name": "Localhost 8545",
            "nativeCurrency": "ETH",
            "rpcEndpoints": [
              {
                "failoverUrls": [],
                "networkClientId": "networkConfigurationId",
                "type": "custom",
                "url": "http://localhost:8545",
              },
            ],
          },
          "0x89": {
            "blockExplorerUrls": [
              "https://polygonscan.com",
            ],
            "chainId": "0x89",
            "defaultBlockExplorerUrlIndex": 0,
            "defaultRpcEndpointIndex": 0,
            "name": "Polygon Mainnet",
            "nativeCurrency": "POL",
            "rpcEndpoints": [
              {
                "failoverUrls": [],
                "networkClientId": "polygon-mainnet",
                "type": "infura",
                "url": "https://polygon-mainnet.infura.io/v3/{infuraProjectId}",
              },
            ],
          },
          "0xa": {
            "blockExplorerUrls": [
              "https://optimistic.etherscan.io",
            ],
            "chainId": "0xa",
            "defaultBlockExplorerUrlIndex": 0,
            "defaultRpcEndpointIndex": 0,
            "name": "Optimism Mainnet",
            "nativeCurrency": "ETH",
            "rpcEndpoints": [
              {
                "failoverUrls": [],
                "networkClientId": "optimism-mainnet",
                "type": "infura",
                "url": "https://optimism-mainnet.infura.io/v3/{infuraProjectId}",
              },
            ],
          },
          "0xa4b1": {
            "blockExplorerUrls": [
              "https://arbiscan.io",
            ],
            "chainId": "0xa4b1",
            "defaultBlockExplorerUrlIndex": 0,
            "defaultRpcEndpointIndex": 0,
            "name": "Arbitrum One",
            "nativeCurrency": "ETH",
            "rpcEndpoints": [
              {
                "failoverUrls": [],
                "networkClientId": "arbitrum-mainnet",
                "type": "infura",
                "url": "https://arbitrum-mainnet.infura.io/v3/{infuraProjectId}",
              },
            ],
          },
          "0xaa36a7": {
            "blockExplorerUrls": [
              "https://sepolia.etherscan.io",
            ],
            "chainId": "0xaa36a7",
            "defaultBlockExplorerUrlIndex": 0,
            "defaultRpcEndpointIndex": 0,
            "name": "Sepolia",
            "nativeCurrency": "SepoliaETH",
            "rpcEndpoints": [
              {
                "failoverUrls": [],
                "networkClientId": "sepolia",
                "type": "infura",
                "url": "https://sepolia.infura.io/v3/{infuraProjectId}",
              },
            ],
          },
          "0xe705": {
            "blockExplorerUrls": [
              "https://sepolia.lineascan.build",
            ],
            "chainId": "0xe705",
            "defaultBlockExplorerUrlIndex": 0,
            "defaultRpcEndpointIndex": 0,
            "name": "Linea Sepolia",
            "nativeCurrency": "LineaETH",
            "rpcEndpoints": [
              {
                "failoverUrls": [],
                "networkClientId": "linea-sepolia",
                "type": "infura",
                "url": "https://linea-sepolia.infura.io/v3/{infuraProjectId}",
              },
            ],
          },
          "0xe708": {
            "blockExplorerUrls": [
              "https://lineascan.build",
            ],
            "chainId": "0xe708",
            "defaultBlockExplorerUrlIndex": 0,
            "defaultRpcEndpointIndex": 0,
            "name": "Linea",
            "nativeCurrency": "ETH",
            "rpcEndpoints": [
              {
                "failoverUrls": [],
                "networkClientId": "linea-mainnet",
                "type": "infura",
                "url": "https://linea-mainnet.infura.io/v3/{infuraProjectId}",
              },
            ],
          },
        },
        "networksMetadata": {},
        "selectedNetworkClientId": "networkConfigurationId",
      }
    `);
  });

  it('enables RPC failover when the `walletFrameworkRpcFailoverEnabled` feature flag is enabled', () => {
    const messenger = new Messenger<
      never,
      ControllerStateChangeEvent<
        'RemoteFeatureFlagController',
        RemoteFeatureFlagControllerState
      >
    >();

    const request = getInitRequestMock(messenger);

    const { controller } = NetworkControllerInit(request);
    expect(controller.enableRpcFailover).not.toHaveBeenCalled();

    messenger.publish(
      'RemoteFeatureFlagController:stateChange',
      // @ts-expect-error: Partial mock.
      {
        remoteFeatureFlags: {
          walletFrameworkRpcFailoverEnabled: true,
        },
      },
      [],
    );

    expect(controller.enableRpcFailover).toHaveBeenCalled();
  });

  it('disables RPC failover when the `walletFrameworkRpcFailoverEnabled` feature flag is disabled', () => {
    const messenger = new Messenger<
      never,
      ControllerStateChangeEvent<
        'RemoteFeatureFlagController',
        RemoteFeatureFlagControllerState
      >
    >();

    const request = getInitRequestMock(messenger);

    const { controller } = NetworkControllerInit(request);
    expect(controller.disableRpcFailover).not.toHaveBeenCalled();

    messenger.publish(
      'RemoteFeatureFlagController:stateChange',
      // @ts-expect-error: Partial mock.
      {
        remoteFeatureFlags: {
          walletFrameworkRpcFailoverEnabled: false,
        },
      },
      [],
    );

    expect(controller.disableRpcFailover).toHaveBeenCalled();
  });
});
