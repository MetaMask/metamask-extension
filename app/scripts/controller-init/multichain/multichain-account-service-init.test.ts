import {
  MultichainAccountService,
  BtcAccountProvider,
  TrxAccountProvider,
} from '@metamask/multichain-account-service';
import { ActionConstraint, Messenger } from '@metamask/base-controller';
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

jest.mock('@metamask/multichain-account-service', () => ({
  MultichainAccountService: jest.fn(),
  BtcAccountProvider: jest.fn(),
  TrxAccountProvider: jest.fn(),
}));

function buildInitRequestMock(): jest.Mocked<
  ControllerInitRequest<
    MultichainAccountServiceMessenger,
    MultichainAccountServiceInitMessenger
  >
> {
  const baseControllerMessenger = new Messenger<
    | PreferencesControllerGetStateAction
    | RemoteFeatureFlagControllerGetStateAction
    | ActionConstraint,
    never
  >();

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
  const btcAccountProviderMock = jest.mocked(BtcAccountProvider);
  const trxAccountProviderMock = jest.mocked(TrxAccountProvider);

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

  it('initializes BtcAccountProvider with the correct messenger', () => {
    const requestMock = buildInitRequestMock();
    MultichainAccountServiceInit(requestMock);

    expect(btcAccountProviderMock).toHaveBeenCalledWith(
      requestMock.controllerMessenger,
    );
  });

  it('initializes TrxAccountProvider with the correct messenger', () => {
    const requestMock = buildInitRequestMock();
    MultichainAccountServiceInit(requestMock);

    expect(trxAccountProviderMock).toHaveBeenCalledWith(
      requestMock.controllerMessenger,
    );
  });

  it('includes both Bitcoin and Tron providers in the providers array', () => {
    const requestMock = buildInitRequestMock();
    MultichainAccountServiceInit(requestMock);

    const callArgs = accountTreeControllerClassMock.mock.calls[0][0];
    expect(callArgs.providers).toHaveLength(2);

    expect(btcAccountProviderMock).toHaveBeenCalledTimes(1);
    expect(trxAccountProviderMock).toHaveBeenCalledTimes(1);
  });
});
