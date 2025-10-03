import { Messenger } from '@metamask/base-controller';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import {
  NetworkOrderController,
  NetworkOrderControllerState,
} from '../../controllers/network-order';
import { getNetworkOrderControllerMessenger } from '../messengers/assets';
import { buildControllerInitRequestMock } from '../test/utils';
import { NetworkOrderControllerInit } from './network-order-controller-init';

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
    };

    const mockController = {
      state: mockState,
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
      state: expect.objectContaining({}),
    });
  });

  it('uses production state when not in debug mode', () => {
    const { requestMock, NetworkOrderControllerClassMock } = arrange();

    NetworkOrderControllerInit(requestMock);

    expect(NetworkOrderControllerClassMock).toHaveBeenCalledWith({
      messenger: requestMock.controllerMessenger,
      state: expect.objectContaining({}),
    });
  });
});
