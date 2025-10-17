import { Messenger } from '@metamask/base-controller';
import { AnnouncementController } from '@metamask/announcement-controller';
import { UI_NOTIFICATIONS } from '../../../shared/notifications';
import { ControllerInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import {
  getAnnouncementControllerMessenger,
  AnnouncementControllerMessenger,
} from './messengers';
import { AnnouncementControllerInit } from './announcement-controller-init';

jest.mock('@metamask/announcement-controller');

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<AnnouncementControllerMessenger>
> {
  const baseMessenger = new Messenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getAnnouncementControllerMessenger(baseMessenger),
    initMessenger: undefined,
  };

  return requestMock;
}

describe('AnnouncementControllerInit', () => {
  it('initializes the controller', () => {
    const { controller } = AnnouncementControllerInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(AnnouncementController);
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
