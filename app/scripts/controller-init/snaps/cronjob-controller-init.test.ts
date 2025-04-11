import { Messenger } from '@metamask/base-controller';
import type { GetAllSnaps } from '@metamask/snaps-controllers';
import { CronjobController } from '@metamask/snaps-controllers';

import type { CronjobControllerMessenger } from '../messengers/snaps';
import { getCronjobControllerMessenger } from '../messengers/snaps';
import { buildControllerInitRequestMock } from '../test/utils';
import type { ControllerInitRequest } from '../types';
import { CronjobControllerInit } from './cronjob-controller-init';

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
    initMessenger: undefined,
  };

  return requestMock;
}

describe('CronjobControllerInit', () => {
  it('initializes the controller', () => {
    const { controller } = CronjobControllerInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(CronjobController);
  });
});
