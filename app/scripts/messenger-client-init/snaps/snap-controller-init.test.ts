import {
  SnapController,
  SnapControllerMessenger,
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
import { MessengerClientInitRequest } from '../types';
import { buildControllerInitRequestMock } from '../test/utils';
import {
  getSnapControllerInitMessenger,
  getSnapControllerMessenger,
  SnapControllerInitMessenger,
} from '../messengers/snaps';
import { getRootMessenger } from '../../lib/messenger';
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
      getFeatureFlags: expect.any(Function),
      getMnemonicSeed: expect.any(Function),
      preinstalledSnaps: expect.any(Array),
      trackEvent: expect.any(Function),
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
});
