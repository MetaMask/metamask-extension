import {
  RampsController,
  getDefaultRampsControllerState,
  type RampsControllerMessenger,
} from '@metamask/ramps-controller';
import { getRootMessenger } from '../lib/messenger';
import type { MessengerClientInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import { getRampsControllerMessenger } from './messengers';
import { RampsControllerInit } from './ramps-controller-init';

jest.mock('@metamask/ramps-controller', () => {
  const actual = jest.requireActual('@metamask/ramps-controller');
  return {
    ...actual,
    RampsController: jest.fn().mockImplementation(() => ({
      init: jest.fn().mockResolvedValue(undefined),
      startOrderPolling: jest.fn(),
      setUserRegion: jest.fn(),
      setSelectedToken: jest.fn(),
      setSelectedProvider: jest.fn(),
      setSelectedPaymentMethod: jest.fn(),
      getTokens: jest.fn(),
      getProviders: jest.fn(),
      getPaymentMethods: jest.fn(),
      getQuotes: jest.fn(),
      getBuyWidgetData: jest.fn(),
      addPrecreatedOrder: jest.fn(),
      addOrder: jest.fn(),
      removeOrder: jest.fn(),
      getOrder: jest.fn(),
      getOrderFromCallback: jest.fn(),
    })),
  };
});

function getInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<RampsControllerMessenger>
> {
  const baseMessenger = getRootMessenger<never, never>();

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getRampsControllerMessenger(baseMessenger),
    initMessenger: undefined,
    persistedState: {},
  };
}

describe('RampsControllerInit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes the controller with default state', () => {
    const { messengerClient } = RampsControllerInit(getInitRequestMock());
    expect(messengerClient).toBeDefined();
    expect(RampsController).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      state: getDefaultRampsControllerState(),
    });
  });

  it('exposes ramps background API methods', () => {
    const { api } = RampsControllerInit(getInitRequestMock());
    expect(Object.keys(api ?? {}).sort()).toMatchSnapshot();
  });

  it('starts order polling after init resolves', async () => {
    const { messengerClient } = RampsControllerInit(getInitRequestMock());
    await Promise.resolve();
    expect(messengerClient.init).toHaveBeenCalled();
    await Promise.resolve();
    expect(messengerClient.startOrderPolling).toHaveBeenCalled();
  });
});
