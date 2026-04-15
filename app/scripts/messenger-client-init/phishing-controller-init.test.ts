import { PhishingController } from '@metamask/phishing-controller';
import { getRootMessenger } from '../lib/messenger';
import { MessengerClientInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import {
  getPhishingControllerMessenger,
  PhishingControllerMessenger,
} from './messengers';
import { PhishingControllerInit } from './phishing-controller-init';

jest.mock('@metamask/phishing-controller');

function getInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<PhishingControllerMessenger>
> {
  const baseMessenger = getRootMessenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getPhishingControllerMessenger(baseMessenger),
    initMessenger: undefined,
  };

  return requestMock;
}

describe('PhishingControllerInit', () => {
  it('initializes the controller', () => {
    const { messengerClient } = PhishingControllerInit(getInitRequestMock());
    expect(messengerClient).toBeInstanceOf(PhishingController);
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
