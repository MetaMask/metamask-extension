import { Messenger } from '@metamask/base-controller';
import { TokenDetectionController } from '@metamask/assets-controllers';
import { ControllerInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import {
  getTokenDetectionControllerInitMessenger,
  getTokenDetectionControllerMessenger,
  TokenDetectionControllerInitMessenger,
  TokenDetectionControllerMessenger,
} from './messengers';
import { TokenDetectionControllerInit } from './token-detection-controller-init';

jest.mock('@metamask/assets-controllers');

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<
    TokenDetectionControllerMessenger,
    TokenDetectionControllerInitMessenger
  >
> {
  const baseMessenger = new Messenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getTokenDetectionControllerMessenger(baseMessenger),
    initMessenger: getTokenDetectionControllerInitMessenger(baseMessenger),
  };

  return requestMock;
}

describe('TokenDetectionControllerInit', () => {
  it('initializes the controller', () => {
    const { controller } = TokenDetectionControllerInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(TokenDetectionController);
  });

  it('passes the proper arguments to the controller', () => {
    TokenDetectionControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(TokenDetectionController);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      state: undefined,
      getBalancesInSingleCall: expect.any(Function),
      trackMetaMetricsEvent: expect.any(Function),
      useExternalServices: expect.any(Function),
      useTokenDetection: expect.any(Function),
      platform: 'extension',
      useAccountsAPI: true,
    });
  });
});
