import { Messenger } from '@metamask/base-controller';
import { RatesController } from '@metamask/assets-controllers';
import { ControllerInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import {
  getRatesControllerMessenger,
  RatesControllerMessenger,
} from './messengers';
import { RatesControllerInit } from './rates-controller-init';

jest.mock('@metamask/assets-controllers');

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<RatesControllerMessenger>
> {
  const baseMessenger = new Messenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getRatesControllerMessenger(baseMessenger),
    initMessenger: undefined,
  };

  return requestMock;
}

describe('RatesControllerInit', () => {
  it('initializes the controller', () => {
    const { controller } = RatesControllerInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(RatesController);
  });

  it('passes the proper arguments to the controller', () => {
    RatesControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(RatesController);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      state: undefined,
      includeUsdRate: true,
    });
  });
});
