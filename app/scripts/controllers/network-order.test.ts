import { Messenger } from '@metamask/base-controller';
import {
  NetworkOrderController,
  NetworkOrderControllerMessenger,
} from './network-order';
import {
  NetworkConfiguration,
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerGetStateAction,
  NetworkControllerNetworkRemovedEvent,
  NetworkControllerSetActiveNetworkAction,
  NetworkControllerStateChangeEvent,
  NetworkState,
  RpcEndpointType,
} from '@metamask/network-controller';
import { KnownCaipNamespace } from '@metamask/utils';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { SolScope } from '@metamask/keyring-api';
import { waitFor } from '@testing-library/react';

describe('NetworkOrderController - constructor', () => {
  it('sets up initial state', () => {
    const mocks = arrangeMockMessenger();
    const controller = new NetworkOrderController({
      messenger: mocks.messenger,
    });

    expect(controller.state).toStrictEqual({
      orderedNetworkList: [],
      enabledNetworkMap: {
        [KnownCaipNamespace.Eip155]: {
          [CHAIN_IDS.MAINNET]: true,
          [CHAIN_IDS.LINEA_MAINNET]: true,
          [CHAIN_IDS.BASE]: true,
        },
        [KnownCaipNamespace.Solana]: {
          [SolScope.Mainnet]: true,
        },
      },
    });
  });

  it('uses provided initial state', () => {
    const mocks = arrangeMockMessenger();
    const controller = new NetworkOrderController({
      messenger: mocks.messenger,
      state: {
        enabledNetworkMap: {},
        orderedNetworkList: [],
      },
    });

    expect(controller.state).toStrictEqual({
      enabledNetworkMap: {},
      orderedNetworkList: [],
    });
  });

  it('removes network from enabled map when NetworkController:networkRemoved event is emitted', () => {
    const mocks = arrangeMockMessenger();
    const controller = new NetworkOrderController({
      messenger: mocks.messenger,
      state: {
        orderedNetworkList: [],
        enabledNetworkMap: {
          [KnownCaipNamespace.Eip155]: {
            [CHAIN_IDS.MAINNET]: true,
            [CHAIN_IDS.LINEA_MAINNET]: true,
            [CHAIN_IDS.BASE]: true,
          },
          [KnownCaipNamespace.Solana]: {
            [SolScope.Mainnet]: true,
          },
        },
      },
    });

    mocks.globalMessenger.publish('NetworkController:networkRemoved', {
      chainId: CHAIN_IDS.BASE,
    } as unknown as NetworkConfiguration);

    expect(controller.state.enabledNetworkMap).toStrictEqual({
      [KnownCaipNamespace.Eip155]: {
        [CHAIN_IDS.MAINNET]: true,
        [CHAIN_IDS.LINEA_MAINNET]: true,
        // Base has been removed
      },
      [KnownCaipNamespace.Solana]: {
        [SolScope.Mainnet]: true,
      },
    });

    mocks.globalMessenger.publish('NetworkController:networkRemoved', {
      chainId: SolScope.Mainnet,
    } as unknown as NetworkConfiguration);

    expect(controller.state.enabledNetworkMap).toStrictEqual({
      [KnownCaipNamespace.Eip155]: {
        [CHAIN_IDS.MAINNET]: true,
        [CHAIN_IDS.LINEA_MAINNET]: true,
        // Base has been removed
      },
      [KnownCaipNamespace.Solana]: {
        // Sol mainnet has been removed
      },
    });
  });

  it('updates network order when NetworkController:stateChange event is emitted with new networks', () => {
    const mocks = arrangeMockMessenger();
    const controller = new NetworkOrderController({
      messenger: mocks.messenger,
      state: {
        orderedNetworkList: [],
        enabledNetworkMap: {
          [KnownCaipNamespace.Eip155]: {
            [CHAIN_IDS.MAINNET]: true,
          },
          [KnownCaipNamespace.Solana]: {
            [SolScope.Mainnet]: true,
          },
        },
      },
    });

    // Act - publish event
    const mockNetworkConfigs = arrangeMockNetworkConfigurations();
    mocks.globalMessenger.publish(
      'NetworkController:stateChange',
      {
        networkConfigurationsByChainId: mockNetworkConfigs,
        networksMetadata: {},
        selectedNetworkClientId: '1111-1111-1111',
      },
      [],
    );

    // Assert - network order size
    expect(controller.state.orderedNetworkList).toHaveLength(
      Object.keys(mockNetworkConfigs).length,
    );
    expect(controller.state.orderedNetworkList).toStrictEqual([
      { networkId: 'eip155:1' }, // Ethereum
      { networkId: 'eip155:59144' }, // Linea
      { networkId: 'eip155:8453' }, // Base
    ]);
  });

  it('switches network if the NetworkController:stateChange has a selected network that is not in the enabledNetworkMap', async () => {
    const mocks = arrangeMockMessenger();
    const mockNetworkConfigs = arrangeMockNetworkConfigurations();
    const mockNetworkState = {
      networkConfigurationsByChainId: mockNetworkConfigs,
      networksMetadata: {},
      selectedNetworkClientId: '3333-3333-3333', // Base network is not in network enabled map
    };
    mocks.mockNetworkControllerGetState.mockReturnValue(mockNetworkState);

    new NetworkOrderController({
      messenger: mocks.messenger,
      state: {
        orderedNetworkList: [],
        enabledNetworkMap: {
          [KnownCaipNamespace.Eip155]: {
            [CHAIN_IDS.MAINNET]: true,
            [CHAIN_IDS.LINEA_MAINNET]: true,
          },
          [KnownCaipNamespace.Solana]: {
            [SolScope.Mainnet]: true,
          },
        },
      },
    });

    // Act - publish event where base was removed
    mocks.globalMessenger.publish(
      'NetworkController:stateChange',
      mockNetworkState,
      [],
    );

    // Act - switching to an available network (Ethereum)
    await waitFor(() =>
      expect(mocks.mockNetworkControllerSetActiveNetwork).toHaveBeenCalledWith(
        '1111-1111-1111',
      ),
    );
  });
});

