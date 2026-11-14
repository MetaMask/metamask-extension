import {
  SnapController,
  SnapControllerMessenger,
  WebSocketServiceCloseAction,
  WebSocketServiceGetAllAction,
} from '@metamask/snaps-controllers';
import {
  MOCK_ANY_NAMESPACE,
  Messenger,
  MockAnyNamespace,
} from '@metamask/messenger';
import {
  KeyringControllerLockEvent,
  KeyringControllerUnlockEvent,
} from '@metamask/keyring-controller';
import {
  createDeferredPromise,
  inMilliseconds,
  Duration,
} from '@metamask/utils';
import { MessengerClientInitRequest } from '../types';
import { buildControllerInitRequestMock } from '../test/utils';
import {
  getSnapControllerInitMessenger,
  getSnapControllerMessenger,
  SnapControllerInitMessenger,
} from '../messengers/snaps';
import { getRootMessenger } from '../../lib/messenger';
import {
  getDefaultPreferencesControllerState,
  PreferencesControllerGetStateAction,
  PreferencesControllerStateChangeEvent,
} from '../../controllers/preferences-controller';
import { SnapControllerInit } from './snap-controller-init';

jest.mock('@metamask/snaps-controllers');

function getInitRequestMock(
  baseMessenger = getRootMessenger(),
): jest.Mocked<
  MessengerClientInitRequest<
    SnapControllerMessenger,
    SnapControllerInitMessenger
  >
> {
  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getSnapControllerMessenger(baseMessenger),
    initMessenger: getSnapControllerInitMessenger(baseMessenger),
    preinstalledSnaps: [],
  };

  return requestMock;
}

describe('SnapControllerInit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes the controller', () => {
    const { messengerClient } = SnapControllerInit(getInitRequestMock());
    expect(messengerClient).toBeInstanceOf(SnapController);
  });

  it('passes the proper arguments to the controller', () => {
    SnapControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(SnapController);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      maxIdleTime: inMilliseconds(2, Duration.Minute),
      state: undefined,
      encryptor: expect.any(Object),
      environmentEndowmentPermissions: expect.any(Array),
      excludedPermissions: expect.any(Object),
      featureFlags: {
        allowLocalSnaps: false,
        rejectInvalidPlatformVersion: false,
        requireAllowlist: false,
        forcePreinstalledSnaps: false,
        autoUpdatePreinstalledSnaps: false,
      },
      clientConfig: {
        type: 'extension',
        version: 'MOCK_VERSION',
      },
      getFeatureFlags: expect.any(Function),
      getMnemonicSeed: expect.any(Function),
      preinstalledSnaps: expect.any(Array),
      ensureOnboardingComplete: expect.any(Function),
    });
  });

  it('calls `SnapController:setClientActive` when the client is locked', () => {
    const baseMessenger = new Messenger<
      MockAnyNamespace,
      never,
      KeyringControllerLockEvent
    >({ namespace: MOCK_ANY_NAMESPACE });

    const request = getInitRequestMock(baseMessenger);
    const { initMessenger } = request;

    const spy = jest.spyOn(initMessenger, 'call');

    SnapControllerInit(request);
    baseMessenger.publish('KeyringController:lock');

    expect(spy).toHaveBeenCalledWith('SnapController:setClientActive', false);
  });

  it('calls `SnapController:setClientActive` when the client is unlocked', () => {
    const baseMessenger = new Messenger<
      MockAnyNamespace,
      never,
      KeyringControllerUnlockEvent
    >({ namespace: MOCK_ANY_NAMESPACE });

    const request = getInitRequestMock(baseMessenger);
    const { initMessenger } = request;

    const spy = jest.spyOn(initMessenger, 'call');

    SnapControllerInit(request);
    baseMessenger.publish('KeyringController:unlock');

    expect(spy).toHaveBeenCalledWith('SnapController:setClientActive', true);
  });

  describe('when basic functionality is turned off', () => {
    function setup() {
      const baseMessenger = new Messenger<
        MockAnyNamespace,
        | WebSocketServiceGetAllAction
        | WebSocketServiceCloseAction
        | PreferencesControllerGetStateAction,
        PreferencesControllerStateChangeEvent
      >({ namespace: MOCK_ANY_NAMESPACE });
      let preferences = getDefaultPreferencesControllerState();
      baseMessenger.registerActionHandler(
        'PreferencesController:getState',
        () => preferences,
      );
      const closeMock = jest.fn();
      baseMessenger.registerActionHandler('WebSocketService:getAll', () => [
        { id: 'socket-1', url: 'wss://example.com', protocols: [] },
      ]);
      baseMessenger.registerActionHandler('WebSocketService:close', closeMock);

      const { messengerClient } = SnapControllerInit(
        getInitRequestMock(baseMessenger),
      );
      const stopAllSnaps = createDeferredPromise<void>();
      jest
        .mocked(messengerClient.stopAllSnaps)
        .mockReturnValue(stopAllSnaps.promise);
      Object.defineProperty(messengerClient, 'state', {
        value: { snaps: { 'npm:snap': { id: 'npm:snap' } } },
      });

      const setUseExternalServices = (useExternalServices: boolean) => {
        preferences = { ...preferences, useExternalServices };
        baseMessenger.publish(
          'PreferencesController:stateChange',
          preferences,
          [],
        );
      };
      const finishStopping = async () => {
        stopAllSnaps.resolve();
        await new Promise(process.nextTick);
      };

      return {
        messengerClient,
        closeMock,
        setUseExternalServices,
        finishStopping,
      };
    }

    it('stops all Snaps, then closes their WebSockets', async () => {
      const {
        messengerClient,
        closeMock,
        setUseExternalServices,
        finishStopping,
      } = setup();

      setUseExternalServices(true);
      expect(messengerClient.stopAllSnaps).not.toHaveBeenCalled();

      setUseExternalServices(false);
      expect(messengerClient.stopAllSnaps).toHaveBeenCalledTimes(1);
      expect(closeMock).not.toHaveBeenCalled();

      await finishStopping();
      expect(closeMock).toHaveBeenCalledWith('npm:snap', 'socket-1');
    });

    it('keeps WebSockets open if basic functionality is re-enabled while Snaps are stopping', async () => {
      const { closeMock, setUseExternalServices, finishStopping } = setup();

      setUseExternalServices(false);
      setUseExternalServices(true);
      await finishStopping();

      expect(closeMock).not.toHaveBeenCalled();
    });

    it('logs errors thrown while closing WebSockets', async () => {
      const { closeMock, setUseExternalServices, finishStopping } = setup();
      const error = new Error('close failed');
      closeMock.mockImplementation(() => {
        throw error;
      });
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);

      setUseExternalServices(false);
      await finishStopping();

      expect(consoleErrorSpy).toHaveBeenCalledWith(error);
    });
  });
});
