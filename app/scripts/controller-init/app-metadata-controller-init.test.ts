import { Messenger } from '@metamask/base-controller';
import AppMetadataController from '../controllers/app-metadata';
import { ControllerInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import {
  getAppMetadataControllerMessenger,
  AppMetadataControllerMessenger,
} from './messengers';
import { AppMetadataControllerInit } from './app-metadata-controller-init';

jest.mock('../controllers/app-metadata');

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<AppMetadataControllerMessenger>
> {
  const baseMessenger = new Messenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getAppMetadataControllerMessenger(baseMessenger),
    initMessenger: undefined,
  };

  return requestMock;
}

describe('AppMetadataControllerInit', () => {
  it('initializes the controller', () => {
    const { controller } = AppMetadataControllerInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(AppMetadataController);
  });

  it('passes the proper arguments to the controller', () => {
    AppMetadataControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(AppMetadataController);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      state: undefined,
      currentAppVersion: process.env.METAMASK_VERSION,
      currentMigrationVersion: expect.any(Number),
    });
  });
});
