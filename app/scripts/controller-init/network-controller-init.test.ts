import { ControllerStateChangeEvent } from '@metamask/base-controller';
import {
  ActionConstraint,
  EventConstraint,
  MOCK_ANY_NAMESPACE,
  Messenger,
  MockAnyNamespace,
} from '@metamask/messenger';
import {
  NetworkController,
  NetworkControllerRpcEndpointDegradedEvent,
  NetworkControllerRpcEndpointUnavailableEvent,
} from '@metamask/network-controller';
import {
  RemoteFeatureFlagControllerGetStateAction,
  RemoteFeatureFlagControllerState,
} from '@metamask/remote-feature-flag-controller';
import {
  onRpcEndpointUnavailable,
  onRpcEndpointDegraded,
} from '../lib/network-controller/messenger-action-handlers';
import {
  MetaMetricsControllerGetMetaMetricsIdAction,
  MetaMetricsControllerTrackEventAction,
} from '../controllers/metametrics-controller';
import {
  ConnectivityControllerGetStateAction,
  ConnectivityStatus,
} from '../controllers/connectivity';
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

jest.mock('../lib/network-controller/messenger-action-handlers', () => ({
  onRpcEndpointUnavailable: jest.fn(),
  onRpcEndpointDegraded: jest.fn(),
}));

type RpcEndpointEvents =
  | NetworkControllerRpcEndpointUnavailableEvent
  | NetworkControllerRpcEndpointDegradedEvent
  | ControllerStateChangeEvent<
      'RemoteFeatureFlagController',
      RemoteFeatureFlagControllerState
    >;

type InitActions =
  | RemoteFeatureFlagControllerGetStateAction
  | ConnectivityControllerGetStateAction
  | MetaMetricsControllerGetMetaMetricsIdAction
  | MetaMetricsControllerTrackEventAction;

function getInitRequestMock(
  messenger = new Messenger<
    MockAnyNamespace,
    InitActions | ActionConstraint,
    RpcEndpointEvents | EventConstraint
  >({ namespace: MOCK_ANY_NAMESPACE }),
  {
    connectivityStatus = 'online',
  }: { connectivityStatus?: ConnectivityStatus } = {},
): jest.Mocked<
  ControllerInitRequest<
    NetworkControllerMessenger,
    NetworkControllerInitMessenger
  >
