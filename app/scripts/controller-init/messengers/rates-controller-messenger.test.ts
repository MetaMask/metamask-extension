import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import { getRatesControllerMessenger } from './rates-controller-messenger';

describe('getRatesControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const ratesControllerMessenger = getRatesControllerMessenger(messenger);

    expect(ratesControllerMessenger).toBeInstanceOf(Messenger);
  });
});
