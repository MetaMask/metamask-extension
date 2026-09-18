import {
  CodefiTokenPricesServiceV2,
  CurrencyRateController,
  CurrencyRateMessenger,
} from '@metamask/assets-controllers';
import { getRootMessenger } from '../lib/messenger';
import { MessengerClientInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import {
  getCurrencyRateControllerMessenger,
  getCurrencyRateControllerInitMessenger,
  CurrencyRateControllerInitMessenger,
} from './messengers';
import { CurrencyRateControllerInit } from './currency-rate-controller-init';

jest.mock('@metamask/assets-controllers', () => ({
  CurrencyRateController: class {
    // This is needed since the controller init tries to override this function.
    fetchMultiExchangeRate = jest.fn();
  },
  CodefiTokenPricesServiceV2: class {
    fetchTokenPrices = jest.fn();

    fetchExchangeRates = jest.fn();

    validateChainIdSupported = jest.fn();

    validateCurrencySupported = jest.fn();
  },
}));

function getInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<
    CurrencyRateMessenger,
    CurrencyRateControllerInitMessenger
  >
> {
  const baseMessenger = getRootMessenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getCurrencyRateControllerMessenger(baseMessenger),
    initMessenger: getCurrencyRateControllerInitMessenger(baseMessenger),
    tokenPricesService: new CodefiTokenPricesServiceV2(),
  };

  return requestMock;
}

describe('CurrencyRateControllerInit', () => {
  it('initializes the controller', () => {
    const { messengerClient } =
      CurrencyRateControllerInit(getInitRequestMock());
    expect(messengerClient).toBeInstanceOf(CurrencyRateController);
  });
});
