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
jest.mock('@metamask/eth-snap-keyring/v2', () => ({
  isSnapKeyring: jest.fn().mockReturnValue(true),
}));

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

  it('uses KeyringController:withKeyringV2 to route requests when withSnapKeyring is invoked', async () => {
    const mockV2Keyring = {
      submitRequest: jest.fn().mockResolvedValue({ result: 'success' }),
      hasAccount: jest.fn().mockReturnValue(true),
    };
    const mockAppStateController = {
      getUnlockPromise: jest.fn().mockResolvedValue(undefined),
    };

    const requestMock = getInitRequestMock();

    jest
      .spyOn(requestMock.initMessenger, 'call')
      .mockImplementation(
        async (_action: unknown, _opts: unknown, callback: unknown) => {
          return (callback as (args: { keyring: unknown }) => Promise<unknown>)(
            { keyring: mockV2Keyring },
          );
        },
      );

    jest
      .mocked(requestMock.getMessengerClient)
      .mockImplementation((name: string) => {
        if (name === 'AppStateController') {
          return mockAppStateController as never;
        }
        throw new Error(`Unexpected messenger client: ${name}`);
      });

    MultichainRoutingServiceInit(requestMock);

    const { withSnapKeyring } = getMultichainRoutingServiceInitArgs();

    const mockRequest = {
      account: '0xabc',
      origin: 'test-origin',
      scope: 'eip155:1' as const,
      method: 'eth_sendTransaction',
      params: [],
    };

    await withSnapKeyring(async ({ keyring }) => {
      await keyring.submitRequest(mockRequest);
    });

    expect(mockAppStateController.getUnlockPromise).toHaveBeenCalledWith(true);
    expect(requestMock.initMessenger.call).toHaveBeenCalledWith(
      'KeyringController:withKeyringV2',
      expect.objectContaining({ filter: expect.any(Function) }),
      expect.any(Function),
    );
    expect(mockV2Keyring.submitRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        origin: mockRequest.origin,
        scope: mockRequest.scope,
        account: mockRequest.account,
        request: {
          method: mockRequest.method,
          params: mockRequest.params,
        },
      }),
    );
  });
});