> {
  messenger.registerActionHandler(
    'RemoteFeatureFlagController:getState',
    jest.fn().mockReturnValue({
      remoteFeatureFlags: {
        walletFrameworkRpcFailoverEnabled: true,
      },
    }),
  );

  messenger.registerActionHandler('ConnectivityController:getState', () => ({
    connectivityStatus,
  }));

  messenger.registerActionHandler(
    'MetaMetricsController:getMetaMetricsId',
    jest.fn().mockReturnValue('test-metrics-id'),
  );

  messenger.registerActionHandler(
    'MetaMetricsController:trackEvent',
    jest.fn(),
  );

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getNetworkControllerMessenger(messenger),
    initMessenger: getNetworkControllerInitMessenger(messenger),
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
      isRpcFailoverEnabled: true,
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
          "0x18c7": {
            "blockExplorerUrls": [
              "https://megaeth-testnet-v2.blockscout.com",
            ],
            "chainId": "0x18c7",
            "defaultBlockExplorerUrlIndex": 0,
            "defaultRpcEndpointIndex": 0,
            "name": "MegaETH Testnet",
            "nativeCurrency": "MegaETH",
            "rpcEndpoints": [
              {
                "failoverUrls": [],
                "networkClientId": "megaeth-testnet-v2",
                "type": "custom",
                "url": "https://timothy.megaeth.com/rpc",
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
            "name": "BNB Chain",
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
            "name": "Polygon",
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
            "name": "OP",
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
            "name": "Arbitrum",
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
      MockAnyNamespace,
      RemoteFeatureFlagControllerGetStateAction,
      ControllerStateChangeEvent<
        'RemoteFeatureFlagController',
        RemoteFeatureFlagControllerState
      >
    >({ namespace: MOCK_ANY_NAMESPACE });

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
      MockAnyNamespace,
      RemoteFeatureFlagControllerGetStateAction,
      ControllerStateChangeEvent<
        'RemoteFeatureFlagController',
        RemoteFeatureFlagControllerState
      >
    >({ namespace: MOCK_ANY_NAMESPACE });

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

  describe('RPC endpoint events', () => {
    it('suppresses rpcEndpointUnavailable events when device is offline', () => {
      const messenger = new Messenger<
        MockAnyNamespace,
        ActionConstraint,
        RpcEndpointEvents | EventConstraint
      >({ namespace: MOCK_ANY_NAMESPACE });

      const request = getInitRequestMock(messenger, {
        connectivityStatus: 'offline',
      });

      NetworkControllerInit(request);

      messenger.publish('NetworkController:rpcEndpointUnavailable', {
        chainId: '0x1',
        endpointUrl: 'https://example.com',
        error: new Error('Connection failed'),
        networkClientId: 'mainnet',
        primaryEndpointUrl: 'https://mainnet.infura.io',
      });

      expect(onRpcEndpointUnavailable).not.toHaveBeenCalled();
    });

    it('suppresses rpcEndpointDegraded events when device is offline', () => {
      const messenger = new Messenger<
        MockAnyNamespace,
        ActionConstraint,
        RpcEndpointEvents | EventConstraint
      >({ namespace: MOCK_ANY_NAMESPACE });

      const request = getInitRequestMock(messenger, {
        connectivityStatus: 'offline',
      });

      NetworkControllerInit(request);

      messenger.publish('NetworkController:rpcEndpointDegraded', {
        chainId: '0x1',
        endpointUrl: 'https://example.com',
        error: new Error('Slow response'),
        networkClientId: 'mainnet',
        primaryEndpointUrl: 'https://mainnet.infura.io',
      });

      expect(onRpcEndpointDegraded).not.toHaveBeenCalled();
    });

    it('processes rpcEndpointUnavailable events when device is online', () => {
      const messenger = new Messenger<
        MockAnyNamespace,
        ActionConstraint,
        RpcEndpointEvents | EventConstraint
      >({ namespace: MOCK_ANY_NAMESPACE });

      const request = getInitRequestMock(messenger, {
        connectivityStatus: 'online',
      });

      NetworkControllerInit(request);

      messenger.publish('NetworkController:rpcEndpointUnavailable', {
        chainId: '0x1',
        endpointUrl: 'https://example.com',
        error: new Error('Connection failed'),
        networkClientId: 'mainnet',
        primaryEndpointUrl: 'https://mainnet.infura.io',
      });

      expect(onRpcEndpointUnavailable).toHaveBeenCalledWith(
        expect.objectContaining({
          chainId: '0x1',
          endpointUrl: 'https://example.com',
        }),
      );
    });

    it('processes rpcEndpointDegraded events when device is online', () => {
      const messenger = new Messenger<
        MockAnyNamespace,
        ActionConstraint,
        RpcEndpointEvents | EventConstraint
      >({ namespace: MOCK_ANY_NAMESPACE });

      const request = getInitRequestMock(messenger, {
        connectivityStatus: 'online',
      });

      NetworkControllerInit(request);

      messenger.publish('NetworkController:rpcEndpointDegraded', {
        chainId: '0x1',
        endpointUrl: 'https://example.com',
        error: new Error('Slow response'),
        networkClientId: 'mainnet',
        primaryEndpointUrl: 'https://mainnet.infura.io',
      });

      expect(onRpcEndpointDegraded).toHaveBeenCalledWith(
        expect.objectContaining({
          chainId: '0x1',
          endpointUrl: 'https://example.com',
        }),
      );
    });
  });
});
