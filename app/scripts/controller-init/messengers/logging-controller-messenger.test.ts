import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import { getLoggingControllerMessenger } from './logging-controller-messenger';

describe('getLoggingControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const loggingControllerMessenger = getLoggingControllerMessenger(messenger);

    expect(loggingControllerMessenger).toBeInstanceOf(Messenger);
  });
});
