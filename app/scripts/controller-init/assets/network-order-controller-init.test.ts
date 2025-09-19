import { Messenger } from '@metamask/base-controller';
import { SolScope } from '@metamask/keyring-api';
import { Hex, KnownCaipNamespace } from '@metamask/utils';
import {
  CHAIN_IDS,
  FEATURED_NETWORK_CHAIN_IDS,
} from '../../../../shared/constants/network';
import {
  NetworkOrderController,
  NetworkOrderControllerState,
} from '../../controllers/network-order';
import { getNetworkOrderControllerMessenger } from '../messengers/assets';
import { buildControllerInitRequestMock } from '../test/utils';
import {
  NetworkOrderControllerInit,
  validateAndFixNetworkState,
} from './network-order-controller-init';

// Mock the NetworkOrderController
jest.mock('../../controllers/network-order');

// Mock environment variables
const originalEnv = process.env;

// Mock Type for testing purposes
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockVar = any;

function buildInitRequestMock() {
  const baseControllerMessenger = new Messenger();
  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getNetworkOrderControllerMessenger(
      baseControllerMessenger,
    ),
    initMessenger: undefined,
    getController: jest.fn(),
  };
}

describe('NetworkOrderControllerInit', () => {
  const arrange = () => {
    const NetworkOrderControllerClassMock = jest.mocked(NetworkOrderController);
    const requestMock = buildInitRequestMock();

    const mockState: NetworkOrderControllerState = {
      orderedNetworkList: [],
      enabledNetworkMap: {
        [KnownCaipNamespace.Eip155]: {
          [CHAIN_IDS.MAINNET]: true,
        },
      },
    };

    const mockController = {
      state: mockState,
      setEnabledNetworks: jest.fn(),
      setEnabledNetworksMultichain: jest.fn(),
    };

    const mockNetworkConfigState = {
      networkConfigurationsByChainId: {
        [CHAIN_IDS.MAINNET]: {},
        [CHAIN_IDS.SEPOLIA]: {},
        [CHAIN_IDS.POLYGON]: {},
      },
    };

    // Happy path: network controller with some featured networks configured
    requestMock.getController.mockReturnValue({
      state: mockNetworkConfigState,
    } as MockVar);

    NetworkOrderControllerClassMock.mockReturnValue(mockController as MockVar);

    return {
      NetworkOrderControllerClassMock,
      requestMock,
      mockController,
    };
  };

  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    jest.useRealTimers();
    process.env = originalEnv;
  });

  it('returns controller instance', () => {
    const requestMock = buildInitRequestMock();
    const result = NetworkOrderControllerInit(requestMock);

    expect(result.controller).toBeInstanceOf(NetworkOrderController);
  });

  it('initializes controller with correct messenger and merged state', () => {
    const { requestMock, NetworkOrderControllerClassMock } = arrange();

    NetworkOrderControllerInit(requestMock);

    expect(NetworkOrderControllerClassMock).toHaveBeenCalledWith({
      messenger: requestMock.controllerMessenger,
      state: expect.objectContaining({
        orderedNetworkList: [],
        enabledNetworkMap: expect.objectContaining({
          [KnownCaipNamespace.Eip155]: expect.any(Object),
          [KnownCaipNamespace.Solana]: expect.any(Object),
        }),
      }),
    });
  });

  it('uses development state when in debug mode', () => {
    const { requestMock, NetworkOrderControllerClassMock } = arrange();
    process.env.METAMASK_DEBUG = 'true';
    process.env.METAMASK_ENVIRONMENT = 'development';
    delete process.env.IN_TEST;

    NetworkOrderControllerInit(requestMock);

    expect(NetworkOrderControllerClassMock).toHaveBeenCalledWith({
      messenger: requestMock.controllerMessenger,
      state: expect.objectContaining({
        enabledNetworkMap: {
          [KnownCaipNamespace.Eip155]: {
            [CHAIN_IDS.SEPOLIA]: true,
          },
          [KnownCaipNamespace.Solana]: {
            [SolScope.Mainnet]: true,
          },
        },
      }),
    });
  });

  it('uses production state when not in debug mode', () => {
    const { requestMock, NetworkOrderControllerClassMock } = arrange();

    NetworkOrderControllerInit(requestMock);

    expect(NetworkOrderControllerClassMock).toHaveBeenCalledWith({
      messenger: requestMock.controllerMessenger,
      state: expect.objectContaining({
        enabledNetworkMap: {
          [KnownCaipNamespace.Eip155]: {
            [CHAIN_IDS.MAINNET]: true,
          },
          [KnownCaipNamespace.Solana]: {
            [SolScope.Mainnet]: true,
          },
        },
      }),
    });
  });

  it('schedules network state validation after initialization', () => {
    const { requestMock } = arrange();

    NetworkOrderControllerInit(requestMock);
    jest.runAllTimers();

    expect(requestMock.getController).toHaveBeenCalledWith('NetworkController');
  });

  it('filters popular networks based on network configurations', () => {
    const { requestMock, mockController } = arrange();
    // Setup controller state that will trigger validation
    mockController.state.enabledNetworkMap[KnownCaipNamespace.Eip155] = {
      [CHAIN_IDS.MAINNET]: true,
      [CHAIN_IDS.SEPOLIA]: true,
      // Missing other networks to trigger the fix
    };

    NetworkOrderControllerInit(requestMock);
    jest.runAllTimers();

    // Should call setEnabledNetworks with only the configured featured networks
    const availableNetworks: Hex[] = [
      CHAIN_IDS.MAINNET,
      CHAIN_IDS.SEPOLIA,
      CHAIN_IDS.POLYGON,
    ];
    const expectedNetworks = FEATURED_NETWORK_CHAIN_IDS.filter((chainId) =>
      availableNetworks.includes(chainId),
    );

    expect(mockController.setEnabledNetworks).toHaveBeenCalledWith(
      expectedNetworks,
      KnownCaipNamespace.Eip155,
    );
  });
});

