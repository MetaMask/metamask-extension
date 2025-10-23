import { Messenger } from '@metamask/messenger';
import { getPhishingControllerMessenger } from './phishing-controller-messenger';
import { getRootMessenger } from '.';

describe('getPhishingControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const phishingControllerMessenger =
      getPhishingControllerMessenger(messenger);

    expect(phishingControllerMessenger).toBeInstanceOf(Messenger);
  });
});
