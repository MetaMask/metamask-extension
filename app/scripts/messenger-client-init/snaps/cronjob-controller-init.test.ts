import {
  CronjobController,
  CronjobControllerMessenger,
} from '@metamask/snaps-controllers';
import { MessengerClientInitRequest } from '../types';
import { buildControllerInitRequestMock } from '../test/utils';
import { getCronjobControllerMessenger } from '../messengers/snaps';
import { getRootMessenger } from '../../lib/messenger';
import { CronjobControllerInit } from './cronjob-controller-init';

function getInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<CronjobControllerMessenger>
> {
  const baseMessenger = getRootMessenger<never, never>();

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
    const { messengerClient } = CronjobControllerInit(getInitRequestMock());
    expect(messengerClient).toBeInstanceOf(CronjobController);
  });
});
