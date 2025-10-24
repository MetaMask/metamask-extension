import { Messenger } from '@metamask/messenger';
import { getAppStateControllerMessenger } from './app-state-controller-messenger';
import { getRootMessenger } from '../../lib/messenger';

describe('getAppStateControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger();
    const appStateControllerMessenger =
      getAppStateControllerMessenger(messenger);

    expect(appStateControllerMessenger).toBeInstanceOf(Messenger);
  });
});
