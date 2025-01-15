import { Controller } from '../controller-list';
import {
  BaseControllerMessenger,
  BaseRestrictedControllerMessenger,
  ControllerGetApiRequest,
  ControllerInitRequest,
} from '../types';

export const CHAIN_ID_MOCK = '0x123';

export function buildControllerMessengerMock() {
  return {
    call: jest.fn(),
    getRestricted: jest.fn().mockReturnValue({}),
    publish: jest.fn(),
    registerActionHandler: jest.fn(),
    registerInitialEventPayload: jest.fn(),
    subscribe: jest.fn(),
  } as unknown as jest.Mocked<BaseControllerMessenger>;
}

export function buildControllerInitRequestMock<
  ControllerMessengerType extends BaseRestrictedControllerMessenger,
  InitControllerMessengerType extends BaseRestrictedControllerMessenger,
>() {
  return {
    controllerMessenger: buildControllerMessengerMock(),
    getController: jest.fn(),
    getGlobalChainId: jest.fn().mockReturnValue(CHAIN_ID_MOCK),
    getPermittedAccounts: jest.fn(),
    getProvider: jest.fn(),
    getTransactionMetricsRequest: jest.fn(),
    initMessenger: buildControllerMessengerMock(),
    persistedState: {},
  } as unknown as jest.Mocked<
    ControllerInitRequest<ControllerMessengerType, InitControllerMessengerType>
  >;
}

export function buildControllerGetApiRequestMock<
  ControllerType extends Controller,
>() {
  return {
    controller: jest.fn() as unknown as ControllerType,
    getFlatState: jest.fn(),
  } as unknown as jest.Mocked<ControllerGetApiRequest<ControllerType>>;
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
