import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import { getAnnouncementControllerMessenger } from './announcement-controller-messenger';

describe('getAnnouncementControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const announcementControllerMessenger =
      getAnnouncementControllerMessenger(messenger);

    expect(announcementControllerMessenger).toBeInstanceOf(Messenger);
  });
});
