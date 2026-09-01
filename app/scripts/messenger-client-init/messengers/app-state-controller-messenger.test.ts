import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import { getAppStateControllerMessenger } from './app-state-controller-messenger';

describe('getAppStateControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger();
    const appStateControllerMessenger =
      getAppStateControllerMessenger(messenger);

    expect(appStateControllerMessenger).toBeInstanceOf(Messenger);
  });
});
