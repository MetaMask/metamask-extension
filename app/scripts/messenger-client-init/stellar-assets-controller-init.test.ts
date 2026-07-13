import { MOCK_ANY_NAMESPACE, Messenger } from '@metamask/messenger';

import { StellarAssetsController } from '../controllers/stellar-assets-controller';
import { getRootMessenger } from '../lib/messenger';
import { buildControllerInitRequestMock } from './test/utils';
import { MessengerClientInitRequest } from './types';
import {
  getStellarAssetsControllerInitMessenger,
  getStellarAssetsControllerMessenger,
  type StellarAssetsControllerInitMessenger,
  type StellarAssetsControllerMessenger,
} from './messengers/stellar-assets-controller-messenger';
import { StellarAssetsControllerInit } from './stellar-assets-controller-init';

jest.mock('../controllers/stellar-assets-controller');

function buildInitRequestMock(
  remoteFeatureFlags?: Record<string, unknown>,
): jest.Mocked<
  MessengerClientInitRequest<
    StellarAssetsControllerMessenger,
    StellarAssetsControllerInitMessenger
  >
> {
  const baseControllerMessenger = getRootMessenger();
  const initMessenger = getStellarAssetsControllerInitMessenger(
    new Messenger({ namespace: MOCK_ANY_NAMESPACE }),
  );

  initMessenger.call = jest.fn().mockImplementation((action: string) => {
    if (action === 'RemoteFeatureFlagController:getState') {
      return { remoteFeatureFlags: remoteFeatureFlags ?? {} };
    }
    throw new Error(`Unexpected action: ${action}`);
  });

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getStellarAssetsControllerMessenger(
      baseControllerMessenger,
    ),
    initMessenger,
    persistedState: {
      StellarAssetsController: { accountAssets: {} },
    },
  };
}

describe('StellarAssetsControllerInit', () => {
  const stellarAssetsControllerClassMock = jest.mocked(StellarAssetsController);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns controller instance', () => {
    const requestMock = buildInitRequestMock();
    expect(
      StellarAssetsControllerInit(requestMock).messengerClient,
    ).toBeInstanceOf(StellarAssetsController);
  });

  it('initializes with messenger, state, and isEnabled', () => {
    const requestMock = buildInitRequestMock();
    StellarAssetsControllerInit(requestMock);

    expect(stellarAssetsControllerClassMock).toHaveBeenCalledWith({
      messenger: requestMock.controllerMessenger,
      state: requestMock.persistedState.StellarAssetsController,
      isEnabled: expect.any(Function),
    });
  });

  describe('isEnabled', () => {
    it('enables stellar when stellarAccounts feature flag is enabled', () => {
      const requestMock = buildInitRequestMock({
        stellarAccounts: { enabled: true, minimumVersion: '0.0.0' },
      });

      StellarAssetsControllerInit(requestMock);

      const constructorCall = stellarAssetsControllerClassMock.mock.calls[0][0];
      const isEnabled = constructorCall.isEnabled as () => boolean;

      expect(isEnabled()).toBe(true);
    });

    it('disables stellar when stellarAccounts feature flag is disabled', () => {
      const requestMock = buildInitRequestMock({
        stellarAccounts: { enabled: false, minimumVersion: '0.0.0' },
      });

      StellarAssetsControllerInit(requestMock);

      const constructorCall = stellarAssetsControllerClassMock.mock.calls[0][0];
      const isEnabled = constructorCall.isEnabled as () => boolean;

      expect(isEnabled()).toBe(false);
    });
  });
});
