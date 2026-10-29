import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import { getPhishingControllerMessenger } from './phishing-controller-messenger';

describe('getPhishingControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const phishingControllerMessenger =
      getPhishingControllerMessenger(messenger);

    expect(phishingControllerMessenger).toBeInstanceOf(Messenger);
  });
});
