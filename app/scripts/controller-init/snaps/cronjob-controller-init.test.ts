import { CronjobController, GetAllSnaps } from '@metamask/snaps-controllers';
import { ControllerMessenger } from '@metamask/base-controller';
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
  const baseControllerMessenger = new ControllerMessenger<GetAllSnaps, never>();

  baseControllerMessenger.registerActionHandler(
    'SnapController:getAll',
    jest.fn().mockReturnValue([]),
  );

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getCronjobControllerMessenger(baseControllerMessenger),
  };

  return requestMock;
}

describe('CronjobControllerInit', () => {
  it('initializes the controller', () => {
    const { controller } = CronjobControllerInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(CronjobController);
  });
});
