import { DelegationController } from '@metamask/delegation-controller';
import { type DelegationControllerMessenger } from '@metamask/delegation-controller';
import { buildControllerInitRequestMock } from '../test/utils';
import type { MessengerClientInitRequest } from '../types';
import { getDelegationControllerMessenger } from '../messengers/delegation/delegation-controller-messenger';
import { getRootMessenger } from '../../lib/messenger';
import { DelegationControllerInit } from './delegation-controller-init';

jest.mock('@metamask/delegation-controller');

function buildInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<DelegationControllerMessenger>
> {
  const baseControllerMessenger = getRootMessenger();
  const controllerMessenger = getDelegationControllerMessenger(
    baseControllerMessenger,
  );

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger,
    initMessenger: undefined,
  };
}

describe('DelegationControllerInit', () => {
  const DelegationControllerClassMock = jest.mocked(DelegationController);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns controller instance', () => {
    const requestMock = buildInitRequestMock();
    expect(
      DelegationControllerInit(requestMock).messengerClient,
    ).toBeInstanceOf(DelegationController);
  });

  it('initializes with correct messenger and state', () => {
    const requestMock = buildInitRequestMock();
    DelegationControllerInit(requestMock);

    expect(DelegationControllerClassMock).toHaveBeenCalledWith({
      messenger: requestMock.controllerMessenger,
      state: requestMock.persistedState.DelegationController,
      getDelegationEnvironment: expect.any(Function),
    });
  });

  it('returns correct API methods', () => {
    const requestMock = buildInitRequestMock();
    const result = DelegationControllerInit(requestMock);

    expect(result.api).toEqual({
      signDelegation: expect.any(Function),
    });
  });
});
