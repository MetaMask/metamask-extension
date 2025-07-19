import { CronjobController } from '@metamask/snaps-controllers';
import { Messenger } from '@metamask/base-controller';
import { ControllerInitRequest } from '../types';
import { buildControllerInitRequestMock } from '../test/utils';
import {
  CronjobControllerMessenger,
  getCronjobControllerMessenger,
} from '../messengers/snaps';
import { CronjobControllerInit } from './cronjob-controller-init';

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<CronjobControllerMessenger>
> {
  const baseMessenger = new Messenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getCronjobControllerMessenger(baseMessenger),
    initMessenger: undefined,
    getCronjobControllerStorageManager: jest.fn().mockImplementation(() => {
      return {
        getInitialState: jest.fn(),
        init: jest.fn(),
        set: jest.fn(),
      };
    }),
  };

  return requestMock;
}

describe('CronjobControllerInit', () => {
  it('initializes the controller', () => {
    const { controller } = CronjobControllerInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(CronjobController);
  });
});
