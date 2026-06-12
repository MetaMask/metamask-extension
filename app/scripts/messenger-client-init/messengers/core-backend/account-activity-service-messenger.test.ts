import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../../lib/messenger';
import { getAccountActivityServiceMessenger } from './account-activity-service-messenger';

describe('getAccountActivityServiceMessenger', () => {
  it('returns a restricted controller messenger', () => {
    const controllerMessenger = getRootMessenger<never, never>();
    const messenger = getAccountActivityServiceMessenger(controllerMessenger);

    expect(messenger).toBeInstanceOf(Messenger);
    expect(messenger).toBeDefined();
  });
});
