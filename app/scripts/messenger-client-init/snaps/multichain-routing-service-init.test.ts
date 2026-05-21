import {
  MultichainRoutingService,
  MultichainRoutingServiceMessenger,
} from '@metamask/snaps-controllers';
import { MessengerClientInitRequest } from '../types';
import { buildControllerInitRequestMock } from '../test/utils';
import {
  getMultichainRoutingServiceInitMessenger,
  getMultichainRoutingServiceMessenger,
  MultichainRoutingServiceInitMessenger,
} from '../messengers/snaps';
import { getRootMessenger } from '../../lib/messenger';
import { MultichainRoutingServiceInit } from './multichain-routing-service-init';

jest.mock('@metamask/snaps-controllers');

function getInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<
    MultichainRoutingServiceMessenger,
    MultichainRoutingServiceInitMessenger
  >
> {
  const baseMessenger = getRootMessenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getMultichainRoutingServiceMessenger(baseMessenger),
    initMessenger:
      getMultichainRoutingServiceInitMessenger(
        getRootMessenger<never, never>(),
      ),
  };

  return requestMock;
}

function getMultichainRoutingServiceInitArgs() {
  const mockedCtorCall = jest
    .mocked(MultichainRoutingService)
    .mock.calls.at(-1);

  if (!mockedCtorCall) {
    throw new Error('MultichainRoutingService constructor was not called');
  }

  return mockedCtorCall[0] as ConstructorParameters<
    typeof MultichainRoutingService
  >[0];
}

describe('MultichainRoutingServiceInit', () => {
  it('initializes the multichain router', () => {
    const { messengerClient } =
      MultichainRoutingServiceInit(getInitRequestMock());
    expect(messengerClient).toBeInstanceOf(MultichainRoutingService);
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

  it('uses getLegacySnapKeyring to obtain the keyring when withSnapKeyring is invoked', async () => {
    const mockKeyring = {};
    const mockSnapAccountService = {
      getLegacySnapKeyring: jest.fn().mockResolvedValue(mockKeyring),
    };
    const mockAppStateController = {
      getUnlockPromise: jest.fn().mockResolvedValue(undefined),
    };

    const requestMock = getInitRequestMock();
    jest
      .mocked(requestMock.getMessengerClient)
      .mockImplementation((name: string) => {
        if (name === 'SnapAccountService') {
          return mockSnapAccountService as never;
        }
        if (name === 'AppStateController') {
          return mockAppStateController as never;
        }
        throw new Error(`Unexpected messenger client: ${name}`);
      });

    MultichainRoutingServiceInit(requestMock);

    const { withSnapKeyring } = getMultichainRoutingServiceInitArgs();

    const operation = jest.fn();
    await withSnapKeyring(operation);

    expect(mockAppStateController.getUnlockPromise).toHaveBeenCalledWith(true);
    expect(mockSnapAccountService.getLegacySnapKeyring).toHaveBeenCalled();
    expect(operation).toHaveBeenCalledWith({ keyring: mockKeyring });
  });
});
