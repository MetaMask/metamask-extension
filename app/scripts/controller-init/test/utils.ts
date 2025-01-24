import {
  BaseRestrictedControllerMessenger,
  ControllerInitRequest,
} from '../types';

export const CHAIN_ID_MOCK = '0x123';

export function buildControllerInitRequestMock(): jest.Mocked<
  Omit<
    ControllerInitRequest<
      BaseRestrictedControllerMessenger,
      BaseRestrictedControllerMessenger
    >,
    'controllerMessenger' | 'initMessenger'
  >
> {
  return {
    getController: jest.fn(),
    getFlatState: jest.fn(),
    getGlobalChainId: jest.fn().mockReturnValue(CHAIN_ID_MOCK),
    getPermittedAccounts: jest.fn(),
    getProvider: jest.fn(),
    getTransactionMetricsRequest: jest.fn(),
    persistedState: {},
  };
}
