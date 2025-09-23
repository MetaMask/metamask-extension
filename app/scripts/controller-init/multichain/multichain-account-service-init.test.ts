import { MultichainAccountService } from '@metamask/multichain-account-service';
import { ActionConstraint, Messenger } from '@metamask/base-controller';
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
    PreferencesControllerGetStateAction | ActionConstraint,
    never
  >();

  baseControllerMessenger.registerActionHandler(
    'PreferencesController:getState',
    jest.fn().mockReturnValue({}),
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
    });
  });
});
