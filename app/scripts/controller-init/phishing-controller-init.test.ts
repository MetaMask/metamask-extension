import { Messenger } from '@metamask/base-controller';
import { PhishingController } from '@metamask/phishing-controller';
import { ControllerInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import {
  getPhishingControllerMessenger,
  PhishingControllerMessenger,
} from './messengers';
import { PhishingControllerInit } from './phishing-controller-init';

jest.mock('@metamask/phishing-controller');

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<PhishingControllerMessenger>
> {
  const baseMessenger = new Messenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getPhishingControllerMessenger(baseMessenger),
    initMessenger: undefined,
  };

  return requestMock;
}

describe('PhishingControllerInit', () => {
  it('initializes the controller', () => {
    const { controller } = PhishingControllerInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(PhishingController);
  });

  it('passes the proper arguments to the controller', () => {
    PhishingControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(PhishingController);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      state: undefined,
      hotlistRefreshInterval: 5_000,
      stalelistRefreshInterval: 30_000,
    });
  });
});
