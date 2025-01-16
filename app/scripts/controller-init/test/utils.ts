import {
  BaseControllerMessenger,
  BaseRestrictedControllerMessenger,
  ControllerInitRequest,
} from '../types';

export const CHAIN_ID_MOCK = '0x123';

export function buildControllerMessengerMock(
  recurse = true,
): jest.Mocked<BaseControllerMessenger> {
  return {
    call: jest.fn(),
    getRestricted: jest
      .fn()
      .mockReturnValue(recurse ? buildControllerMessengerMock(false) : {}),
    publish: jest.fn(),
    registerActionHandler: jest.fn(),
    registerInitialEventPayload: jest.fn(),
    subscribe: jest.fn(),
  } as unknown as jest.Mocked<BaseControllerMessenger>;
}

export function buildControllerInitRequestMock() {
  return {
    baseControllerMessenger: buildControllerMessengerMock(),
    getController: jest.fn(),
    getGlobalChainId: jest.fn().mockReturnValue(CHAIN_ID_MOCK),
    getPermittedAccounts: jest.fn(),
    getProvider: jest.fn(),
    getTransactionMetricsRequest: jest.fn(),
    persistedState: {},
  } as unknown as jest.Mocked<ControllerInitRequest>;
}

export function expectValidMessengerCallback(
  callback: (
    messenger: BaseControllerMessenger,
  ) => BaseRestrictedControllerMessenger,
) {
  const controllerMessengerMock = buildControllerMessengerMock();

  expect(callback).toBeInstanceOf(Function);

  callback(controllerMessengerMock);

  expect(controllerMessengerMock.getRestricted).toHaveBeenCalled();
}
