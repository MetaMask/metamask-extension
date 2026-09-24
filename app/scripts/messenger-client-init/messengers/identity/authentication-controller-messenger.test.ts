import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../../lib/messenger';
import {
  getAuthenticationControllerInitMessenger,
  getAuthenticationControllerMessenger,
} from './authentication-controller-messenger';

describe('getAuthenticationControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(messenger, 'delegate');
    const authenticationControllerMessenger =
      getAuthenticationControllerMessenger(messenger);

    expect(authenticationControllerMessenger).toBeInstanceOf(Messenger);
    expect(delegateSpy.mock.calls[0][0].actions).toMatchInlineSnapshot(`
      [
        "KeyringController:getState",
        "KeyringController:withKeyringV2Unsafe",
        "SeedlessOnboardingController:getState",
        "SeedlessOnboardingController:getAccessToken",
      ]
    `);
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

  it('delegates SeedlessOnboardingController:getAccessToken for social identifier pairing', () => {
    const messenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(messenger, 'delegate');

    getAuthenticationControllerMessenger(messenger);

    expect(delegateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        actions: expect.arrayContaining([
          'SeedlessOnboardingController:getAccessToken',
        ]),
      }),
    );
  });

  it('delegates KeyringController:withKeyringV2Unsafe for native SIP-6 signing', () => {
    const messenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(messenger, 'delegate');

    getAuthenticationControllerMessenger(messenger);

    expect(delegateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        actions: expect.arrayContaining([
          'KeyringController:withKeyringV2Unsafe',
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

  it('delegates RemoteFeatureFlagController:getState', () => {
    const messenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(messenger, 'delegate');

    getAuthenticationControllerInitMessenger(messenger);

    expect(delegateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        actions: expect.arrayContaining([
          'RemoteFeatureFlagController:getState',
        ]),
      }),
    );
  });
});
