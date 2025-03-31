import {
  TokenRatesController,
  TokenRatesControllerMessenger,
} from '@metamask/assets-controllers';
import { Messenger } from '@metamask/base-controller';
import { buildControllerInitRequestMock } from '../test/utils';
import { ControllerInitRequest } from '../types';
import { getTokenRatesControllerMessenger } from '../messengers/assets';
import { TokenRatesControllerInit } from './token-rates-controller-init';

jest.mock('@metamask/assets-controllers');

function buildInitRequestMock(): jest.Mocked<
  ControllerInitRequest<TokenRatesControllerMessenger>
> {
  const baseControllerMessenger = new Messenger();

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getTokenRatesControllerMessenger(
      baseControllerMessenger,
    ),
    initMessenger: undefined,
  };
}

describe('TokenRatesControllerInit', () => {
  const tokenRatesControllerClassMock = jest.mocked(TokenRatesController);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns controller instance', () => {
    const requestMock = buildInitRequestMock();
    expect(TokenRatesControllerInit(requestMock).controller).toBeInstanceOf(
      TokenRatesController,
    );
  });

  it('initializes with correct messenger and state', () => {
    const requestMock = buildInitRequestMock();
    TokenRatesControllerInit(requestMock);

    expect(tokenRatesControllerClassMock).toHaveBeenCalled();
  });
});
