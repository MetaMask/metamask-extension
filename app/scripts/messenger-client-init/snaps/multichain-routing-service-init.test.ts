import {
  MultichainRoutingService,
  MultichainRoutingServiceMessenger,
} from '@metamask/snaps-controllers';
import { KeyringType } from '@metamask/keyring-api/v2';
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

type WithKeyringOptions = {
  filter: (keyring: unknown) => boolean;
};

type WithKeyringOperation = (args: { keyring: unknown }) => Promise<unknown>;

const mockAppStateController = {
  getUnlockPromise: jest.fn().mockResolvedValue(undefined),
};

const mockRequest = {
  account: '0xabc',
  origin: 'test-origin',
  scope: 'eip155:1' as const,
  method: 'eth_sendTransaction',
  params: [],
};

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

function mockGetMessengerClient(
  requestMock: jest.Mocked<
    MessengerClientInitRequest<
      MultichainRoutingServiceMessenger,
      MultichainRoutingServiceInitMessenger
    >
  >,
) {
  jest.mocked(requestMock.getMessengerClient).mockImplementation((name) => {
    if (name === 'AppStateController') {
      return mockAppStateController as never;
    }
    throw new Error(`Unexpected messenger client: ${name}`);
  });
}

describe('MultichainRoutingServiceInit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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
      type: KeyringType.Snap,
      submitRequest: jest.fn().mockResolvedValue({ result: 'success' }),
      hasAccount: jest.fn().mockReturnValue(true),
    };
    const mockOtherSnapKeyring = {
      type: KeyringType.Snap,
      hasAccount: jest.fn().mockReturnValue(false),
    };
    const mockNonSnapKeyring = {
      type: KeyringType.Hd,
      hasAccount: jest.fn(),
    };

    const requestMock = getInitRequestMock();
    mockGetMessengerClient(requestMock);

    jest
      .spyOn(requestMock.initMessenger, 'call')
      .mockImplementation(
        async (action: unknown, options: unknown, operation: unknown) => {
          expect(action).toBe('KeyringController:withKeyringV2');

          const { filter } = options as WithKeyringOptions;
          expect(filter(mockV2Keyring)).toBe(true);
          expect(filter(mockOtherSnapKeyring)).toBe(false);
          expect(filter(mockNonSnapKeyring)).toBe(false);
          expect(mockNonSnapKeyring.hasAccount).not.toHaveBeenCalled();

          return (operation as WithKeyringOperation)({
            keyring: mockV2Keyring,
          });
        },
      );

    MultichainRoutingServiceInit(requestMock);

    const { withSnapKeyring } = getMultichainRoutingServiceInitArgs();

    await expect(
      withSnapKeyring(async ({ keyring }) =>
        keyring.submitRequest(mockRequest),
      ),
    ).resolves.toStrictEqual({ result: 'success' });

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
        id: '',
      }),
    );
  });

  it('does not look up a keyring until the provided operation submits a request', async () => {
    const requestMock = getInitRequestMock();
    mockGetMessengerClient(requestMock);

    const initMessengerCall = jest.spyOn(requestMock.initMessenger, 'call');

    MultichainRoutingServiceInit(requestMock);

    const { withSnapKeyring } = getMultichainRoutingServiceInitArgs();

    await expect(withSnapKeyring(async () => 'operation-result')).resolves.toBe(
      'operation-result',
    );

    expect(mockAppStateController.getUnlockPromise).toHaveBeenCalledWith(true);
    expect(initMessengerCall).not.toHaveBeenCalled();
  });

  it('throws if the selected keyring is not a v2 Snap keyring', async () => {
    const requestMock = getInitRequestMock();
    mockGetMessengerClient(requestMock);

    jest
      .spyOn(requestMock.initMessenger, 'call')
      .mockImplementation(async (_action, _options, operation) =>
        (operation as WithKeyringOperation)({
          keyring: { type: KeyringType.Hd },
        }),
      );

    MultichainRoutingServiceInit(requestMock);

    const { withSnapKeyring } = getMultichainRoutingServiceInitArgs();

    await expect(
      withSnapKeyring(async ({ keyring }) =>
        keyring.submitRequest(mockRequest),
      ),
    ).rejects.toThrow('Expected v2 Snap keyring');
    expect(mockAppStateController.getUnlockPromise).toHaveBeenCalledWith(true);
  });

  it('does not run the operation when unlocking fails', async () => {
    const requestMock = getInitRequestMock();
    const unlockError = new Error('locked');
    mockAppStateController.getUnlockPromise.mockRejectedValueOnce(unlockError);
    mockGetMessengerClient(requestMock);

    const operation = jest.fn();
    const initMessengerCall = jest.spyOn(requestMock.initMessenger, 'call');

    MultichainRoutingServiceInit(requestMock);

    const { withSnapKeyring } = getMultichainRoutingServiceInitArgs();

    await expect(withSnapKeyring(operation)).rejects.toThrow(unlockError);
    expect(operation).not.toHaveBeenCalled();
    expect(initMessengerCall).not.toHaveBeenCalled();
  });
});
