import { MultichainAccountService } from '@metamask/multichain-account-service';
import {
  ActionConstraint,
  MOCK_ANY_NAMESPACE,
  Messenger,
  MockAnyNamespace,
} from '@metamask/messenger';
import { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';
import { buildControllerInitRequestMock } from '../test/utils';
import { ControllerInitRequest } from '../types';
import {
  getMultichainAccountServiceInitMessenger,
  getMultichainAccountServiceMessenger,
  MultichainAccountServiceInitMessenger,
  MultichainAccountServiceMessenger,
} from '../messengers/accounts';
import { PreferencesControllerGetStateAction } from '../../controllers/preferences-controller';
import { MultichainAccountServiceInit } from './multichain-account-service-init';

jest.mock('@metamask/multichain-account-service');

function buildInitRequestMock(): jest.Mocked<
  ControllerInitRequest<
    MultichainAccountServiceMessenger,
    MultichainAccountServiceInitMessenger
  >
> {
  const baseControllerMessenger = new Messenger<
    MockAnyNamespace,
    | PreferencesControllerGetStateAction
    | RemoteFeatureFlagControllerGetStateAction
    | ActionConstraint,
    never
  >({ namespace: MOCK_ANY_NAMESPACE });

  baseControllerMessenger.registerActionHandler(
    'PreferencesController:getState',
    jest.fn().mockReturnValue({}),
  );

  baseControllerMessenger.registerActionHandler(
    'RemoteFeatureFlagController:getState',
    jest.fn().mockReturnValue({
      remoteFeatureFlags: {
        enableMultichainAccounts: {
          enabled: false,
          featureVersion: null,
          minimumVersion: null,
        },
      },
    }),
  );

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getMultichainAccountServiceMessenger(
      baseControllerMessenger,
    ),
    initMessenger: getMultichainAccountServiceInitMessenger(
      baseControllerMessenger,
    ),
  };
}

describe('MultichainAccountServiceInit', () => {
  const accountTreeControllerClassMock = jest.mocked(MultichainAccountService);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns service instance', () => {
    const requestMock = buildInitRequestMock();
    expect(MultichainAccountServiceInit(requestMock).controller).toBeInstanceOf(
      MultichainAccountService,
    );
  });

  it('initializes with correct messenger and state', () => {
    const requestMock = buildInitRequestMock();
    MultichainAccountServiceInit(requestMock);

    expect(accountTreeControllerClassMock).toHaveBeenCalledWith({
      messenger: requestMock.controllerMessenger,
      providers: expect.any(Array),
    });
  });
});
