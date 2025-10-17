import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import { getPhishingControllerMessenger } from './phishing-controller-messenger';

describe('getPhishingControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const phishingControllerMessenger =
      getPhishingControllerMessenger(messenger);

    expect(phishingControllerMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});
