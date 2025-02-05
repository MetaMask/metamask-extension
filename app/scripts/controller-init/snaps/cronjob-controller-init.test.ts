import { CronjobController, GetAllSnaps } from '@metamask/snaps-controllers';
import { Messenger } from '@metamask/base-controller';
import { ControllerInitRequest } from '../types';
import { buildControllerInitRequestMock } from '../test/utils';
import { CronjobControllerInit } from './cronjob-controller-init';
import {
  CronjobControllerMessenger,
  getCronjobControllerMessenger,
} from './cronjob-controller-messenger';

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<CronjobControllerMessenger>
> {
  const baseMessenger = new Messenger<GetAllSnaps, never>();

  baseMessenger.registerActionHandler(
    'SnapController:getAll',
    jest.fn().mockReturnValue([]),
  );

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getCronjobControllerMessenger(baseMessenger),
  };

  return requestMock;
}

describe('CronjobControllerInit', () => {
  it('initializes the controller', () => {
    const { controller } = CronjobControllerInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(CronjobController);
  });
});
