import { DelegationController } from '@metamask/delegation-controller';
import { Messenger } from '@metamask/base-controller';
import { buildControllerInitRequestMock } from '../test/utils';
import { ControllerInitRequest } from '../types';
import {
  getDelegationControllerMessenger,
  DelegationControllerMessenger,
} from '../messengers/delegation/delegation-controller-messenger';
import { DelegationControllerInit } from './delegation-controller-init';

jest.mock('@metamask/delegation-controller');

function buildInitRequestMock(): jest.Mocked<
  ControllerInitRequest<
    DelegationControllerMessenger,
    DelegationControllerMessenger
  >
> {
  const baseControllerMessenger = new Messenger();
  const delegationMessenger = getDelegationControllerMessenger(
    baseControllerMessenger,
  );

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: delegationMessenger,
    initMessenger: delegationMessenger,
  };
}

describe('DelegationControllerInit', () => {
  const DelegationControllerClassMock = jest.mocked(DelegationController);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns controller instance', () => {
    const requestMock = buildInitRequestMock();
    expect(DelegationControllerInit(requestMock).controller).toBeInstanceOf(
      DelegationController,
    );
  });

  it('initializes with correct messenger and state', () => {
    const requestMock = buildInitRequestMock();
    DelegationControllerInit(requestMock);

    expect(DelegationControllerClassMock).toHaveBeenCalledWith({
      messenger: requestMock.controllerMessenger,
      state: requestMock.persistedState.DelegationController,
      hashDelegation: expect.any(Function),
      getDelegationEnvironment: expect.any(Function),
    });
  });

  it('returns correct API methods', () => {
    const requestMock = buildInitRequestMock();
    const result = DelegationControllerInit(requestMock);

    expect(result.api).toEqual({
      storeDelegationEntry: expect.any(Function),
      signDelegation: expect.any(Function),
      getDelegationEntry: expect.any(Function),
      deleteDelegationEntry: expect.any(Function),
      listDelegationEntries: expect.any(Function),
      getDelegationEntryChain: expect.any(Function),
    });
  });
});
