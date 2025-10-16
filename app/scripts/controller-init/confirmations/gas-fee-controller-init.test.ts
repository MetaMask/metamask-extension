import { Messenger } from '@metamask/base-controller';
import { GasFeeController } from '@metamask/gas-fee-controller';
import { ControllerInitRequest } from '../types';
import { buildControllerInitRequestMock } from '../test/utils';
import {
  getGasFeeControllerMessenger,
  GasFeeControllerMessenger,
  getGasFeeControllerInitMessenger,
  GasFeeControllerInitMessenger,
} from '../messengers';
import { GasFeeControllerInit } from './gas-fee-controller-init';

jest.mock('@metamask/gas-fee-controller');

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<
    GasFeeControllerMessenger,
    GasFeeControllerInitMessenger
  >
> {
  const baseMessenger = new Messenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getGasFeeControllerMessenger(baseMessenger),
    initMessenger: getGasFeeControllerInitMessenger(baseMessenger),
  };

  return requestMock;
}

describe('GasFeeControllerInit', () => {
  it('initializes the controller', () => {
    const { controller } = GasFeeControllerInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(GasFeeController);
  });

  it('passes the proper arguments to the controller', () => {
    GasFeeControllerInit(getInitRequestMock());

    expect(GasFeeController).toHaveBeenCalledWith(
      expect.objectContaining({
        messenger: expect.any(Object),
        state: undefined,
        interval: 10_000,
        clientId: 'extension',
        legacyAPIEndpoint: expect.any(String),
        EIP1559APIEndpoint: expect.any(String),
        getProvider: expect.any(Function),
        onNetworkDidChange: expect.any(Function),
        getCurrentNetworkEIP1559Compatibility: expect.any(Function),
        getCurrentAccountEIP1559Compatibility: expect.any(Function),
        getCurrentNetworkLegacyGasAPICompatibility: expect.any(Function),
        getChainId: expect.any(Function),
      }),
    );
  });
});
