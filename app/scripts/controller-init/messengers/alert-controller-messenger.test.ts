import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import { getAlertControllerMessenger } from './alert-controller-messenger';

describe('getAlertControllerMessenger', () => {
  it('returns a controller messenger', () => {
    const messenger = getRootMessenger();
    const alertControllerMessenger = getAlertControllerMessenger(messenger);

    expect(alertControllerMessenger).toBeInstanceOf(Messenger);
  });
});
