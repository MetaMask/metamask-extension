import { Messenger } from '@metamask/base-controller';
import OnboardingController from '../controllers/onboarding';
import { ControllerInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import {
  getOnboardingControllerMessenger,
  OnboardingControllerMessenger,
} from './messengers';
import { OnboardingControllerInit } from './onboarding-controller-init';

jest.mock('../controllers/onboarding');

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<OnboardingControllerMessenger>
> {
  const baseMessenger = new Messenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getOnboardingControllerMessenger(baseMessenger),
    initMessenger: undefined,
  };

  return requestMock;
}

describe('OnboardingControllerInit', () => {
  it('initializes the controller', () => {
    const { controller } = OnboardingControllerInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(OnboardingController);
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
