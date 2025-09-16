import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import { getRatesControllerMessenger } from './rates-controller-messenger';

describe('getRatesControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const ratesControllerMessenger = getRatesControllerMessenger(messenger);

    expect(ratesControllerMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});
