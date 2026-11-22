import {
  MultichainRoutingService,
  MultichainRoutingServiceMessenger,
} from '@metamask/snaps-controllers';
import { KeyringType } from '@metamask/keyring-api/v2';
import { EthMethod, EthScope } from '@metamask/keyring-api';
import { MessengerClientInitRequest } from '../types';
import { buildControllerInitRequestMock } from '../test/utils';
import {
  getMultichainRoutingServiceInitMessenger,
  getMultichainRoutingServiceMessenger,
  MultichainRoutingServiceInitMessenger,
} from '../messengers/snaps';
import { getRootMessenger } from '../../lib/messenger';
import {
  MultichainRoutingServiceInit,
  withSnapKeyring,
} from './multichain-routing-service-init';

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
  scope: EthScope.Mainnet,
  method: EthMethod.SignTransaction,
  params: [],
};

function getInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<
    MultichainRoutingServiceMessenger,
    MultichainRoutingServiceInitMessenger
  >
> {
  const baseMessenger = getRootMessenger<never, never>();

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getMultichainRoutingServiceMessenger(baseMessenger),
    initMessenger:
      getMultichainRoutingServiceInitMessenger(
        getRootMessenger<never, never>(),
      ),
  };
}

function getInitMessenger() {
  return getMultichainRoutingServiceInitMessenger(
    getRootMessenger<never, never>(),
  );
}

describe('withSnapKeyring', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses KeyringController:withKeyringV2 to route requests', async () => {
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

    const initMessenger = getInitMessenger();

    jest
      .spyOn(initMessenger, 'call')
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

    await expect(
      withSnapKeyring(
        initMessenger,
        mockAppStateController,
        async ({ keyring }) => keyring.submitRequest(mockRequest),
      ),
    ).resolves.toStrictEqual({ result: 'success' });

    expect(mockAppStateController.getUnlockPromise).toHaveBeenCalledWith(true);
    expect(initMessenger.call).toHaveBeenCalledWith(
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
        id: expect.any(String), // Random UUID.
      }),
    );
  });

  it('does not look up a keyring until the provided operation submits a request', async () => {
    const initMessenger = getInitMessenger();
    const initMessengerCall = jest.spyOn(initMessenger, 'call');

    await expect(
      withSnapKeyring(
        initMessenger,
        mockAppStateController,
        async () => 'operation-result',
      ),
    ).resolves.toBe('operation-result');

    expect(mockAppStateController.getUnlockPromise).toHaveBeenCalledWith(true);
    expect(initMessengerCall).not.toHaveBeenCalled();
  });

  it('throws if the selected keyring is not a v2 Snap keyring', async () => {
    const initMessenger = getInitMessenger();

    jest
      .spyOn(initMessenger, 'call')
      .mockImplementation(async (_action, _options, operation) =>
        (operation as WithKeyringOperation)({
          keyring: { type: KeyringType.Hd },
        }),
      );

    await expect(
      withSnapKeyring(
        initMessenger,
        mockAppStateController,
        async ({ keyring }) => keyring.submitRequest(mockRequest),
      ),
    ).rejects.toThrow('Expected v2 Snap keyring');
    expect(mockAppStateController.getUnlockPromise).toHaveBeenCalledWith(true);
  });

  it('does not run the operation when unlocking fails', async () => {
    const initMessenger = getInitMessenger();
    const unlockError = new Error('locked');
    mockAppStateController.getUnlockPromise.mockRejectedValueOnce(unlockError);

    const operation = jest.fn();
    const initMessengerCall = jest.spyOn(initMessenger, 'call');

    await expect(
      withSnapKeyring(initMessenger, mockAppStateController, operation),
    ).rejects.toThrow(unlockError);
    expect(operation).not.toHaveBeenCalled();
    expect(initMessengerCall).not.toHaveBeenCalled();
  });
});

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

    expect(jest.mocked(MultichainRoutingService)).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      withSnapKeyring: expect.any(Function),
    });
  });
});
