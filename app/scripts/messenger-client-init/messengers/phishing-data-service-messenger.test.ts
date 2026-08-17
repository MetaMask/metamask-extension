import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import { getPhishingDataServiceMessenger } from './phishing-data-service-messenger';

describe('getPhishingDataServiceMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const phishingDataServiceMessenger =
      getPhishingDataServiceMessenger(messenger);

    expect(phishingDataServiceMessenger).toBeInstanceOf(Messenger);
  });
});
