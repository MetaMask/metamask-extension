import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import { getLoggingControllerMessenger } from './logging-controller-messenger';

describe('getLoggingControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const loggingControllerMessenger = getLoggingControllerMessenger(messenger);

    expect(loggingControllerMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});