function arrangeMockMessenger() {
  const globalMessenger = new Messenger<
    NetworkControllerGetStateAction | NetworkControllerSetActiveNetworkAction,
    NetworkControllerStateChangeEvent | NetworkControllerNetworkRemovedEvent
  >();
  const messenger: NetworkOrderControllerMessenger =
    globalMessenger.getRestricted({
      name: 'NetworkOrderController',
      allowedEvents: [
        'NetworkController:stateChange',
        'NetworkController:networkRemoved',
      ],
      allowedActions: [
        'NetworkController:getState',
        'NetworkController:setActiveNetwork',
      ],
    });

  type AnyFunc = (...args: any[]) => any;
  const typedMockAction = <Action extends { handler: AnyFunc }>() =>
    jest.fn<ReturnType<Action['handler']>, Parameters<Action['handler']>>();

  const mockNetworkControllerGetState =
    typedMockAction<NetworkControllerGetStateAction>().mockReturnValue({
      networkConfigurationsByChainId: {},
      networksMetadata: {},
      selectedNetworkClientId: '111-222-333',
    });

  const mockNetworkControllerSetActiveNetwork =
    typedMockAction<NetworkControllerSetActiveNetworkAction>().mockResolvedValue(
      undefined,
    );

  jest.spyOn(messenger, 'call').mockImplementation((...args) => {
    const [actionType] = args;
    // Type escape hatch as unable to assign correct type.
    const [, ...params]: any[] = args;

    if (actionType === 'NetworkController:getState') {
      return mockNetworkControllerGetState();
    }

    if (actionType === 'NetworkController:setActiveNetwork') {
      return mockNetworkControllerSetActiveNetwork(params[0]);
    }

    throw new Error('TEST FAIL - UNMOCKED ACTION CALLED');
  });

  return {
    globalMessenger,
    messenger,
    mockNetworkControllerGetState,
    mockNetworkControllerSetActiveNetwork,
  };
}

function arrangeMockNetworkConfigurations(): NetworkState['networkConfigurationsByChainId'] {
  return {
    [CHAIN_IDS.MAINNET]: {
      chainId: CHAIN_IDS.MAINNET,
      blockExplorerUrls: [],
      defaultBlockExplorerUrlIndex: 0,
      rpcEndpoints: [
        {
          networkClientId: '1111-1111-1111',
          type: RpcEndpointType.Custom,
          url: '',
        },
      ],
      defaultRpcEndpointIndex: 0,
      name: 'Ethereum',
      nativeCurrency: 'ETH',
    },
    [CHAIN_IDS.LINEA_MAINNET]: {
      chainId: CHAIN_IDS.LINEA_MAINNET,
      blockExplorerUrls: [],
      defaultBlockExplorerUrlIndex: 0,
      rpcEndpoints: [
        {
          networkClientId: '2222-2222-2222',
          type: RpcEndpointType.Custom,
          url: '',
        },
      ],
      defaultRpcEndpointIndex: 0,
      name: 'Linea',
      nativeCurrency: 'ETH',
    },
    [CHAIN_IDS.BASE]: {
      chainId: CHAIN_IDS.BASE,
      blockExplorerUrls: [],
      defaultBlockExplorerUrlIndex: 0,
      rpcEndpoints: [
        {
          networkClientId: '3333-3333-3333',
          type: RpcEndpointType.Custom,
          url: '',
        },
      ],
      defaultRpcEndpointIndex: 0,
      name: 'Base',
      nativeCurrency: 'ETH',
    },
  };
}
