import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import { getAnnouncementControllerMessenger } from './announcement-controller-messenger';

describe('getAnnouncementControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const announcementControllerMessenger =
      getAnnouncementControllerMessenger(messenger);

    expect(announcementControllerMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});
