import {
  MOCK_ANY_NAMESPACE,
  Messenger,
  MockAnyNamespace,
} from '@metamask/messenger';
import type { PreferencesControllerGetStateAction } from '../../controllers/preferences-controller';
import { getRootMessenger } from '../../lib/messenger';
import { getRewardsDataServiceMessenger } from './reward-data-service-messenger';

describe('getRewardsDataServiceMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<
      PreferencesControllerGetStateAction,
      never
    >();
    const rewardsDataServiceMessenger =
      getRewardsDataServiceMessenger(messenger);

    expect(rewardsDataServiceMessenger).toBeInstanceOf(Messenger);
  });

  it('allows PreferencesController:getState action', () => {
    const baseMessenger = new Messenger<
      MockAnyNamespace,
      PreferencesControllerGetStateAction,
      never
    >({ namespace: MOCK_ANY_NAMESPACE });

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