describe('validateAndFixNetworkState', () => {
  const arrange = () => {
    const mockState: NetworkOrderControllerState = {
      orderedNetworkList: [],
      enabledNetworkMap: {
        [KnownCaipNamespace.Eip155]: {
          [CHAIN_IDS.MAINNET]: true,
        },
      },
    };
    const mockController = {
      state: mockState,
      setEnabledNetworks: jest.fn(),
      setEnabledNetworksMultichain: jest.fn(),
    } as unknown as NetworkOrderController;

    return {
      mockController,
    };
  };

  it('does nothing when exactly one EVM network is selected (happy path)', () => {
    const { mockController } = arrange();
    const popularNetworks: Hex[] = [CHAIN_IDS.MAINNET, CHAIN_IDS.SEPOLIA];

    validateAndFixNetworkState(mockController, popularNetworks);

    expect(mockController.setEnabledNetworks).not.toHaveBeenCalled();
  });

  it('sets mainnet when no EVM networks are enabled', () => {
    const { mockController } = arrange();
    mockController.state.enabledNetworkMap = {};
    const popularNetworks: Hex[] = [CHAIN_IDS.MAINNET, CHAIN_IDS.SEPOLIA];

    validateAndFixNetworkState(mockController, popularNetworks);

    expect(mockController.setEnabledNetworks).toHaveBeenCalledWith(
      ['0x1'],
      KnownCaipNamespace.Eip155,
    );
  });

  it('sets mainnet when EVM enabledNetworkMap is missing', () => {
    const { mockController } = arrange();
    delete mockController.state.enabledNetworkMap[KnownCaipNamespace.Eip155];

    const popularNetworks: Hex[] = [CHAIN_IDS.MAINNET, CHAIN_IDS.SEPOLIA];

    validateAndFixNetworkState(mockController, popularNetworks);

    expect(mockController.setEnabledNetworks).toHaveBeenCalledWith(
      ['0x1'],
      KnownCaipNamespace.Eip155,
    );
  });

  it('sets mainnet when no EVM networks are selected', () => {
    const { mockController } = arrange();
    mockController.state.enabledNetworkMap[KnownCaipNamespace.Eip155] = {};
    const popularNetworks: Hex[] = [CHAIN_IDS.MAINNET, CHAIN_IDS.SEPOLIA];

    validateAndFixNetworkState(mockController, popularNetworks);

    expect(mockController.setEnabledNetworks).toHaveBeenCalledWith(
      ['0x1'],
      KnownCaipNamespace.Eip155,
    );
  });

  it('fixes state when multiple networks selected but not all popular networks', () => {
    const { mockController } = arrange();
    mockController.state.enabledNetworkMap[KnownCaipNamespace.Eip155] = {
      [CHAIN_IDS.MAINNET]: true,
      [CHAIN_IDS.SEPOLIA]: true,
      // Missing POLYGON from popular networks
    };
    const popularNetworks: Hex[] = [
      CHAIN_IDS.MAINNET,
      CHAIN_IDS.SEPOLIA,
      CHAIN_IDS.POLYGON,
    ];

    validateAndFixNetworkState(mockController, popularNetworks);

    expect(mockController.setEnabledNetworks).toHaveBeenCalledWith(
      popularNetworks,
      KnownCaipNamespace.Eip155,
    );
  });

  it('fixes state when selected networks do not match popular networks', () => {
    const { mockController } = arrange();
    mockController.state.enabledNetworkMap[KnownCaipNamespace.Eip155] = {
      [CHAIN_IDS.MAINNET]: true,
      [CHAIN_IDS.GOERLI]: true, // Not in popular networks
    };
    const popularNetworks: Hex[] = [CHAIN_IDS.MAINNET, CHAIN_IDS.SEPOLIA];

    validateAndFixNetworkState(mockController, popularNetworks);

    expect(mockController.setEnabledNetworks).toHaveBeenCalledWith(
      popularNetworks,
      KnownCaipNamespace.Eip155,
    );
  });

  it('does nothing when all currently added popular networks are selected', () => {
    const { mockController } = arrange();
    const popularNetworks: Hex[] = [CHAIN_IDS.MAINNET, CHAIN_IDS.SEPOLIA];
    mockController.state.enabledNetworkMap[KnownCaipNamespace.Eip155] = {
      [CHAIN_IDS.MAINNET]: true,
      [CHAIN_IDS.SEPOLIA]: true,
    };

    validateAndFixNetworkState(mockController, popularNetworks);

    expect(mockController.setEnabledNetworks).not.toHaveBeenCalled();
  });

  it('handles empty popular networks array', () => {
    const { mockController } = arrange();
    mockController.state.enabledNetworkMap[KnownCaipNamespace.Eip155] = {
      [CHAIN_IDS.MAINNET]: true,
      [CHAIN_IDS.SEPOLIA]: true,
    };
    const popularNetworks: Hex[] = [];

    validateAndFixNetworkState(mockController, popularNetworks);

    expect(mockController.setEnabledNetworks).toHaveBeenCalledWith(
      [],
      KnownCaipNamespace.Eip155,
    );
  });
});
