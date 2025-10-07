import { MultichainRouter } from '@metamask/snaps-controllers';
import { Messenger } from '@metamask/base-controller';
import { ControllerInitRequest } from '../types';
import { buildControllerInitRequestMock } from '../test/utils';
import {
  MultichainRouterMessenger,
  getMultichainRouterMessenger,
} from '../messengers/snaps';
import { MultichainRouterInit } from './multichain-router-init';

jest.mock('@metamask/snaps-controllers');

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<MultichainRouterMessenger>
> {
  const baseMessenger = new Messenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getMultichainRouterMessenger(baseMessenger),
    initMessenger: undefined,
  };

  return requestMock;
}

describe('MultichainRouterInit', () => {
  it('initializes the multichain router', () => {
    const { controller } = MultichainRouterInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(MultichainRouter);
  });

  it('does not store state', () => {
    const { memStateKey, persistedStateKey } =
      MultichainRouterInit(getInitRequestMock());

    expect(memStateKey).toBeNull();
    expect(persistedStateKey).toBeNull();
  });

  it('passes the proper arguments to the router', () => {
    MultichainRouterInit(getInitRequestMock());

    const controllerMock = jest.mocked(MultichainRouter);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      withSnapKeyring: expect.any(Function),
    });
  });
});
