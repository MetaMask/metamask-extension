import {
  MultichainRoutingService,
  MultichainRoutingServiceMessenger,
} from '@metamask/snaps-controllers';
import { ControllerInitRequest } from '../types';
import { buildControllerInitRequestMock } from '../test/utils';
import { getMultichainRoutingServiceMessenger } from '../messengers/snaps';
import { getRootMessenger } from '../../lib/messenger';
import { MultichainRoutingServiceInit } from './multichain-routing-service-init';

jest.mock('@metamask/snaps-controllers');

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<MultichainRoutingServiceMessenger>
> {
  const baseMessenger = getRootMessenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getMultichainRoutingServiceMessenger(baseMessenger),
    initMessenger: undefined,
  };

  return requestMock;
}

describe('MultichainRoutingServiceInit', () => {
  it('initializes the multichain router', () => {
    const { controller } = MultichainRoutingServiceInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(MultichainRoutingService);
  });

  it('does not store state', () => {
    const { memStateKey, persistedStateKey } =
      MultichainRoutingServiceInit(getInitRequestMock());

    expect(memStateKey).toBeNull();
    expect(persistedStateKey).toBeNull();
  });

  it('passes the proper arguments to the router', () => {
    MultichainRoutingServiceInit(getInitRequestMock());

    const controllerMock = jest.mocked(MultichainRoutingService);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      withSnapKeyring: expect.any(Function),
    });
  });
});
