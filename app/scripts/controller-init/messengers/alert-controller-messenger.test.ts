import { Messenger } from '@metamask/messenger';
import { getAlertControllerMessenger } from './alert-controller-messenger';
import { getRootMessenger } from '.';

describe('getAlertControllerMessenger', () => {
  it('returns a controller messenger', () => {
    const messenger = getRootMessenger();
    const alertControllerMessenger = getAlertControllerMessenger(messenger);

    expect(alertControllerMessenger).toBeInstanceOf(Messenger);
  });
});
