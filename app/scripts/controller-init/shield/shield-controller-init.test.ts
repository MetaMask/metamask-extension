import { Messenger } from '@metamask/base-controller';
import {
  ShieldController,
  ShieldRemoteBackend,
} from '@metamask/shield-controller';
import { buildControllerInitRequestMock } from '../test/utils';
import { ControllerInitRequest } from '../types';
import {
  getShieldControllerInitMessenger,
  getShieldControllerMessenger,
  ShieldControllerInitMessenger,
  ShieldControllerMessengerType,
} from '../messengers/shield/shield-controller-messenger';
import { ShieldControllerInit } from './shield-controller-init';

jest.mock('@metamask/shield-controller');

function buildInitRequestMock(): jest.Mocked<
  ControllerInitRequest<
    ShieldControllerMessengerType,
    ShieldControllerInitMessenger
  >
> {
  const baseControllerMessenger = new Messenger<never, never>();

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getShieldControllerMessenger(baseControllerMessenger),
    initMessenger: getShieldControllerInitMessenger(baseControllerMessenger),
  };
}

describe('ShieldControllerInit', () => {
  it('should initialize the Shield controller', () => {
    const request = buildInitRequestMock();
    const controllerInitResult = ShieldControllerInit(request);
    expect(controllerInitResult).toBeDefined();
    expect(controllerInitResult.controller).toBeInstanceOf(ShieldController);
  });

  it('initializes with correct messenger, state and normalizeSignatureRequest function', () => {
    const backendMock = jest.mocked(ShieldRemoteBackend);

    const request = buildInitRequestMock();
    ShieldControllerInit(request);

    const controllerMock = jest.mocked(ShieldController);

    expect(controllerMock).toHaveBeenCalledWith({
      messenger: request.controllerMessenger,
      state: request.persistedState.ShieldController,
      normalizeSignatureRequest: expect.any(Function),
      backend: expect.any(backendMock),
    });
  });
});
