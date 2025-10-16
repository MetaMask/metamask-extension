import { Messenger } from '@metamask/base-controller';
import SwapsController from '../controllers/swaps';
import { ControllerInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import {
  getSwapsControllerInitMessenger,
  getSwapsControllerMessenger,
  SwapsControllerInitMessenger,
  SwapsControllerMessenger,
} from './messengers';
import { SwapsControllerInit } from './swaps-controller-init';

jest.mock('../controllers/swaps');

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<SwapsControllerMessenger, SwapsControllerInitMessenger>
> {
  const baseMessenger = new Messenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getSwapsControllerMessenger(baseMessenger),
    initMessenger: getSwapsControllerInitMessenger(baseMessenger),
  };

  return requestMock;
}

describe('SwapsControllerInit', () => {
  it('initializes the controller', () => {
    const { controller } = SwapsControllerInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(SwapsController);
  });

  it('passes the proper arguments to the controller', () => {
    SwapsControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(SwapsController);
    expect(controllerMock).toHaveBeenCalledWith(
      {
        messenger: expect.any(Object),
        state: undefined,
        getBufferedGasLimit: expect.any(Function),
        getEIP1559GasFeeEstimates: expect.any(Function),
        getLayer1GasFee: expect.any(Function),
        trackMetaMetricsEvent: expect.any(Function),
      },
      undefined,
    );
  });
});
