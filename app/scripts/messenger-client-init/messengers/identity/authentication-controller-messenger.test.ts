import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../../lib/messenger';
import {
  getAuthenticationControllerInitMessenger,
  getAuthenticationControllerMessenger,
} from './authentication-controller-messenger';

describe('getAuthenticationControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const authenticationControllerMessenger =
      getAuthenticationControllerMessenger(messenger);

    expect(authenticationControllerMessenger).toBeInstanceOf(Messenger);
  });

  it('delegates SeedlessOnboardingController:getState for social identifier_type', () => {
    const messenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(messenger, 'delegate');

    getAuthenticationControllerMessenger(messenger);

    expect(delegateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        actions: expect.arrayContaining([
          'SeedlessOnboardingController:getState',
        ]),
      }),
    );
  });
});

describe('getAuthenticationControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const authenticationControllerInitMessenger =
      getAuthenticationControllerInitMessenger(messenger);

    expect(authenticationControllerInitMessenger).toBeInstanceOf(Messenger);
  });
});
