import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import { getAppStateControllerMessenger } from './app-state-controller-messenger';

describe('getAppStateControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const appStateControllerMessenger =
      getAppStateControllerMessenger(messenger);

    expect(appStateControllerMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});
