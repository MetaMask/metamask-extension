import {
  ClaimsController,
  ClaimsControllerMessenger,
} from '@metamask/claims-controller';
import { ControllerInitRequest } from '../types';
import {
  ClaimsControllerInitMessenger,
  getClaimsControllerInitMessenger,
  getClaimsControllerMessenger,
} from '../messengers/claims/claims-controller-messenger';
import { getRootMessenger } from '../../lib/messenger';
import { buildControllerInitRequestMock } from '../test/utils';
import { ClaimsControllerInit } from './claims-controller-init';

jest.mock('@metamask/claims-controller');

function buildInitRequestMock(): jest.Mocked<
  ControllerInitRequest<
    ClaimsControllerMessenger,
    ClaimsControllerInitMessenger
  >
> {
  const baseControllerMessenger = getRootMessenger<never, never>();

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getClaimsControllerMessenger(baseControllerMessenger),
    initMessenger: getClaimsControllerInitMessenger(baseControllerMessenger),
  };
}

describe('ClaimsControllerInit', () => {
  it('should initialize the controller', () => {
    const request = buildInitRequestMock();
    const controllerInitResult = ClaimsControllerInit(request);
    expect(controllerInitResult).toBeDefined();
    expect(controllerInitResult.controller).toBeInstanceOf(ClaimsController);
  });

  it('should initialize with correct messenger and state', () => {
    const ClaimsControllerClassMock = jest.mocked(ClaimsController);

    const requestMock = buildInitRequestMock();
    ClaimsControllerInit(requestMock);

    expect(ClaimsControllerClassMock).toHaveBeenCalledWith({
      messenger: requestMock.controllerMessenger,
      state: requestMock.persistedState.ClaimsController,
    });
  });
});
