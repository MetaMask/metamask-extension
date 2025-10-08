import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import type { PreferencesControllerGetStateAction } from '../../controllers/preferences-controller';
import { getRewardsDataServiceMessenger } from './reward-data-service-messenger';

describe('getRewardsDataServiceMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<
      PreferencesControllerGetStateAction,
      never
    >();
    const rewardsDataServiceMessenger =
      getRewardsDataServiceMessenger(messenger);

    expect(rewardsDataServiceMessenger).toBeInstanceOf(RestrictedMessenger);
  });

  it('allows PreferencesController:getState action', () => {
    const baseMessenger = new Messenger<
      PreferencesControllerGetStateAction,
      never
    >();

    // Register a mock handler for PreferencesController:getState
    baseMessenger.registerActionHandler(
      'PreferencesController:getState',
      () => ({ currentLocale: 'en-US' }) as never,
    );

    const restrictedMessenger = getRewardsDataServiceMessenger(baseMessenger);

    // This should not throw since PreferencesController:getState is allowed
    expect(() => {
      restrictedMessenger.call('PreferencesController:getState');
    }).not.toThrow();
  });
});
