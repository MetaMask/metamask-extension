import {
  OnboardingController,
  OnboardingControllerMessenger,
} from '../controllers/onboarding';
import { getRootMessenger } from '../lib/messenger';
import { MessengerClientInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import { getOnboardingControllerMessenger } from './messengers';
import { OnboardingControllerInit } from './onboarding-controller-init';

jest.mock('../controllers/onboarding');

function getInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<OnboardingControllerMessenger>
> {
  const baseMessenger = getRootMessenger();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getOnboardingControllerMessenger(baseMessenger),
    initMessenger: undefined,
  };

  return requestMock;
}

describe('OnboardingControllerInit', () => {
  it('initializes the controller', () => {
    const { messengerClient } = OnboardingControllerInit(getInitRequestMock());
    expect(messengerClient).toBeInstanceOf(OnboardingController);
  });

  it('passes the proper arguments to the controller', () => {
    OnboardingControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(OnboardingController);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      state: undefined,
    });
  });
});
