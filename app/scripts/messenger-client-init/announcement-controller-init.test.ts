import { AnnouncementController } from '@metamask/announcement-controller';
import { UI_NOTIFICATIONS } from '../../../shared/notifications';
import { getRootMessenger } from '../lib/messenger';
import { MessengerClientInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import {
  getAnnouncementControllerMessenger,
  AnnouncementControllerMessenger,
} from './messengers';
import { AnnouncementControllerInit } from './announcement-controller-init';

jest.mock('@metamask/announcement-controller');

function getInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<AnnouncementControllerMessenger>
> {
  const baseMessenger = getRootMessenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getAnnouncementControllerMessenger(baseMessenger),
    initMessenger: undefined,
  };

  return requestMock;
}

describe('AnnouncementControllerInit', () => {
  it('initializes the controller', () => {
    const { messengerClient } =
      AnnouncementControllerInit(getInitRequestMock());
    expect(messengerClient).toBeInstanceOf(AnnouncementController);
  });

  it('passes the proper arguments to the controller', () => {
    AnnouncementControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(AnnouncementController);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      state: undefined,
      allAnnouncements: UI_NOTIFICATIONS,
    });
  });
});
