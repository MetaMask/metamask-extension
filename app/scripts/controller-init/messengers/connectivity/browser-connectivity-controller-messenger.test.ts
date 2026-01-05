import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../../lib/messenger';
import { getBrowserConnectivityControllerMessenger } from './browser-connectivity-controller-messenger';

describe('getBrowserConnectivityControllerMessenger', () => {
  it('returns a messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const browserConnectivityControllerMessenger =
      getBrowserConnectivityControllerMessenger(messenger);

    expect(browserConnectivityControllerMessenger).toBeInstanceOf(Messenger);
  });
});
