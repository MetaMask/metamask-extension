import { Messenger } from '@metamask/base-controller';
import { CurrencyRateController } from '@metamask/assets-controllers';
import { ControllerInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import {
  getCurrencyRateControllerMessenger,
  CurrencyRateControllerMessenger,
  getCurrencyRateControllerInitMessenger,
  CurrencyRateControllerInitMessenger,
} from './messengers';
import { CurrencyRateControllerInit } from './currency-rate-controller-init';

jest.mock('@metamask/assets-controllers', () => ({
  CurrencyRateController: class {
    // This is needed since the controller init tries to override this function.
    fetchMultiExchangeRate = jest.fn();
  },
}));

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<
    CurrencyRateControllerMessenger,
    CurrencyRateControllerInitMessenger
  >
> {
  const baseMessenger = new Messenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getCurrencyRateControllerMessenger(baseMessenger),
    initMessenger: getCurrencyRateControllerInitMessenger(baseMessenger),
  };

  return requestMock;
}

describe('CurrencyRateControllerInit', () => {
  it('initializes the controller', () => {
    const { controller } = CurrencyRateControllerInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(CurrencyRateController);
  });
});
